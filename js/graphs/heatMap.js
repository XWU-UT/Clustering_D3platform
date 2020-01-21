// this file includes variables and functions that are related to the
// visualization in the heatmap

// global variable (store) needed for drawing heatmap
// will hold all heatmap related parameters,
var heatMap = {}

function initHeatMap () {
  // layout settings
  heatMap.width = 350 - globalSettings.margin.left - globalSettings.margin.right
  heatMap.height = 330 - globalSettings.margin.top - globalSettings.margin.bottom

  // set scales and axes
  heatMap.xScaleOri = d3.scaleBand().range([0, heatMap.width])
  heatMap.yScaleOri = d3.scaleBand().range([0, heatMap.height])
  heatMap.xAxisOri = d3.axisTop().scale(heatMap.xScaleOri).tickFormat(function (d) {
    return d
  })
  heatMap.yAxisOri = d3.axisLeft().scale(heatMap.yScaleOri).tickFormat(function (d) {
    return d
  })

  initHeatMapSvg()
}

function initHeatMapSvg () {
  // setting for the heatmap
  d3
    .select('#divHeatMap')
    .append('div')
    .attr('id', 'divHM')
    .append('svg')
    .attr('id', 'svgHeatmap')
    .attr('width', heatMap.width + 1.5 * globalSettings.margin.left + 1.5 * globalSettings.margin.right)
    .attr('height', heatMap.height + 1.5 * globalSettings.margin.top + 1.5 * globalSettings.margin.bottom)
    .append('g')
    .attr('id', 'g-heatMap')
    .attr(
      'transform',
      'translate(' + 2 * globalSettings.margin.left + ',' + 2 * globalSettings.margin.top + ')'
    )
  d3
    .select('#divHM')
    .append('div')
    .attr('id', 'divInfo')
    .append('text')
    .attr('id', 'textInfo')
    .attr('height', 300)
    .attr('width', 100)
    .html('')

  d3.select('#g-heatMap').append('g').attr('id', 'g-heatMapOri')
  d3.select('#g-heatMap').append('g').attr('id', 'g-heatMapCo')
  d3
    .select('#g-heatMap')
    .append('g')
    .attr('id', 'g-xAxisOri')
    .attr('class', 'x axis')
  d3
    .select('#g-heatMap')
    .append('g')
    .attr('id', 'g-yAxisOri')
    .attr('class', 'y axis')
}

// visualization of the orignal data according to uploaded data
function updateHeatMap () {
  // setting for the heatmap according to data
  heatMap.cellWidth = heatMap.width / parsedData.keysCol.length
  heatMap.cellHeight = heatMap.height / parsedData.keysRow.length

  heatMap.xScaleOri.domain(parsedData.keysCol)
  heatMap.yScaleOri.domain(parsedData.keysRow)

  globalSettings.colorCoef = colorValueMapping(d3.extent(parsedData.valHeatMap)[0], d3.extent(parsedData.valHeatMap)[1])

  // visualization of the heatmap
  d3.select('#g-heatMapOri').selectAll('.hm').remove()
  d3.select('#g-heatMapOri')
    .selectAll('rect')
    .data(parsedData.valHeatMap)
    .enter()
    .append('rect')
    .attr('width', heatMap.cellWidth)
    .attr('height', heatMap.cellHeight)
    .attr('class', function (d, i) {
      var rowIndex = Math.floor(i / parsedData.keysCol.length)
      var colIndex = i % parsedData.keysCol.length
      return 'r' + parsedData.keysRow[rowIndex] + ' ' + 'c' + parsedData.keysCol[colIndex] + ' ' + 'hm'
    })
    .attr('y', function (d, i) {
      var rowIndex = Math.floor(i / parsedData.keysCol.length)
      return heatMap.yScaleOri(parsedData.keysRow[rowIndex])
    })
    .attr('x', function (d, i) {
      var colIndex = i % parsedData.keysCol.length
      return heatMap.xScaleOri(parsedData.keysCol[colIndex])
    })
    .attr('fill', function (d) {
      return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
    })
    .attr('stroke', 'black')
    .attr('stroke-width', 0)
    .on('mouseover', mouseOverOri)
    .on('mouseout', mouseOutOri)

  // setting of the x&yaxis for the heatmap
  d3
    .select('#g-yAxisOri')
    .call(heatMap.yAxisOri)
    .selectAll('text')
    .attr('class', 'y labelHM')
    .attr('font-weight', 'normal')
    .attr('font-size', 10)
  d3
    .select('#g-xAxisOri')
    .call(heatMap.xAxisOri)
    .selectAll('text')
    .attr('class', 'x labelHM')
    .attr('font-weight', 'normal')
    .attr('font-size', 10)
    .style('text-anchor', 'start')
    .attr('dx', '.5em')
    .attr('dy', '.5em')
    .attr('transform', function (d) {
      return 'rotate(-45)'
    })
}

// visualization of the re-ordered data matrix according to co-clustering results
// data: pure data values: (size:(mxn)x1)
// rowIDs: IDs of rows ordered based on row-clusters
// colIDs: IDs of columns ordered based on col-clusters
function addHeatmap (data, rowIDs, colIDs) {
  // button of toggleTimeline visible
  d3.select('#btnHM').style('opacity', 1)
  // set indicator of co-clustering (=1) or original (=0)
  // and heatmap for original data invisible
  heatMap.activeCo = 1
  d3.select('#g-heatMapOri').style('opacity', 0).style('pointer-events', 'none')

  heatMap.xScaleOri.domain(parsedData.keysCol)
  heatMap.yScaleOri.domain(parsedData.keysRow)

  // visualization of co-clustering results in the heatmap
  d3
    .select('#g-heatMapCo')
    .selectAll('rect')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'cell coclust')
    .attr('width', heatMap.cellWidth)
    .attr('height', heatMap.cellHeight)
    .attr('class', function (d, i) {
      var rowIndex = Math.floor(i / parsedData.keysCol.length)
      var colIndex = i % parsedData.keysCol.length
      return 'hm' + ' ' + 'r' + parsedData.keysRow[rowIndex] + ' ' + 'c' + parsedData.keysCol[colIndex] + ' ' + 'rc' + rowIDs[rowIndex] + ' ' + 'cc' + colIDs[colIndex]
    })
    .attr('y', function (d, i) {
      var rowIndex = Math.floor(i / parsedData.keysCol.length)
      return heatMap.yScaleOri(parsedData.keysRow[rowIndex])
    })
    .attr('x', function (d, i) {
      var colIndex = i % parsedData.keysCol.length
      return heatMap.xScaleOri(parsedData.keysCol[colIndex])
    })
    .attr('fill', function (d) {
      return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
    })
    .on('mouseover', mouseOverCo)
    .on('mouseout', mouseOutCo)

  // make the text in the axies clickable and
  // also make the buttons for select visible
  d3
    .select('#g-heatMap')
    .selectAll('text')
    .on('click', clickLabelHM)
  d3.selectAll('.selHM').style('opacity', 1)
}

// change between the modes of visualizing of the orignal data
// and the co-clustering results when clicking the button "toggleHeatmap"
function toggleHM () {
  // indicator of which heatmap is visible and change when click toggleTL
  var opacityOri = heatMap.activeCo ? 1 : 0
  var pointerEventOri = heatMap.activeCo ? 'auto' : 'none'
  var opacityCo = heatMap.activeCo ? 0 : 1
  var pointerEventCo = heatMap.activeCo ? 'none' : 'auto'

  d3
    .select('#g-heatMapOri')
    .style('opacity', opacityOri)
    .style('pointer-events', pointerEventOri)
  d3
    .select('#g-heatMapCo')
    .style('opacity', opacityCo)
    .attr('pointer-events', pointerEventCo)

  d3.selectAll('.selHM').style('opacity', opacityCo)

  heatMap.activeCo = opacityCo
}
