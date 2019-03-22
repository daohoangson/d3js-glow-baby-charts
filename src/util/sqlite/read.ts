import { parseFromTimeZone } from "date-fns-timezone";
import { readFileSync } from "fs";
import { Database } from "sql.js";
import { findTimeZone, getUTCOffset } from "timezone-support";

import { Info, Row, RowBabyFeedData, RowBabyLog } from "../data";

interface TemporaryMap {
  [t1: string]: {
    [t2: string]: Array<Info | Row>;
  };
}

const _getStartTimestamp = (info: Info, row: RowBabyFeedData | RowBabyLog) => {
  const { start_timestamp } = row;
  if (typeof start_timestamp === "number" && start_timestamp > 0)
    return start_timestamp * 1000;

  const { date_label, start_time_label } = row;
  if (typeof date_label !== "string" || date_label.length === 0)
    throw new Error(`Bad row: ${JSON.stringify(row)}`);

  const { timeZone } = info;
  if (!timeZone)
    throw new Error("Baby info does not contain timezone information");

  const str = `${date_label} ${start_time_label}`.trim();
  const date = parseFromTimeZone(str, { timeZone });
  if (!date) throw new Error(`Could not parse ${str}`);

  return date.getTime();
};

const _getEndTimestamp = (info: Info, row: RowBabyFeedData | RowBabyLog) => {
  const { end_timestamp } = <RowBabyLog>row;
  if (typeof end_timestamp === "number" && end_timestamp > 0)
    return end_timestamp * 1000;

  return _getStartTimestamp(info, row);
};

const _processRow = (
  info: Info,
  row: RowBabyFeedData | RowBabyLog,
  tmp: TemporaryMap
) => {
  const t1 = _getStartTimestamp(info, row);
  if (typeof tmp[t1] === "undefined") tmp[t1] = {};

  const t2 = _getEndTimestamp(info, row);
  if (typeof tmp[t1][t2] === "undefined") tmp[t1][t2] = [];

  tmp[t1][t2].push({ t1, t2, ...row });
};

export default (data: Buffer) => {
  let infoOrNull: Info | null = null;

  const db = new Database(data);
  const tmp: TemporaryMap = { 0: { 0: [] } };

  console.log("Reading table: baby...");
  const babyStmt = db.prepare("SELECT * FROM baby LIMIT 1");
  while (babyStmt.step()) {
    if (infoOrNull !== null)
      throw new Error("Multiple babies are currently not supported");

    const babyRow = babyStmt.getAsObject();
    const { baby_id, birthday, birth_timezone, first_name } = babyRow;

    const timeZone = birth_timezone.toString();
    const tzObj = findTimeZone(timeZone);
    if (!tzObj) throw new Error(`Could not parse time zone ${timeZone}`);
    const { offset: tzOffsetInMinutes } = getUTCOffset(new Date(), tzObj);
    const tzOffset = tzOffsetInMinutes * 60000;

    const birthdayDate = parseFromTimeZone(birthday.toString(), { timeZone });
    if (!birthdayDate) {
      throw new Error(`Could not parse birthday ${birthday}`);
    }

    infoOrNull = {
      key: "info",
      babyId: parseInt(baby_id.toString()),
      birthday: birthdayDate.getTime(),
      firstName: first_name.toString(),
      timeZone,
      tzOffset
    };
    tmp[0][0].push(infoOrNull);

    console.log(`Hello ${infoOrNull.firstName} (#${infoOrNull.babyId}) 🎉`);
  }

  const info = <Info>infoOrNull;
  const { babyId } = info;
  if (!babyId) throw new Error("No baby could be found in the database");

  console.log("Reading table: BabyFeedData...");
  const feedStmt = db.prepare(
    "SELECT * FROM BabyFeedData WHERE baby_id = :babyId"
  );
  let feedCounter = 0;
  feedStmt.bind({ ":babyId": babyId });
  while (feedStmt.step()) {
    // @ts-ignore
    const feedRow: RowBabyFeedData = feedStmt.getAsObject();
    _processRow(info, { key: "feed", ...feedRow }, tmp);

    if (feedCounter % 100 === 0) process.stdout.write(".");
    feedCounter++;
  }
  process.stdout.write("\n");

  console.log("Reading table: BabyLog...");
  const logStmt = db.prepare("SELECT * FROM BabyLog WHERE baby_id = :babyId");
  let logCounter = 0;
  logStmt.bind({ ":babyId": babyId });
  while (logStmt.step()) {
    // @ts-ignore
    const logRow: RowBabyLog = logStmt.getAsObject();
    _processRow(info, logRow, tmp);

    if (logCounter % 100 === 0) process.stdout.write(".");
    logCounter++;
  }
  process.stdout.write("\n");

  const merged: Array<Info | Row> = [];
  Object.keys(tmp)
    .map(v1 => parseInt(v1))
    .sort()
    .forEach(t1 =>
      Object.keys(tmp[t1])
        .map(v2 => parseInt(v2))
        .sort()
        .forEach(t2 => tmp[t1][t2].forEach(row => merged.push(row)))
    );

  return merged;
};
