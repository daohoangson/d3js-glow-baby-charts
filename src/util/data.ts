import { json } from "d3-fetch";

export interface Info {
  babyId: number;
  birthday: number;
  firstName: string;
  key: RowKey;
  timeZone: string;
  tzOffset: number;
}

export interface Row extends RowBabyFeedData, RowBabyLog, Info {
  t1: number;
  t2: number | null;
}

interface RowBabyFeedData {
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
}

interface RowBabyLog {
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
  json("merged.json").then((json: Row[]) => {
    const { key } = options;
    let info: Info = null;
    const rows: Row[] = [];

    json.forEach(row => {
      if (row.key === key) {
        rows.push(row);
      } else if (row.key === "info") {
        info = row;
      }
    });

    return { info, rows };
  });
