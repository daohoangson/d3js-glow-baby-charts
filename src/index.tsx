import { Appbar, Container, Tab, Tabs } from "muicss/react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import weight from "./chart/weight";
import Chart from "./components/Chart";
import SleepCharts from "./components/SleepCharts";

const App = (
  <Container fluid={true}>
    <Tabs justified={true}>
      <Tab
        label={
          <span>
            <i className="fas fa-weight" /> Weight
          </span>
        }
      >
        <Chart renderer={weight} />
      </Tab>
      <Tab
        label={
          <span>
            <i className="fas fa-bed" /> Sleep
          </span>
        }
      >
        <SleepCharts />
      </Tab>
    </Tabs>
  </Container>
);

ReactDOM.render(App, document.getElementById("root"));
