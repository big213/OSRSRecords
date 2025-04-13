import { lookupSymbol } from "giraffeql";
import { AccessControlMap, ExternalQuery } from "../../../types";
import { PaginatedService } from "../../core/services";
import axios from "axios";
import * as admin from "firebase-admin";
import { isCdnUrl, isFileUrl } from "../../helpers/common";
import { File, Submission } from "../../services";
import { Transaction } from "knex";
import { env } from "../../../config";
let bucket;

export class ExternalLinkBackupService extends PaginatedService {
  defaultTypename = "externalLinkBackup";

  defaultQuery: ExternalQuery = {
    id: lookupSymbol,
  };

  filterFieldsMap = {
    id: {},
    "createdBy.id": {},
  };

  sortFieldsMap = {
    id: {},
    createdAt: {},
    updatedAt: {},
  };

  searchFieldsMap = {
    name: {},
  };

  accessControl: AccessControlMap = {};

  // backs up an any externalLinks and updates the externalLinkBackups field
  async backupExternalLinks(
    submissionId: string,
    userId: string,
    externalLinks: string[],
    transaction?: Transaction
  ) {
    const externalLinkBackups: string[] = [];

    const finalExternalLinks: string[] = [];

    if (!bucket) bucket = admin.storage().bucket();

    for (const link of externalLinks) {
      // convert all .gifv to .gif
      // remove all query params
      const validatedLink = link.replace(".gifv", ".gif").replace(/\?.*$/, "");

      // is the link a direct link to a file AND not already a cdn.osrsrecords link?
      if (isFileUrl(validatedLink) && !isCdnUrl(validatedLink)) {
        // if yes, check if there is already a link for it
        const externalLinkBackup = await this.getFirstSqlRecord(
          {
            select: ["id", "file.id"],
            where: {
              url: validatedLink,
            },
            transaction,
          },
          [],
          false
        );

        const extension = validatedLink.split(".").pop();

        // if yes, add the id to the array of ids
        if (externalLinkBackup) {
          externalLinkBackups.push(externalLinkBackup["id"]);

          // if a backup exists, add that in the finalExternalLinks
          finalExternalLinks.push(
            `${env.site.cdn_url}/f/${externalLinkBackup["file.id"]}.${extension}`
          );
        } else {
          // if not, create it and add to the array of ids
          // always replace gifv with gif
          const { data } = await axios.get(validatedLink, {
            responseType: "arraybuffer",
          }).catch((err) => {
            console.log(err.toJSON())
            throw err;
          })

          const location = `backup/${encodeURIComponent(validatedLink)}`;

          await bucket.file(`source/${location}`).save(data);

          const retrievedFile = await bucket.file(`source/${location}`);

          const [metadata] = await retrievedFile.getMetadata();

          // create the file record
          const createdFile = await File.createSqlRecord({
            fields: {
              name: validatedLink,
              location,
              size: metadata.size,
              // bug with gifv files not having proper metadata
              contentType: metadata.contentType,
              createdBy: userId,
            },
            transaction,
          });

          // create the externalLinkBackup record
          const createdExternalLinkBackup = await this.createSqlRecord({
            fields: {
              url: validatedLink,
              file: createdFile[0].id,
              createdBy: userId,
            },
            transaction,
          });

          externalLinkBackups.push(createdExternalLinkBackup[0].id);

          // if a backup created, add that in the finalExternalLinks
          finalExternalLinks.push(
            `${env.site.cdn_url}/f/${createdFile[0].id}.${extension}`
          );
        }
      } else {
        // if no backup created, use the original link
        finalExternalLinks.push(link);
      }
    }

    // if more than 1 link, update the submission
    if (externalLinkBackups.length > 0) {
      await Submission.updateSqlRecord({
        fields: {
          externalLinkBackups,
          externalLinks: finalExternalLinks,
        },
        where: {
          id: submissionId,
        },
        transaction,
      });
    }
  }
}
