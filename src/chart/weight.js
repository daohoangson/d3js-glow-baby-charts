import { axisBottom, axisLeft } from 'd3-axis'
import { extent, max } from 'd3-array'
import { scaleLinear, scaleTime } from 'd3-scale'
import { event, select } from 'd3-selection'
import { line } from 'd3-shape'
import { timeMonth } from 'd3-time'
import { timeFormat } from 'd3-time-format'
import 'd3-transition'

import { fetch } from '../util/data'

const _render = data => {
  const margin = { top: 20, right: 20, bottom: 70, left: 40 }
  const width = 600 - margin.left - margin.right
  const height = 300 - margin.top - margin.bottom

  const tooltip = select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
  const tooltipTimeFormat = timeFormat('%e %B')

  const x = scaleTime()
    .range([0, width])
    .domain(extent(data, d => d.date))

  const y = scaleLinear()
    .range([height, 0])
    .domain([0, max(data, d => d.kg)])

  const svg = select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0, ${height})`)
    .call(axisBottom().scale(x).tickFormat(timeFormat('%b %y')).ticks(timeMonth))

  svg.append('g')
    .attr('class', 'y axis')
    .call(axisLeft().scale(y))

  svg.append('path')
    .data([data])
    .attr('class', 'line')
    .attr('d', line().x(d => x(d.date)).y(d => y(d.kg)))

  svg.selectAll('dot')
    .data(data)
    .enter().append('circle')
    .attr('r', 3)
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.kg))
    .on('mouseover', d => {
      tooltip.transition()
        .duration(200)
        .style('opacity', 0.9)

      tooltip.html(`${tooltipTimeFormat(d.date)}<br/>${d.kg.toFixed(1)}kg`)
        .style('left', event.pageX + 'px')
        .style('top', event.pageY - 28 + 'px')
    })
    .on('mouseout', () => {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })
}

export default function () {
  fetch({ key: 'weight' })
    .then(rows => rows.map(r => ({ date: new Date(r.t1), kg: r.val_float })))
    .then(_render)
}
