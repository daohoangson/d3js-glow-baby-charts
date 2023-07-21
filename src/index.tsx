import { Appbar, Container, Tab, Tabs } from "muicss/react";
import * as React from "react";
import * as ReactDOM from "react-dom";

import feed from "./chart/feed";
import weight from "./chart/weight";
import sleep from "./chart/sleep";
import Chart from "./components/Chart";
import DataLoader from "./components/DataLoader";
import Filter from "./components/Filter";
import Info from "./components/Info";

const App = (
  <DataLoader>
    {({ info, rows }) => (
      <div>
        <Appbar>
          <Container fluid={true}>
            <Info info={info} />
          </Container>
        </Appbar>
        <Container>
          <Filter info={info} rows={rows}>
            {({ filtered }) => (
              <div>
                <Chart renderer={e => weight(e, info, filtered)} />
                <Chart renderer={e => sleep(e, { info, rows: filtered })} />
                <Chart renderer={e => feed(e, { info, rows: filtered })} />
              </div>
            )}
          </Filter>
        </Container>
      </div>
    )}
  </DataLoader>
);

ReactDOM.render(App, document.getElementById("root"));
