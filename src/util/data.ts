import { json } from "d3";

export interface Info {
  babyId: number;
  birthday: number;
  firstName: string;
  key: RowKey;
  timeZone: string;
  tzOffset: number;
}

export type Row = (RowBabyFeedData | RowBabyLog) & {
  t1: number;
  t2: number | undefined;
};

export interface RowBabyFeedData {
  uuid: string;
  baby_id: number;
  action_user_id: number;
  feed_type: number;
  date_label: string;
  start_time_label: string;
  start_timestamp: number;
  breast_left_time: number;
  breast_right_time: number;
  breast_used: string;
  bottle_ml: number;
  pump_left_volume_ml: number;
  pump_right_volume_ml: number;
  pump_total_volume_ml: number;
  pump_duration_sec: number;
  key: RowKey;
}

export interface RowBabyLog {
  uuid: string;
  baby_id: number;
  action_user_id: number;
  date_label: string;
  start_time_label: string;
  start_timestamp: number;
  end_time_label: string;
  end_timestamp: number;
  key: RowKey;
  val_int: number;
  val_str: string;
  val_text: string;
  val_float: number;
  val_unit: string;
  data_1: number;
}

type RowKey =
  | "diaper"
  | "feed"
  | "headcirc"
  | "height"
  | "info"
  | "note"
  | "sleep"
  | "weight";

interface DataOptions {
  key: RowKey;
}

export interface Data {
  info: Info;
  rows: Row[];
}

export default (options: DataOptions): Promise<Data> =>
  json<Row[]>("merged.json").then(json => {
    const { key } = options;
    let infoOrNull: Info | null = null;
    const rows: Row[] = [];

    json.forEach(row => {
      if (row.key === key) {
        rows.push(row);
      } else if (row.key === "info") {
        // @ts-ignore
        infoOrNull = row;
      }
    });

    if (infoOrNull === null) throw new Error("Baby info could not be found");

    return { info: infoOrNull, rows };
  });
