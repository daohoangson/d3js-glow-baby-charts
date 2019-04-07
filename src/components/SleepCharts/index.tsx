import { Tab, Tabs } from "muicss/react";
import * as React from "react";

import sleep from "../../chart/sleep";
import Chart from "../Chart";

const SleepCharts = () => (
  <Tabs justified={true}>
    <Tab label="Blocks">
      <Chart renderer={e => sleep(e, { renderBlocks: true })} />
    </Tab>
    <Tab label="Counts">
      <Chart renderer={e => sleep(e, { renderCounts: true })} />
    </Tab>
    <Tab label="Sums">
      <Chart renderer={e => sleep(e, { renderSums: true })} />
    </Tab>
  </Tabs>
);

export default SleepCharts;
