import { axisBottom, axisLeft } from 'd3-axis'
import { extent, max } from 'd3-array'
import { scaleLinear } from 'd3-scale'
import { event, select } from 'd3-selection'
import 'd3-transition'

import { fetch } from '../util/data'
import tz from '../util/tz'

const AN_HOUR = 3600000
const A_DAY = 86400000

const _prepare = ([[info], sleep]) => {
  const { tzOffset } = info
  const blockData = []
  const counts = {}
  const sums = {}

  const __buildBlockData = (t1, t2, others = {}) => {
    const _t1InTz = t1 - tzOffset

    return {
      dateNumber: Math.ceil(_t1InTz / A_DAY),
      hourOfDay: (_t1InTz % A_DAY) / AN_HOUR,
      hours: (t2 - t1) / AN_HOUR,
      t1,
      t2,
      ...others
    }
  }

  sleep.forEach(r => {
    const zeroAtTz = (Math.ceil(r.t1 / A_DAY) * A_DAY) + tzOffset
    const nextZeroAtTz = zeroAtTz + (zeroAtTz > r.t1 ? 0 : A_DAY)
    const others = { r }

    const newBlockData = []
    if (r.t2 > nextZeroAtTz) {
      // split into two pieces
      if (r.t1 < nextZeroAtTz) newBlockData.push(__buildBlockData(r.t1, nextZeroAtTz, others))
      newBlockData.push(__buildBlockData(nextZeroAtTz, r.t2, others))
    } else {
      newBlockData.push(__buildBlockData(r.t1, r.t2, others))
    }

    newBlockData.forEach(d => {
      blockData.push(d)

      const { dateNumber, hours } = d
      if (typeof counts[dateNumber] === 'undefined') {
        counts[dateNumber] = 0
      }
      counts[dateNumber]++

      if (typeof sums[dateNumber] === 'undefined') {
        sums[dateNumber] = 0
      }
      sums[dateNumber] += hours
    })
  })

  const countData = []
  Object.keys(counts).forEach(dateNumber => {
    countData.push({
      dateNumber,
      count: counts[dateNumber]
    })
  })

  const sumData = []
  Object.keys(sums).forEach(dateNumber => {
    sumData.push({
      dateNumber,
      sum: sums[dateNumber]
    })
  })

  return { blockData, countData, info, sumData }
}

const _render = ({ blockData, countData, info, sumData }) => {
  const { birthday, tzOffset } = info
  const { formatDate: tzFormatDate, formatDayOfMonth, formatTime } = tz({ tzOffset })
  const dayOfBirth = formatDayOfMonth(birthday)

  const __buildXTickValues = domain => {
    const values = []

    for (let value = domain[0]; value < domain[1]; value++) {
      if (formatDayOfMonth(value * A_DAY) === dayOfBirth) {
        values.push(value)
      }
    }

    return values
  }

  const __formatDate = dn => tzFormatDate(dn * A_DAY)

  const dateNumberDomain = extent(blockData, d => d.dateNumber)
  const hourOfDayDomain = extent(blockData, d => d.hourOfDay)

  const margin = { top: 20, right: 20, bottom: 70, left: 40 }
  const width = window.innerWidth - margin.left - margin.right
  const blockSize = width / (dateNumberDomain[1] - dateNumberDomain[0])
  const height = blockSize * (hourOfDayDomain[1] - hourOfDayDomain[0])

  const xTickFormat = dateNumber => `${Math.floor((dateNumber - (birthday - tzOffset) / A_DAY) / 30)}mo`
  const xTickValues = __buildXTickValues(dateNumberDomain)
  const x = scaleLinear().range([0, width]).domain(dateNumberDomain)
  const xAxis = svg => svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height})`)
    .call(axisBottom().scale(x).tickFormat(xTickFormat).tickValues(xTickValues))
  const xValue = d => x(d.dateNumber)
  const newChart = () => {
    const svg = select('body').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g').attr('transform', `translate(${margin.left}, ${margin.top})`)

    xAxis(svg)

    return svg
  }

  const tooltip = select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
  const tooltipShow = html => tooltip.html(html)
    .transition().duration(200)
    .style('opacity', 0.9)
    .style('left', event.pageX + 'px')
    .style('top', event.pageY - 28 + 'px')
  const tooltipHide = () => tooltip.transition().duration(500).style('opacity', 0)

  const __renderBlocks = () => {
    const _blocks = newChart()

    const _y = scaleLinear().range([0, height]).domain(hourOfDayDomain)
    _blocks.append('g').attr('class', 'y axis').call(axisLeft().scale(_y))

    _blocks.selectAll('block')
      .data(blockData).enter().append('rect')
      .attr('x', xValue)
      .attr('y', d => _y(d.hourOfDay))
      .attr('width', blockSize - 1)
      .attr('height', d => blockSize * d.hours)
      .on('mouseover', d => tooltipShow(`${formatTime(d.r.t1)} - ${formatTime(d.r.t2)}`))
      .on('mouseout', () => tooltipHide())
  }

  const __renderCounts = () => {
    const _counts = newChart()

    const _y = scaleLinear().range([height, 0]).domain([0, max(countData, d => d.count)])
    _counts.append('g').attr('class', 'y axis').call(axisLeft().scale(_y))

    _counts.selectAll('bar')
      .data(countData).enter().append('rect')
      .attr('x', xValue)
      .attr('y', d => _y(d.count))
      .attr('width', blockSize - 1)
      .attr('height', d => height - _y(d.count))
      .on('mouseover', d => tooltipShow(`${__formatDate(d.dateNumber)}<br />Sleeps: ${d.count}`))
      .on('mouseout', () => tooltipHide())
  }

  const __renderSums = () => {
    const _counts = newChart()

    const _y = scaleLinear().range([height, 0]).domain([0, max(sumData, d => d.sum)])
    _counts.append('g').attr('class', 'y axis').call(axisLeft().scale(_y))

    _counts.selectAll('bar')
      .data(sumData).enter().append('rect')
      .attr('x', xValue)
      .attr('y', d => _y(d.sum))
      .attr('width', blockSize - 1)
      .attr('height', d => height - _y(d.sum))
      .on('mouseover', d => tooltipShow(`${__formatDate(d.dateNumber)}<br />Hours: ${d.sum}`))
      .attr('height', d => height - _y(d.sum))
  }

  __renderBlocks()
  __renderCounts()
  __renderSums()
}

export default function () {
  Promise.all([
    fetch({ key: 'info' }),
    fetch({ key: 'sleep' })
  ]).then(_prepare)
    .then(_render)
}
