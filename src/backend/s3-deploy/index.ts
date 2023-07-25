import { IncomingMessage, ServerResponse } from "http";

import { uploadToS3 } from "./aws";
import { parseRequest } from "./http";

export default (req: IncomingMessage, res: ServerResponse) => {
  if (req.method !== "POST") {
    res.writeHead(404);
    res.end();
    return;
  }

  parseRequest(req)
    .then(uploadToS3)
    .then((Location) => res.writeHead(301, { Location }))
    .catch((err) => {
      if (typeof err === "number") {
        res.writeHead(err);
      } else {
        console.error(err);
        res.writeHead(500);
      }
    })
    .then(() => res.end());
};
