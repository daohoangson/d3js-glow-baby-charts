#!/usr/local/bin/node

const { parseFromTimeZone } = require("date-fns-timezone");
const fs = require("fs");
const path = require("path");
const sqljs = require("sql.js");
const { findTimeZone, getUTCOffset } = require("timezone-support");

let babyInfo = null;

const main = () => {
  const dbPath =
    typeof process.argv[2] === "string"
      ? path.normalize(process.argv[2])
      : path.join(__dirname, "/../baby.db");
  if (!fs.existsSync(dbPath)) {
    console.error(`Database path ${dbPath} could not be found`);
    process.exit(1);
  }

  const mergedPath =
    typeof process.argv[3] === "string"
      ? path.normalize(process.argv[3])
      : path.join(__dirname, "/../public/merged.json");
  const outputDir = path.dirname(mergedPath);
  if (!fs.existsSync(outputDir)) {
    console.error(`Output directory ${outputDir} could not be found`);
    process.exit(1);
  }

  console.log(`Database path: ${dbPath}`);
  const filebuffer = fs.readFileSync(dbPath);
  const db = new sqljs.Database(filebuffer);
  const tmp = { 0: { 0: [] } };

  console.log("Reading table: baby...");
  const babyStmt = db.prepare("SELECT * FROM baby LIMIT 1");
  while (babyStmt.step()) {
    if (babyInfo !== null) {
      console.error("Multiple babies are currently not supported");
      process.exit(1);
    }

    const babyRow = babyStmt.getAsObject();
    const {
      baby_id: babyId,
      birthday,
      birth_timezone: timeZone,
      first_name: firstName
    } = babyRow;

    const tzObj = findTimeZone(timeZone);
    if (!tzObj) {
      console.error(`Could not parse time zone ${timeZone}`);
    }
    const { offset: tzOffsetInMinutes } = getUTCOffset(new Date(), tzObj);
    const tzOffset = tzOffsetInMinutes * 60000;

    const birthdayDate = parseFromTimeZone(birthday, { timeZone });
    if (!birthdayDate) {
      console.error(`Could not parse birthday ${birthday}`);
      process.exit(1);
    }

    babyInfo = {
      key: "info",
      babyId,
      birthday: birthdayDate.getTime(),
      firstName,
      timeZone,
      tzOffset
    };
    tmp[0][0].push(babyInfo);

    console.log(
      `Found baby #${babyInfo.babyId}. Hello ${babyInfo.firstName} 🎉`
    );
  }

  const { babyId } = babyInfo;
  if (!babyId) {
    console.error("No baby could be found in the database");
    process.exit(1);
  }

  console.log("Reading table: BabyFeedData...");
  const feedStmt = db.prepare(
    "SELECT * FROM BabyFeedData WHERE baby_id = :babyId"
  );
  let feedCounter = 0;
  feedStmt.bind({ ":babyId": babyId });
  while (feedStmt.step()) {
    const feedRow = feedStmt.getAsObject();
    _processRow({ key: "feed", ...feedRow }, tmp);

    if (feedCounter % 100 === 0) process.stdout.write(".");
    feedCounter++;
  }
  process.stdout.write("\n");

  console.log("Reading table: BabyLog...");
  const logStmt = db.prepare("SELECT * FROM BabyLog WHERE baby_id = :babyId");
  let logCounter = 0;
  logStmt.bind({ ":babyId": babyId });
  while (logStmt.step()) {
    const logRow = logStmt.getAsObject();
    _processRow(logRow, tmp);

    if (logCounter % 100 === 0) process.stdout.write(".");
    logCounter++;
  }
  process.stdout.write("\n");

  const merged = [];
  const t1s = Object.keys(tmp)
    .map(v => parseInt(v))
    .sort();
  t1s.forEach(t1 => {
    const t2s = Object.keys(tmp[t1])
      .map(v => parseInt(v))
      .sort();
    t2s.forEach(t2 => {
      tmp[t1][t2].forEach(row => merged.push(row));
    });
  });

  console.log(`Writing ${merged.length} rows: ${mergedPath}`);
  fs.writeFileSync(mergedPath, JSON.stringify(merged, null, 2));

  console.log("OK");
};

const _getStartTimestamp = row => {
  if (row.start_timestamp > 0) return row.start_timestamp * 1000;
  if (!row.date_label) throw new Error(`Bad row: ${JSON.stringify(row)}`);

  const { timeZone } = babyInfo;
  if (!timeZone)
    throw new Error("Baby info does not contain timezone information");

  const str = `${row.date_label} ${row.start_time_label}`.trim();
  const date = parseFromTimeZone(str, { timeZone });
  if (!date) throw new Error(`Could not parse ${str}`);

  return date.getTime();
};

const _getEndTimestamp = row =>
  row.end_timestamp > 0 ? row.end_timestamp * 1000 : _getStartTimestamp(row);

const _processRow = (row, out) => {
  const t1 = _getStartTimestamp(row);
  if (typeof out[t1] === "undefined") out[t1] = {};

  const t2 = _getEndTimestamp(row);
  if (typeof out[t1][t2] === "undefined") out[t1][t2] = [];

  out[t1][t2].push({ t1, t2, ...row });
};

main();
