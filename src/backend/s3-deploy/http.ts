import * as Busboy from "busboy";
import { IncomingMessage } from "http";
import { Readable } from "stream";

import readDb from "../../util/sqlite/read";
import { Info, Row } from "../../util/data";

export function parseRequest(req: IncomingMessage): Promise<Array<Info | Row>> {
  return new Promise((resolve, reject) => {
    let buffer: Buffer | null = null;
    let error: Error | null = null;
    const busboy = new Busboy({ headers: req.headers });

    busboy.on("file", (fieldName: string, file: Readable) => {
      if (fieldName !== "db") {
        return file.resume();
      }

      const chunks: Uint8Array[] = [];
      file.on("data", chunk => chunks.push(chunk));
      file.once("error", e => (error = e));
      file.once("end", () => (error ? null : (buffer = Buffer.concat(chunks))));
    });

    busboy.on("finish", () => {
      if (!buffer) return reject(400);
      if (error) return reject(error);

      let merged;
      try {
        merged = readDb(buffer);
      } catch (e) {
        return reject(e);
      }

      return resolve(merged);
    });

    req.pipe(busboy);
  });
}
