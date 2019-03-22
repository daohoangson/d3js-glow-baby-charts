import { S3 } from "aws-sdk";

import { Info, Row } from "../../util/data";
import moniker from "../../util/moniker";
import { contentType, map as filesMap } from "./files";

const accessKeyId = process.env["S3_DEPLOY_ACCESS_KEY_ID"];
if (!accessKeyId) throw new Error("S3 accessKeyId is missing");

const bucket = process.env["S3_DEPLOY_BUCKET"];
if (!bucket) throw new Error("S3 bucket is missing");

const secretAccessKey = process.env["S3_DEPLOY_SECRET_ACCESS_KEY"];
if (!secretAccessKey) throw new Error("S3 secretAccessKey is missing");

const region = process.env["S3_DEPLOY_REGION"];
const url =
  process.env["S3_DEPLOY_URL"] || `https://s3.amazonaws.com/${bucket}`;

export function uploadToS3(merged: Array<Info | Row>) {
  const s3 = new S3({ accessKeyId, secretAccessKey, region });
  const timestamp = Math.floor(new Date().getTime() / 1000);
  const deployId = `${moniker()}-${timestamp}`;

  const __putObject = (fileName: string, Body: Buffer | string) =>
    new Promise<void>((ok, err) => {
      console.log(`[${deployId}] Uploading ${fileName}...`);
      s3.putObject(
        {
          Body,
          Bucket: <string>bucket,
          Key: `${deployId}/${fileName}`,
          ContentType: contentType(fileName)
        },
        e => (e ? err(e) : ok(console.log(`[${deployId}] ${fileName} OK`)))
      );
    });

  const promises = [
    __putObject("merged.json", JSON.stringify(merged)),
    ...filesMap(({ fileName, buffer }) => __putObject(fileName, buffer))
  ];

  return Promise.all(promises).then(() => `${url}/${deployId}`);
}
