import { lookupSymbol } from "giraffeql";
import { AccessControlMap, ExternalQuery } from "../../../types";
import { PaginatedService } from "../../core/services";
import axios from "axios";
import * as admin from "firebase-admin";
import { isFileUrl } from "../../helpers/common";
import { File, Submission } from "../../services";
import { Transaction } from "knex";
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

    if (!bucket) bucket = admin.storage().bucket();

    for (const link of externalLinks) {
      // is the link a direct link to a file?
      if (isFileUrl(link)) {
        // if yes, check if there is already a link for it
        const externalLinkBackup = await this.getFirstSqlRecord(
          {
            select: ["id"],
            where: {
              url: link,
            },
            transaction,
          },
          [],
          false
        );

        // if yes, add the id to the array of ids
        if (externalLinkBackup) {
          externalLinkBackups.push(externalLinkBackup["id"]);
        } else {
          // if not, create it and add to the array of ids
          const { data } = await axios.get(link, {
            responseType: "arraybuffer",
          });

          const location = `backup/${encodeURIComponent(link)}`;

          await bucket.file(`source/${location}`).save(data);

          const retrievedFile = await bucket.file(`source/${location}`);

          const [metadata] = await retrievedFile.getMetadata();

          // create the file record
          const createdFile = await File.createSqlRecord({
            fields: {
              name: link,
              location,
              size: metadata.size,
              contentType: metadata.contentType,
              createdBy: userId,
            },
            transaction,
          });

          // create the externalLinkBackup record
          const createdExternalLinkBackup = await this.createSqlRecord({
            fields: {
              url: link,
              file: createdFile[0].id,
              createdBy: userId,
            },
            transaction,
          });

          externalLinkBackups.push(createdExternalLinkBackup[0].id);
        }
      }
    }

    // if more than 1 link, update the submission
    if (externalLinkBackups.length > 0) {
      await Submission.updateSqlRecord({
        fields: {
          externalLinkBackups,
        },
        where: {
          id: submissionId,
        },
        transaction,
      });
    }
  }
}
