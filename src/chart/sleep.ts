import * as d3 from "d3";

import { Info, Row } from "../util/data";
import tz, { AN_HOUR, A_DAY } from "../util/tz";

const format2Decimal = d3.format(".2f");

interface BlockDatum {
  dateNumber: number;
  hourOfDay: number;
  hours: number;
  row: Row;
  t1: number;
  t2: number;
}

interface CountDatum {
  dateNumber: number;
  count: number;
}

interface SumDatum {
  dateNumber: number;
  sum: number;
}

interface PreparedData {
  blockData: BlockDatum[];
  countData: CountDatum[];
  info: Info;
  sumData: SumDatum[];
}

interface NumberNumberHashMap {
  [key: string]: number;
}

interface RenderOptions {
  info: Info;
  rows: Row[];

  canvasWidth?: number;

  renderBlocks?: boolean;
  renderCounts?: boolean;
  renderSums?: boolean;
}

const _prepare = (info: Info, rows: Row[]) => {
  const { tzOffset } = info;
  const blockData: BlockDatum[] = [];
  const counts: NumberNumberHashMap = {};
  const sums: NumberNumberHashMap = {};

  const __buildBlockData = (t1: number, t2: number, row: Row): BlockDatum => {
    const _t1InTz = t1 - tzOffset;

    return {
      dateNumber: Math.ceil(_t1InTz / A_DAY),
      hourOfDay: (_t1InTz % A_DAY) / AN_HOUR,
      hours: (t2 - t1) / AN_HOUR,
      t1,
      t2,
      row
    };
  };

  rows.forEach(r => {
    if (r.key !== "sleep") return;

    const zeroAtTz = Math.ceil(r.t1 / A_DAY) * A_DAY + tzOffset;
    const nextZeroAtTz = zeroAtTz + (zeroAtTz > r.t1 ? 0 : A_DAY);

    const newBlockData: BlockDatum[] = [];
    const t2 = r.t2 || r.t1;
    if (t2 > nextZeroAtTz) {
      // split into two pieces
      if (r.t1 < nextZeroAtTz) {
        newBlockData.push(__buildBlockData(r.t1, nextZeroAtTz, r));
      }
      newBlockData.push(__buildBlockData(nextZeroAtTz, t2, r));
    } else {
      newBlockData.push(__buildBlockData(r.t1, t2, r));
    }

    newBlockData.forEach(d => {
      blockData.push(d);

      const { dateNumber, hours } = d;
      if (typeof counts[dateNumber] === "undefined") {
        counts[dateNumber] = 0;
      }
      counts[dateNumber]++;

      if (typeof sums[dateNumber] === "undefined") {
        sums[dateNumber] = 0;
      }
      sums[dateNumber] += hours;
    });
  });

  const countData: CountDatum[] = [];
  Object.keys(counts).forEach(dn => {
    countData.push({
      dateNumber: parseInt(dn),
      count: counts[dn]
    });
  });

  const sumData: SumDatum[] = [];
  Object.keys(sums).forEach(dn => {
    sumData.push({
      dateNumber: parseInt(dn),
      sum: sums[dn]
    });
  });

  return { blockData, countData, info, sumData };
};

const _render = (
  selector: string,
  prepared: PreparedData,
  options: RenderOptions
) => {
  const { blockData, countData, info, sumData } = prepared;
  const { birthday, tzOffset } = info;
  const { formatDate: tzf, formatDayOfMonth, formatTime } = tz({ tzOffset });
  const dayOfBirth = formatDayOfMonth(birthday);

  const __buildXTickValues = (domain: number[]) => {
    const values: number[] = [];

    for (let value = domain[0]; value < domain[1]; value++) {
      if (formatDayOfMonth(value * A_DAY) === dayOfBirth) {
        values.push(value);
      }
    }

    return values;
  };

  const __formatDate = (dn: number) => tzf(dn * A_DAY);

  const [dnMin, dnMax] = d3.extent(blockData, (d: BlockDatum) => d.dateNumber);
  const dateNumberDomain = [dnMin || 0, dnMax || 0];
  const hourOfDayDomain = [0, 23];

  const margin = { top: 20, right: 20, bottom: 70, left: 50 };
  const canvasWidth = options.canvasWidth || window.innerWidth;
  const width = canvasWidth - margin.left - margin.right;
  const blockWidth = width / (dateNumberDomain[1] - dateNumberDomain[0]) - 1;
  const height = 300 - margin.top - margin.bottom;
  const blockHeight = height / 24;

  const x = d3
    .scaleLinear()
    .range([0, width])
    .domain(dateNumberDomain);
  const xValue = (d: BlockDatum | CountDatum | SumDatum) => x(d.dateNumber);
  const newChart = () => {
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
          .axisBottom<number>(x)
          .tickFormat(
            (dn: number) =>
              `${Math.floor((dn - (birthday - tzOffset) / A_DAY) / 30)}mo`
          )
          .tickValues(__buildXTickValues(dateNumberDomain))
      );

    return svg;
  };

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
    tooltip
      .transition()
      .duration(500)
      .style("opacity", 0);

  const __renderBlocks = () => {
    const _blocks = newChart();

    const _y = d3
      .scaleLinear()
      .range([0, height])
      .domain(hourOfDayDomain);
    _blocks
      .append("g")
      .attr("class", "y axis")
      .call(
        d3.axisLeft(_y).tickFormat(d => {
          const hourOfDay = typeof d === "number" ? d : d.valueOf();
          if (hourOfDay === 0) {
            return "🌑";
          } else if (hourOfDay < 12) {
            return `${d}am`;
          } else if (hourOfDay === 12) {
            return "☀️";
          } else {
            return `${hourOfDay - 12}pm`;
          }
        })
      );

    _blocks
      .selectAll("block")
      .data(blockData)
      .enter()
      .append("rect")
      .attr("x", xValue)
      .attr("y", d => _y(d.hourOfDay))
      .attr("width", blockWidth)
      .attr("height", d => blockHeight * d.hours)
      .on("mouseover", (e: MouseEvent, d) => {
        const r = d.row;
        const t2 = r.t2 || r.t1;
        tooltipShow(
          e,
          `${formatTime(r.t1)} -> ${formatTime(t2)}<br />` +
            `Duration: ${format2Decimal((t2 - r.t1) / AN_HOUR)} hours`
        );
      })
      .on("mouseout", () => tooltipHide());
  };

  const __renderCounts = () => {
    const _counts = newChart();

    const _y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(countData, d => d.count) || 0]);
    _counts
      .append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(_y));

    _counts
      .selectAll("bar")
      .data(countData)
      .enter()
      .append("rect")
      .attr("x", xValue)
      .attr("y", d => _y(d.count))
      .attr("width", blockWidth)
      .attr("height", d => height - _y(d.count))
      .on("mouseover", (e: MouseEvent, d) =>
        tooltipShow(e, `${__formatDate(d.dateNumber)}<br />Sleeps: ${d.count}`)
      )
      .on("mouseout", () => tooltipHide());
  };

  const __renderSums = () => {
    const _counts = newChart();

    const _y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(sumData, d => d.sum) || 0]);
    _counts
      .append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(_y));

    _counts
      .selectAll("bar")
      .data(sumData)
      .enter()
      .append("rect")
      .attr("x", xValue)
      .attr("y", d => _y(d.sum))
      .attr("width", blockWidth)
      .attr("height", d => height - _y(d.sum))
      .on("mouseover", (e: MouseEvent, d) =>
        tooltipShow(
          e,
          `${__formatDate(d.dateNumber)}<br />Hours: ${format2Decimal(d.sum)}`
        )
      )
      .attr("height", d => height - _y(d.sum));
  };

  const { renderBlocks, renderCounts, renderSums } = options;
  if (!renderBlocks && !renderCounts && !renderSums) {
    __renderBlocks();
    __renderCounts();
    __renderSums();
  } else {
    if (renderBlocks) __renderBlocks();
    if (renderCounts) __renderCounts();
    if (renderSums) __renderSums();
  }
};

export default (element: Element, options: RenderOptions) =>
  _render(<string>(<unknown>element), _prepare(options.info, options.rows), {
    canvasWidth: element.clientWidth,
    ...options
  });
