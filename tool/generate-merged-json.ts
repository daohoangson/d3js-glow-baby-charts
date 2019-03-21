#!/usr/local/bin/npx ts-node

import { existsSync, writeFileSync } from "fs";
import { dirname, join, normalize } from "path";

import readDb from "../src/util/sqlite/read";

const dbPath =
  typeof process.argv[2] === "string"
    ? normalize(process.argv[2])
    : join(__dirname, "/../baby.db");
if (!existsSync(dbPath)) {
  console.error(`Database path ${dbPath} could not be found`);
  process.exit(1);
}

const mergedPath =
  typeof process.argv[3] === "string"
    ? normalize(process.argv[3])
    : join(__dirname, "/../public/merged.json");
const outputDir = dirname(mergedPath);
if (!existsSync(outputDir)) {
  console.error(`Output directory ${outputDir} could not be found`);
  process.exit(1);
}

try {
  console.log(`Database path: ${dbPath}`);
  const merged = readDb(dbPath);

  console.log(`Writing ${merged.length} rows into ${mergedPath}`);
  writeFileSync(mergedPath, JSON.stringify(merged, null, 2));

  console.log("OK");
} catch (e) {
  console.error(e);
  console.log("Encountered error while reading database, quitting...")
  process.exit(1);
}
