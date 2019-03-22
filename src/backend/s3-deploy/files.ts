import { readFileSync } from "fs";
import { join, extname } from "path";

interface File {
  buffer: Buffer;
  fileName: string;
}

const contentTypes: { [ext: string]: string } = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json"
};

const files: File[] = [
  {
    buffer: readFileSync(
      join(__dirname, "..", "..", "..", "public", "bundle.js")
    ),
    fileName: "bundle.js"
  },
  {
    buffer: readFileSync(
      join(__dirname, "..", "..", "..", "public", "index.html")
    ),
    fileName: "index.html"
  },
  {
    buffer: readFileSync(
      join(__dirname, "..", "..", "..", "public", "sleep.html")
    ),
    fileName: "sleep.html"
  },
  {
    buffer: readFileSync(
      join(__dirname, "..", "..", "..", "public", "weight.html")
    ),
    fileName: "weight.html"
  }
];

export function contentType(fileName: string) {
  const ext = extname(fileName);
  return contentTypes[ext] || "application/octet-stream";
}

export function map<T>(fn: (value: File) => T) {
  return files.map(fn);
}
