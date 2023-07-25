import * as React from "react";

import { Info as InfoType } from "../util/data";
import tz from "../util/tz";

interface InfoProps {
  info: InfoType;
}

export default class Info extends React.Component<InfoProps> {
  render() {
    const { info } = this.props;
    const { format } = tz(info);

    return (
      <h1>
        {info.gender === "F" ? (
          <i className="fas fa-venus" style={{ color: "#8624f5" }} />
        ) : info.gender === "M" ? (
          <i className="fas fa-mars" style={{ color: "#1fc3aa" }} />
        ) : (
          ""
        )}{" "}
        <span id={info.babyId.toString()}>{info.firstName}</span>{" "}
        <span style={{ fontSize: "smaller", opacity: 0.75 }}>
          {format(info.birthday, "%B %d, %Y")}
        </span>
      </h1>
    );
  }
}
