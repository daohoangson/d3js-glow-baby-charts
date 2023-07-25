import * as d3 from "d3";

import { Info, Row, RowBabyFeedData } from "../util/data";
import tz, { A_DAY } from "../util/tz";

interface FeedDatum {
  date: number;
  breastLeftCount: number;
  breastLeftTimeSum: number;
  breastRightCount: number;
  breastRightTimeSum: number;
}

interface PreparedData {
  info: Info;
  feedData: FeedDatum[];
}

interface RenderOptions {
  info: Info;
  rows: Row[];

  canvasWidth?: number;
}

const _prepare = (info: Info, rows: Row[]) => {
  const { tzOffset } = info;
  const feedData: Record<string, FeedDatum> = {};

  rows.forEach((r) => {
    if (r.key !== "feed") return;
    const f = r as RowBabyFeedData;
    const _t1InTz = r.t1 - tzOffset;
    const dateNumber = Math.ceil(_t1InTz / A_DAY);
    const {
      breast_left_time: breastLeftTime,
      breast_right_time: breastRightTime,
    } = f;
    const breastLeftCount = breastLeftTime > 0 ? 1 : 0;
    const breastRightCount = breastRightTime > 0 ? 1 : 0;
    if (typeof feedData[dateNumber] === "undefined") {
      feedData[dateNumber] = {
        date: r.t1,
        breastLeftCount,
        breastLeftTimeSum: breastLeftTime,
        breastRightCount,
        breastRightTimeSum: breastRightTime,
      };
    } else {
      feedData[dateNumber].breastLeftCount += breastLeftCount;
      feedData[dateNumber].breastLeftTimeSum += breastLeftTime;
      feedData[dateNumber].breastRightCount += breastRightCount;
      feedData[dateNumber].breastRightTimeSum += breastRightTime;
    }
  });

  return { info, feedData: Object.keys(feedData).map((dn) => feedData[dn]) };
};

const _render = (
  selector: string,
  prepared: PreparedData,
  options: RenderOptions,
) => {
  const { info, feedData } = prepared;
  const { tzOffset } = info;
  const { formatDate } = tz({ tzOffset });

  const __formatSeconds = (seconds: number) => {
    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)}m`;
    } else {
      return `${Math.floor(seconds / 360) / 10.0}h`;
    }
  };

  const stackColors = {
    breastLeftTimeSum: "#8624f5",
    breastRightTimeSum: "#1fc3aa",
  };
  const stackedFeedData = d3
    .stack<FeedDatum, keyof typeof stackColors>()
    .keys(["breastLeftTimeSum", "breastRightTimeSum"])(feedData);

  const margin = { top: 20, right: 20, bottom: 70, left: 40 };
  const canvasWidth = options.canvasWidth || window.innerWidth;
  const width = canvasWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const tooltip = d3
    .select(selector)
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  const tooltipShow = (e: MouseEvent, html: string) =>
    tooltip
      .html(html)
      .transition()
      .duration(200)
      .style("opacity", 0.9)
      .style("left", e.pageX + "px")
      .style("top", e.pageY - 28 + "px");
  const tooltipHide = () =>
    tooltip.transition().duration(500).style("opacity", 0);

  const [xMin, xMax] = d3.extent(feedData, (d) => d.date);
  const blockWidth = width / ((xMax! - xMin!) / A_DAY) - 1;
  const x = d3
    .scaleTime()
    .range([0, width])
    .domain([xMin || 0, xMax || 0]);

  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([
      0,
      d3.max(feedData, (d) => d.breastLeftTimeSum + d.breastRightTimeSum) || 0,
    ]);

  const svg = d3
    .select(selector)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).tickSizeOuter(0));

  svg
    .append("g")
    .attr("class", "y axis")
    .call(
      d3.axisLeft(y).tickFormat((d) => {
        const seconds = typeof d === "number" ? d : d.valueOf();
        return __formatSeconds(seconds);
      }),
    );

  svg
    .append("g")
    .selectAll("g")
    .data(stackedFeedData)
    .enter()
    .append("g")
    .attr("fill", (d) => stackColors[d.key])
    .selectAll("rect")
    // enter a second time = loop subgroup per subgroup to add all rectangles
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (d) => x(d.data.date))
    .attr("y", (d) => y(d[1]))
    .attr("width", blockWidth)
    .attr("height", (d) => y(d[0]) - y(d[1]))
    .on("mouseover", (e: MouseEvent, d) => {
      const feedDatum = d.data;
      tooltipShow(
        e,
        `${formatDate(feedDatum.date)}<br />` +
          (feedDatum.breastLeftCount > 0
            ? `Left: x${feedDatum.breastLeftCount} ${__formatSeconds(
                feedDatum.breastLeftTimeSum,
              )}<br />`
            : "") +
          (feedDatum.breastRightCount > 0
            ? `Right: x${feedDatum.breastRightCount} ${__formatSeconds(
                feedDatum.breastRightTimeSum,
              )}<br />`
            : ""),
      );
    })
    .on("mouseout", () => tooltipHide());
};

export default (element: Element, options: RenderOptions) =>
  _render(<string>(<unknown>element), _prepare(options.info, options.rows), {
    canvasWidth: element.clientWidth,
    ...options,
  });
