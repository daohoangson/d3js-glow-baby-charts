import { axisBottom, axisLeft } from "d3-axis";
import { extent, max } from "d3-array";
import { format as numberFormat } from "d3-format";
import { scaleLinear } from "d3-scale";
import { event, select, Selection, BaseType } from "d3-selection";
import "d3-transition";

import data, { Info, Row, Data } from "../util/data";
import tz from "../util/tz";

const AN_HOUR = 3600000;
const A_DAY = 86400000;
const format2Decimal = numberFormat(".2f");

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

const _prepare = (result: Data) => {
  const { info, rows } = result;
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
    const zeroAtTz = Math.ceil(r.t1 / A_DAY) * A_DAY + tzOffset;
    const nextZeroAtTz = zeroAtTz + (zeroAtTz > r.t1 ? 0 : A_DAY);

    const newBlockData: BlockDatum[] = [];
    if (r.t2 > nextZeroAtTz) {
      // split into two pieces
      if (r.t1 < nextZeroAtTz)
        newBlockData.push(__buildBlockData(r.t1, nextZeroAtTz, r));
      newBlockData.push(__buildBlockData(nextZeroAtTz, r.t2, r));
    } else {
      newBlockData.push(__buildBlockData(r.t1, r.t2, r));
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

const _render = (prepared: PreparedData) => {
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

  const dateNumberDomain = extent(blockData, (d: BlockDatum) => d.dateNumber);
  const hourOfDayDomain = extent(blockData, (d: BlockDatum) => d.hourOfDay);

  const margin = { top: 20, right: 20, bottom: 70, left: 40 };
  const width = window.innerWidth - margin.left - margin.right;
  const blockSize = width / (dateNumberDomain[1] - dateNumberDomain[0]);
  const height = blockSize * (hourOfDayDomain[1] - hourOfDayDomain[0]);

  const x = scaleLinear()
    .range([0, width])
    .domain(dateNumberDomain);
  const xValue = (d: BlockDatum | CountDatum | SumDatum) => x(d.dateNumber);
  const newChart = () => {
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
        axisBottom(x)
          .tickFormat(
            (dn: number) =>
              `${Math.floor((dn - (birthday - tzOffset) / A_DAY) / 30)}mo`
          )
          .tickValues(__buildXTickValues(dateNumberDomain))
      );

    return svg;
  };

  const tooltip = select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  const tooltipShow = (html: string) =>
    tooltip
      .html(html)
      .transition()
      .duration(200)
      .style("opacity", 0.9)
      .style("left", event.pageX + "px")
      .style("top", event.pageY - 28 + "px");
  const tooltipHide = () =>
    tooltip
      .transition()
      .duration(500)
      .style("opacity", 0);

  const __renderBlocks = () => {
    const _blocks = newChart();

    const _y = scaleLinear()
      .range([0, height])
      .domain(hourOfDayDomain);
    _blocks
      .append("g")
      .attr("class", "y axis")
      .call(axisLeft(_y));

    _blocks
      .selectAll("block")
      .data(blockData)
      .enter()
      .append("rect")
      .attr("x", xValue)
      .attr("y", d => _y(d.hourOfDay))
      .attr("width", blockSize - 1)
      .attr("height", d => blockSize * d.hours)
      .on("mouseover", d => {
        const r = d.row;
        const duration = (r.t2 - r.t1) / AN_HOUR;
        tooltipShow(
          `${formatTime(r.t1)} -> ${formatTime(
            r.t2
          )}<br />Duration: ${format2Decimal(duration)} hours`
        );
      })
      .on("mouseout", () => tooltipHide());
  };

  const __renderCounts = () => {
    const _counts = newChart();

    const _y = scaleLinear()
      .range([height, 0])
      .domain([0, max(countData, d => d.count)]);
    _counts
      .append("g")
      .attr("class", "y axis")
      .call(axisLeft(_y));

    _counts
      .selectAll("bar")
      .data(countData)
      .enter()
      .append("rect")
      .attr("x", xValue)
      .attr("y", d => _y(d.count))
      .attr("width", blockSize - 1)
      .attr("height", d => height - _y(d.count))
      .on("mouseover", d =>
        tooltipShow(`${__formatDate(d.dateNumber)}<br />Sleeps: ${d.count}`)
      )
      .on("mouseout", () => tooltipHide());
  };

  const __renderSums = () => {
    const _counts = newChart();

    const _y = scaleLinear()
      .range([height, 0])
      .domain([0, max(sumData, d => d.sum)]);
    _counts
      .append("g")
      .attr("class", "y axis")
      .call(axisLeft(_y));

    _counts
      .selectAll("bar")
      .data(sumData)
      .enter()
      .append("rect")
      .attr("x", xValue)
      .attr("y", d => _y(d.sum))
      .attr("width", blockSize - 1)
      .attr("height", d => height - _y(d.sum))
      .on("mouseover", d =>
        tooltipShow(
          `${__formatDate(d.dateNumber)}<br />Hours: ${format2Decimal(d.sum)}`
        )
      )
      .attr("height", d => height - _y(d.sum));
  };

  __renderBlocks();
  __renderCounts();
  __renderSums();
};

export default () =>
  data({ key: "sleep" })
    .then(_prepare)
    .then(_render);
