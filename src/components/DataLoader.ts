import { json } from "d3";
import * as React from "react";

import { Info, Row } from "../util/data";

interface ChildrenParam {
  info: Info;
  rows: Row[];
}

interface DataLoaderProps {
  children: (param: ChildrenParam) => React.ReactNode;
}

interface DataLoaderState {
  info?: Info;
  rows?: Row[];
}

export default class DataLoader extends React.Component<
  DataLoaderProps,
  DataLoaderState
> {
  constructor(props: DataLoaderProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    if (!this.props.children) {
      return;
    }

    json<Row[]>("merged.json").then((rows) => {
      const info = <Info>(<unknown>rows[0]);
      if (info.key !== "info") {
        throw new Error("rows[0] is not of type info");
      }

      this.setState(() => ({ info, rows }));
    });
  }

  render() {
    const { children } = this.props;
    const { info, rows } = this.state;

    if (!children || !info || !rows) return "";

    return children({ info, rows });
  }
}
