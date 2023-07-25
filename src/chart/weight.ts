import * as d3 from "d3";

import { Info, Row, RowBabyLog } from "../util/data";
import tz from "../util/tz";

interface WeightDatum {
  date: number;
  kg: number;
}

interface PreparedData {
  info: Info;
  weightData: WeightDatum[];
}

interface RenderOptions {
  info: Info;
  rows: Row[];

  canvasWidth?: number;
}

const _prepare = (info: Info, rows: Row[]) => {
  const weightData: WeightDatum[] = [];

  rows.forEach((r) => {
    if (r.key !== "weight") return;
    weightData.push({ date: r.t1, kg: (<RowBabyLog>r).val_float });
  });

  return { info, weightData };
};

const _render = (
  selector: string,
  prepared: PreparedData,
  options: RenderOptions,
) => {
  const { info, weightData } = prepared;
  const { tzOffset } = info;
  const { formatDate } = tz({ tzOffset });

  const margin = { top: 20, right: 20, bottom: 70, left: 40 };
  const canvasWidth = options.canvasWidth || window.innerWidth;
  const width = canvasWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const tooltip = d3
    .select(selector)
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  const [xMin, xMax] = d3.extent(weightData, (d) => d.date);
  const x = d3
    .scaleTime()
    .range([0, width])
    .domain([xMin || 0, xMax || 0]);

  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(weightData, (d) => d.kg) || 0]);

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
    .attr("transform", `translate(0, ${height})`)
    .call(
      d3
        .axisBottom<Date>(x)
        .tickFormat(d3.timeFormat("%b %y"))
        .ticks(d3.timeMonth),
    );

  svg
    .append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(y).tickFormat((d) => `${d}kg`));

  svg
    .append("path")
    .data([weightData])
    .attr("class", "line")
    .attr(
      "d",
      d3
        .line<WeightDatum>()
        .x((d) => x(d.date))
        .y((d) => y(d.kg)),
    );

  svg
    .selectAll("dot")
    .data(weightData)
    .enter()
    .append("circle")
    .attr("r", 3)
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.kg))
    .on("mouseover", (e: MouseEvent, d) => {
      tooltip.transition().duration(200).style("opacity", 0.9);

      tooltip
        .html(`${formatDate(d.date)}<br/>${d.kg.toFixed(1)}kg`)
        .style("left", e.pageX + "px")
        .style("top", e.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });
};

export default (element: Element, options: RenderOptions) =>
  _render(<string>(<unknown>element), _prepare(options.info, options.rows), {
    canvasWidth: element.clientWidth,
    ...options,
  });
