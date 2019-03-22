import { axisBottom, axisLeft } from "d3-axis";
import { extent, max } from "d3-array";
import { scaleLinear, scaleTime } from "d3-scale";
import { event, select } from "d3-selection";
import { line } from "d3-shape";
import { timeMonth } from "d3-time";
import { timeFormat } from "d3-time-format";
import "d3-transition";

import data, { Data, Info, RowBabyLog } from "../util/data";
import tz from "../util/tz";

interface WeightDatum {
  date: number;
  kg: number;
}

interface PreparedData {
  info: Info;
  weightData: WeightDatum[];
}

const _prepare = (data: Data) => {
  const { info, rows } = data;

  const weightData = rows.map(
    (r): WeightDatum => ({ date: r.t1, kg: (<RowBabyLog>r).val_float })
  );

  return { info, weightData };
};

const _render = (data: PreparedData) => {
  const { info, weightData } = data;
  const { tzOffset } = info;
  const { formatDate } = tz({ tzOffset });

  const margin = { top: 20, right: 20, bottom: 70, left: 40 };
  const width = 600 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const tooltip = select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const [xMin, xMax] = extent(weightData, d => d.date);
  const x = scaleTime()
    .range([0, width])
    .domain([xMin || 0, xMax || 0]);

  const y = scaleLinear()
    .range([height, 0])
    .domain([0, max(weightData, d => d.kg) || 0]);

  const svg = select("body")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .call(
      axisBottom<Date>(x)
        .tickFormat(timeFormat("%b %y"))
        .ticks(timeMonth)
    );

  svg
    .append("g")
    .attr("class", "y axis")
    .call(axisLeft(y));

  svg
    .append("path")
    .data([weightData])
    .attr("class", "line")
    .attr(
      "d",
      line<WeightDatum>()
        .x(d => x(d.date))
        .y(d => y(d.kg))
    );

  svg
    .selectAll("dot")
    .data(weightData)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.kg))
    .on("mouseover", d => {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0.9);

      tooltip
        .html(`${formatDate(d.date)}<br/>${d.kg.toFixed(1)}kg`)
        .style("left", event.pageX + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip
        .transition()
        .duration(500)
        .style("opacity", 0);
    });
};

export default () =>
  data({ key: "weight" })
    .then(_prepare)
    .then(_render);
