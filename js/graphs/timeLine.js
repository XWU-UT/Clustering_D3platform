// this file includes variables and functions that are related to the
// visualization in the timeline

// global variable (store) needed for drawing timeline
// will hold all timeLine related parameters, line generator functions etc.
var timeLine = {}

// initializes x/y scale and axes for the timeline graph
function initTimeLine () {
  // layout settings
  timeLine.width = 350 - globalSettings.margin.left - globalSettings.margin.right
  timeLine.height = 150 - globalSettings.margin.top - globalSettings.margin.bottom
  timeLine.wPoints = 5
  timeLine.hPoints = 5

  // set scales and axes
  timeLine.xScale = d3.scaleLinear().rangeRound([0, timeLine.width])
  timeLine.yScaleOri = d3.scaleLinear().rangeRound([timeLine.height, 0])
  timeLine.yScaleCo = d3.scaleLinear().range([timeLine.height, globalSettings.ypadding])
  timeLine.xAxisTL = d3
    .axisBottom()
    .scale(timeLine.xScale)
    .ticks(parsedData.keysCol.length)
    .tickFormat(function (d) {
      return Object.keys(parsedData.colBased)[d]
    })
  timeLine.yAxisOri = d3.axisLeft().scale(timeLine.yScaleOri).ticks(5)
  timeLine.yAxisCo = d3.axisRight().scale(timeLine.yScaleCo).tickFormat(function (d, i) {
    return 'col-Clust' + (i + 1)
  })

  // line generators
  timeLine.lineOri = d3
    .line()
    .x(function (d) {
      // use the index instead of real values for drawing lines
      // so to be used for different datasets
      return timeLine.xScale(d.idx)
    })
    .y(function (d) {
      return timeLine.yScaleOri(d.val)
    })

  timeLine.lineCo = d3
    .line()
    .x(function (d, i) {
      return timeLine.xScale(i)
    })
    .y(function (d) {
      return timeLine.yScaleCo(d)
    })

  initTimeLineSvg()
}

function initTimeLineSvg () {
  // setting for the timeline
var svgTimeline = d3
    .select('#divTimeline')
    .append('svg')
    .attr('id', 'svgTimeline')
    .attr('width', timeLine.width + globalSettings.margin.left + globalSettings.margin.right)
    .attr('height', timeLine.height + globalSettings.margin.top + globalSettings.margin.bottom)
    .append('g')
    .attr('id', 'g-TL')
    .attr('transform', 'translate(' + globalSettings.margin.left + ',' + globalSettings.margin.top + ')')
  svgTimeline
    .append('g')
    .attr('id', 'g-xAxisTL')
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + (timeLine.height - globalSettings.ypadding) + ')')
  svgTimeline
    .append('g')
    .attr('id', 'g-yAxisTLOri')
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + -globalSettings.ypadding + ')')
  svgTimeline
    .append('g')
    .attr('id', 'g-yAxisTLCo')
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + -globalSettings.ypadding + ')')
  svgTimeline
    .append('g')
    .append('path')
    .attr('id', 'pathTimelineOri')
  svgTimeline
    .append('g')
    .append('path')
    .attr('id', 'pathTimelineCo')

    // setting for the points in the timeline
  svgTimeline
    .append('g')
    .attr('id', 'g-TLPointsOri')
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + -globalSettings.ypadding + ')')
  svgTimeline
    .append('g')
    .attr('id', 'g-TLPointsCo')
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + -globalSettings.ypadding + ')')
}

// visualizaiton of timeline based on uploaded data
function updateTimeLine () {
  var meanCol = columnMean(parsedData.colBased)
  // set the domains for yScaleTLOri, xScaleTL
  timeLine.yScaleOri.domain(
    d3.extent(meanCol, function (d) {
      return d.val
    })
  )
  timeLine.xScale.domain(d3.extent(Object.keys(parsedData.colBased)))
  timeLine.xScale.domain(d3.extent(Array.from(Array(Object.keys(parsedData.colBased).length).keys())))

  // update yAxisTLOri and xAxisTL
  d3.select('#g-xAxisTL')
    .call(timeLine.xAxisTL)
    .selectAll('text')
    .attr('font-weight', 'normal')
    .style('text-anchor', 'end')
    .attr('dx', '.8em')
    .attr('dy', '.5em')
    .attr('transform', function (d) {
      return 'rotate(-30)'
    })
  d3.select('#g-yAxisTLOri')
    .call(timeLine.yAxisOri)

  // attach data to x&yaxis and draw the linear timeline of the orignal dataset
  d3.select('#pathTimelineOri')
    .datum(meanCol)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', 2)
    .attr('d', timeLine.lineOri)
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + -globalSettings.ypadding + ')')

  // draw points in the timeline
  d3.select('#g-TLPointsOri')
    .selectAll('rect').remove()
  d3.select('#g-TLPointsOri')
    .selectAll('rect')
    .data(meanCol)
    .enter()
    .append('rect')
    .attr('id', function (d) {
      return 'c' + d.col
    })
    .attr('x', function (d) {
      return timeLine.xScale(d.idx) - timeLine.wPoints / 2
    })
    .attr('y', function (d) {
      return timeLine.yScaleOri(d.val) - timeLine.hPoints / 2
    })
    .attr('height', timeLine.wPoints)
    .attr('width', timeLine.hPoints)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', 'black')
    .on('mouseover', mouseOverOri)
    .on('mouseout', mouseOutOri)
}

// function to add the linear timeline to indicate year-cluster membership
// after co-clustering
// clabel: indicates which col-cluster each column (from 1 to n) belongs to
function addTimeline (clabel) {
  // now the timeline is used to visualize the co-clustering results
  // and the one for the original data invisible
  // and the button of toggleTimeline visible
  d3.select('#btnTL').style('opacity', 1)
  timeLine.activeCo = true
  d3.select('#g-yAxisTLOri').style('opacity', 0)
  d3.select('#pathTimelineOri').style('opacity', 0)
  d3
    .select('#g-TLPointsOri')
    .style('opacity', 0)
    .style('pointer-events', 'none')

  // attach/update data to x&yaxis and draw the timeline and points
  timeLine.yScaleCo.domain(d3.extent(clabel))
  timeLine.yAxisCo.ticks(d3.max(clabel))
  d3
    .select('#g-yAxisTLCo')
    .call(timeLine.yAxisCo)
    .selectAll('text')
    .attr('font-weight', 'normal')
    .style('text-anchor', 'end')
    .attr('transform', 'translate(' + 0 + ',' + -globalSettings.ypadding + ')rotate(-30)')
  d3
    .select('#pathTimelineCo')
    .datum(clabel)
    .attr('d', timeLine.lineCo)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('stroke-width', 2)
    .attr('transform', 'translate(' + globalSettings.xpadding + ',' + -2 * globalSettings.ypadding + ')')
  d3
    .select('#g-TLPointsCo')
    .selectAll('rect')
    .data(clabel)
    .enter()
    .append('rect')
    .attr('id', function (d, i) {
      return 'c' + parsedData.keysCol[i]
    })
    .attr('class', function (d) {
      return 'tl' + ' ' + 'cc' + d
    })
    .attr('x', function (d, i) {
      return timeLine.xScale(i) - timeLine.wPoints / 2
    })
    .attr('y', function (d) {
      return timeLine.yScaleCo(d) - timeLine.hPoints / 2
    })
    .attr('width', timeLine.wPoints)
    .attr('height', timeLine.hPoints)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('transform', 'translate(0,' + -globalSettings.ypadding + ')')
    .on('mouseover', mouseOverCo)
    .on('mouseout', mouseOutCo)
}

// change between the modes of visualizing of the orignal data
// and the co-clustering results when clicking the button "toggleTimeline"
function toggleTL () {
  // indicator of which timeine is visible and change when click toggleTL
  var opacityTLOri = timeLine.activeCo ? 1 : 0
  var pointerEventTLOri = timeLine.activeCo ? 'auto' : 'none'
  var opacityTLCo = timeLine.activeCo ? 0 : 1
  var pointerEventTLCo = timeLine.activeCo ? 'none' : 'auto'

  d3.select('#g-yAxisTLOri').style('opacity', opacityTLOri)
  d3.select('#pathTimelineOri').style('opacity', opacityTLOri)
  d3
    .select('#g-TLPointsOri')
    .style('opacity', opacityTLOri)
    .style('pointer-events', pointerEventTLOri)

  d3.select('#g-yAxisTLCo').style('opacity', opacityTLCo)
  d3.select('#pathTimelineCo').style('opacity', opacityTLCo)
  d3
    .select('#g-TLPointsCo')
    .style('opacity', opacityTLCo)
    .style('pointer-events', pointerEventTLCo)

  timeLine.activeCo = opacityTLCo
}
