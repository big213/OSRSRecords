import * as functions from "firebase-functions";
import { env } from "../../config";
import { File } from "../../schema/services";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createHandler } = require("image-resizing");

const handler = createHandler({
  sourceBucket: env.serve_image.source_bucket,
  cacheBucket: env.serve_image.cache_bucket,
});

export const serveImage = functions.https.onRequest(async (req, res) => {
  // if the url matches /f/xyz(?v=1), look up the url and rewrite the url
  const fileId = req.originalUrl.match(/^\/f\/([^\.]*)\.?([a-zA-Z0-9]*)/)?.[1];
  if (fileId) {
    const file = await File.getFirstSqlRecord({
      select: ["location"],
      where: {
        id: fileId,
      },
    });

    req.url = encodeURIComponent(file.location);
  }

  return handler(req, res);
});
