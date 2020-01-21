// this file includes four functions to realize the linked visualizations among
// geomap, timeline, heatmap and small multiples.
// functions mouseOverOri and mouseOutOri are used for interactions among visualizations
// of the original data while mouseOverCo and mouseOutCo used for interactions
// among visualizations of the co-clustering results

// multiple linked visualizations (geomap, timeline and heatmap) of the original
// data when mouseover each of visualization: highlight mouseovered vis, and
// change the value or highlight others
var mouseOverOri = function () {
  var item = d3.select(this)
  if (item.attr('id')) {
    // map&TLpoints is mouseover
    var itemID = item.attr('id')
    // highlight the records in the heatmap
    heatMap.selRectsOri = d3.selectAll('.' + itemID)
    var rect1 = heatMap.selRectsOri.nodes()[0]
    var rectn = heatMap.selRectsOri.nodes()[heatMap.selRectsOri.nodes().length - 1]
    heatMap.boundHeightOri = Math.abs(rectn.getAttribute('y') - rect1.getAttribute('y'))
    heatMap.boundWidthOri = Math.abs(rectn.getAttribute('x') - rect1.getAttribute('x'))
    heatMap.boundXOri = Math.min(rect1.getAttribute('x'), rectn.getAttribute('x'))
    heatMap.boundYOri = Math.min(rect1.getAttribute('y'), rectn.getAttribute('y'))

    d3
      .select('#g-heatMapOri')
      .append('rect')
      .attr('id', 'HMBound')
      .attr('x', heatMap.boundXOri)
      .attr('y', heatMap.boundYOri)
      .attr('height', heatMap.boundHeightOri + heatMap.cellHeight)
      .attr('width', heatMap.boundWidthOri + heatMap.cellWidth)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')

    if (itemID.substr(0, 1) === 'r') {
      // map is mouseover, highlight selected polygon and then change
      // the value of timeline
      item
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)
      // change the value of timeline: linear timeline & points
      var valRow = parsedData.rowBased[itemID.substr(1)]
      timeLine.yScaleOri.domain(
        d3.extent(valRow, function (d) {
          return d.val
        })
      )
      d3
        .select('#pathTimelineOri')
        .datum(valRow)
        .transition()
        .duration(500)
        .attr('d', timeLine.lineOri)

      d3
        .select('#g-TLPointsOri')
        .selectAll('rect')
        .data(valRow)
        .transition()
        .duration(500)
        .attr('y', function (d) {
          return timeLine.yScaleOri(d.val) - timeLine.hPoints / 2
        })
    } else {
      // TLpoints is mouseovered, highlight it and then change the value
      // of the geomap (indicated by color) and highlight records in heatmap
      item
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 3)

      // change the value of geomap and its legend
      timeLine.selectedTime = itemID.substr(1)
      var valCol = parsedData.colBased[timeLine.selectedTime]
      mapLegend.legendVal = []
      valCol.forEach(function (r) {
        var rowID = '#r' + r.row
        mapLegend.legendVal.push(+r.val)

        d3
          .select(rowID)
          .transition()
          .duration(500)
          .style('fill', globalSettings.colorScheme(globalSettings.colorCoef.a * r.val + globalSettings.colorCoef.b))
      })

      mapLegend.legendVal.sort(function (a, b) {
        return a - b
      })
      mapLegend.xScale.domain(d3.extent(mapLegend.legendVal))
      mapLegend.xAxis.scale(mapLegend.xScale)
      d3
        .select('#svgMapLegend')
        .selectAll('rect')
        .data(mapLegend.legendVal)
        .transition()
        .duration(1000)
        .style('fill', function (d) {
          return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
        })

      d3
        .select('#svgMapLegend')
        .selectAll('text')
        .data(mapLegend.legendVal)
        .transition()
        .duration(1000)
        .text(function (d, i) {
          if (i % 5 === 0) {
            return Math.floor(d * 100) / 100
          }
        })
    }
  } else {
    // heatmap is mouseovered, highlight it and aslo corresponding record
    // in geomap and timeline (points)
    var itemClass = item.attr('class')
    var rowID = itemClass.split(' ')[0]
    var colID = itemClass.split(' ')[1]

    item
      .transition()
      .duration(500)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)

    d3.select('#divHeatMap')
      .select('#textInfo')
      .html('row: ' + rowID.slice(1) + '<br/>' + map.rowNames[rowID.slice(1)] + '<br/>' + 'col: ' + colID.slice(1) + '<br/>' + 'value: ' + item.data())

    var rowIDMap = '#' + rowID
    var colIDTL = '#' + colID
    // geomap
    d3
      .select(rowIDMap)
      .transition()
      .duration(500)
      .attr('stroke', 'orange')
      .attr('stroke-width', 5)
    // tlpoints
    d3
      .select(colIDTL)
      .transition()
      .duration(500)
      .attr('stroke', 'orange')
      .attr('stroke-width', 3)
  }
}

// function matching mouseOverOri: multiple linked visualizations of the raw
// data when mouseout each of visualization
var mouseOutOri = function () {
  var item = d3.select(this)

  if (item.attr('id')) {
    // map&TLpoints
    var itemID = item.attr('id')
    // unhighlight the records in the heatmap
    d3.select('#HMBound').remove()

    if (itemID.substr(0, 1) === 'r') {
      // geomap is mouseout, then update others
      item
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
    } else {
      // TLpoints is mouseout, then update others
      item
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
    }
  } else {
    // heatmap is mouseout, update others
    item.transition().duration(500).attr('stroke-width', 0)

    var itemClass = item.attr('class')
    var rowID = '#' + itemClass.split(' ')[0]
    var colID = '#' + itemClass.split(' ')[1]

    d3.select('#divHeatMap')
      .select('#textInfo')
      .html('')

    // geomap
    d3
      .select(rowID)
      .transition()
      .duration(500)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
    // tlpoints
    d3
      .select(colID)
      .transition()
      .duration(500)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
  }
}

// multiple linked visualizations (geomap, timeline, heatmap and small mulitples)
// of the co-clustering results when mouseover each of visualization: highlight
// mouseovered vis, and highlight others
var mouseOverCo = function () {
  var item = d3.select(this)
  var itemClass = item.attr('class')
  if (itemClass.includes('r')) {
    // geomap & small mulitples & heatmaps mouseover
    if (itemClass.includes('map')) {
      // geomap mouseover: all stations in that station-cluster highlighted
      // in the map and also small multiples
      var indRowClust = itemClass.split(' ')[1]
      // geomap highlighted
      d3
        .select('#svgMap')
        .selectAll('.' + indRowClust)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)

      // small multiples highlighted
      smallMultiples.SVGs.selectAll('.' + indRowClust)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)
      // heatmap
      heatMap.selRectsCo = d3.select('#g-heatMapCo').selectAll('.' + indRowClust)
      var numCol = parsedData.keysCol.length
      var bounds = []
      var numBounds = 0
      // create a rectangle to cover the highlighted rectangles
      var rowNum = heatMap.selRectsCo.nodes().length / numCol
      var rect0 = heatMap.selRectsCo.nodes()[0]
      bounds[numBounds] = []
      bounds[numBounds].push(rect0)
      for (var i = 0; i < rowNum-1; i++) {
        var rect1 = heatMap.selRectsCo.nodes()[i * numCol]
        var rect2 = heatMap.selRectsCo.nodes()[(i + 1) * numCol]
        if (Math.abs(rect2.getAttribute('y') - rect1.getAttribute('y')) > (heatMap.cellHeight + 0.1)) {
          numBounds = numBounds + 1
          bounds[numBounds] = []
          bounds[numBounds].push(rect2)
        } else {
          bounds[numBounds].push(rect2)
        }
      }

      for (var j = 0; j < numBounds + 1; j++) {
        var numRows = bounds[j].length
        var boundHeightCo, boundYCo
        if (numRows > 1) {
          let rect1 = bounds[j][0]
          let rectn = bounds[j][numRows - 1]
          boundHeightCo = Math.abs(rectn.getAttribute('y') - rect1.getAttribute('y'))
          boundYCo = Math.min(rect1.getAttribute('y'), rectn.getAttribute('y'))
        } else {
          let rect1 = bounds[j][0]
          boundHeightCo = 0
          boundYCo = rect1.getAttribute('y')
        }

        d3
          .select('#g-heatMapCo')
          .append('rect')
          .attr('class', 'HMBoundCo')
          .attr('x', 0)
          .attr('y', boundYCo)
          .attr('height', boundHeightCo + heatMap.cellHeight)
          .attr('width', numCol * heatMap.cellWidth)
          .attr('stroke', 'black')
          .attr('stroke-width', 1.5)
          .attr('fill', 'none')
      }
    } else if (itemClass.includes('hm')) {
      // heatmap is mouseovered, highlight it and aslo corresponding record
      // in geomap and timeline (points), related co-cluster highlighted in small multiples
      var indRow = itemClass.split(' ')[1]
      var indCol = itemClass.split(' ')[2]
      var indRowClust = itemClass.split(' ')[3]
      var indColClust = itemClass.split(' ')[4]

      item
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5)

      d3.select('#divHeatMap')
        .select('#textInfo')
        .html('row: ' + indRow.slice(1) + '<br/>' + map.rowNames[indRow.slice(1)] + '<br/>' + 'col: ' + indCol.slice(1) + '<br/>' + 'row-cluster: ' + indRowClust.slice(2) + '<br/>' + 'col-cluster: ' + indColClust.slice(2) + '<br/>' + 'value: ' + item.data())

      // geomap
      d3
        .select('#svgMap')
        .select('#' + indRow)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)
      // tlpoints
      d3
        .select('#g-TLPointsCo')
        .select('#' + indCol)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 3)
      // small multiples
      // small mulitples highlighted
      smallMultiples.SVGs.selectAll('.' + indRowClust)
        .filter('.' + indColClust)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)
    } else {
      // small multiples
      // selected co-clusters highlighted corresponding rows highlighted in
      // geomap and columns highlighted in timeline (points)
      var indRowClust = itemClass.split(' ')[1]
      var indColClust = itemClass.split(' ')[2]
      // geomap highlighted
      d3
        .select('#svgMap')
        .selectAll('.' + indRowClust)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)

      // small mulitples highlighted
      smallMultiples.SVGs.selectAll('.' + indRowClust)
        .filter('.' + indColClust)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)

      // tlpoints
      d3
        .select('#g-TLPointsCo')
        .selectAll('.' + indColClust)
        .transition()
        .duration(500)
        .attr('stroke', 'orange')
        .attr('stroke-width', 3)
    }
  } else {
    // when timeline points are mouseovered, points belonging to the same
    // col-cluster are highlighted, records in heatmap in that col-cluster
    // highlighted and small mulitples containing that co-cluster highlighted
    vis = itemClass.split(' ')[0]
    indColClust = itemClass.split(' ')[1]

    // tlpoints
    d3
      .select('#g-TLPointsCo')
      .selectAll('.' + indColClust)
      .transition()
      .duration(500)
      .attr('stroke', 'orange')
      .attr('stroke-width', 3)

    // small mulitples
    smallMultiples.SVGs.selectAll('.' + indColClust)
      .transition()
      .duration(500)
      .attr('stroke', 'orange')
      .attr('stroke-width', 5)

    // heatmap
    heatMap.selRectsCo = d3.select('#g-heatMapCo').selectAll('.' + indColClust)
    var numRow = parsedData.keysRow.length
    var bounds = []
    var numBounds = 0
    // create a rectangle to cover the highlighted rectangles
    var colNum = heatMap.selRectsCo.nodes().length / numRow
    var rect0 = heatMap.selRectsCo.nodes()[0]
    bounds[numBounds] = []
    bounds[numBounds].push(rect0)
    for (let i = 0; i < colNum - 1; i++) {
      var rect1 = heatMap.selRectsCo.nodes()[i]
      var rect2 = heatMap.selRectsCo.nodes()[i + 1]
      if (Math.abs(rect2.getAttribute('x') - rect1.getAttribute('x')) > (heatMap.cellWidth + 0.1)) {
        numBounds = numBounds + 1
        bounds[numBounds] = []
        bounds[numBounds].push(rect2)
      } else {
        bounds[numBounds].push(rect2)
      }
    }

    for (let j = 0; j < numBounds + 1; j++) {
      var numCols = bounds[j].length
      var boundWidthCo, boundXCo
      if (numCols > 1) {
        let rect1 = bounds[j][0]
        let rectn = bounds[j][numCols - 1]
        boundWidthCo = Math.abs(rectn.getAttribute('x') - rect1.getAttribute('x'))
        boundXCo = Math.min(rect1.getAttribute('x'), rectn.getAttribute('x'))
      } else {
        let rect1 = bounds[j][0]
        boundWidthCo = 0
        boundXCo = rect1.getAttribute('x')
      }

      d3
        .select('#g-heatMapCo')
        .append('rect')
        .attr('class', 'HMBoundCo')
        .attr('x', boundXCo)
        .attr('y', 0)
        .attr('height',numRow * heatMap.cellHeight)
        .attr('width', boundWidthCo + heatMap.cellWidth)
        .attr('stroke', 'black')
        .attr('stroke-width', 1.5)
        .attr('fill', 'none')
    }
  }
}

// function matching mouseOverCo: multiple linked visualizations of the co-clustering
// results when mouseout each of visualization
var mouseOutCo = function () {
  var item = d3.select(this)
  var itemClass = item.attr('class')

  if (itemClass.includes('r')) {
    if (itemClass.includes('map')) {
      // geomap mouseout
      var indRowClust = itemClass.split(' ')[1] // rc1
      d3
        .select('#svgMap')
        .selectAll('.mapPolygons')
        .filter('.' + indRowClust)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)

      smallMultiples.SVGs.selectAll('.' + indRowClust)
          .transition()
          .duration(500)
          .attr('stroke', 'black')
          .attr('stroke-width', 2)

      // heatmap
      d3
      .select('#g-heatMapCo')
      .selectAll('.HMBoundCo')
      .remove()
    } else if (itemClass.includes('hm')) {
      // heatmap mouseout
      item
        .transition()
        .duration(500)
        .attr('stroke-width', 0)

      d3.select('#divHeatMap')
        .select('#textInfo')
        .html('')

      var indRow = itemClass.split(' ')[1]
      var indCol = itemClass.split(' ')[2]
      var indRowClust = itemClass.split(' ')[3]
      var indColClust = itemClass.split(' ')[4]

      // geomap
      d3
        .select('#svgMap')
        .select('#' + indRow)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)

      // tlpoints
      d3
        .select('#g-TLPointsCo')
        .select('#' + indCol)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)

      // small mulitples mouseout
      smallMultiples.SVGs.selectAll('.' + indRowClust)
        .filter('.' + indColClust)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)
    } else {
      // small mulitples
      var vis = itemClass.split(' ')[0]
      var indRowClust = itemClass.split(' ')[1]
      var indColClust = itemClass.split(' ')[2]

      // geomap
      d3
        .select('#svgMap')
        .selectAll('.mapPolygons')
        .filter('.' + indRowClust)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)

      // small mulitples
      smallMultiples.SVGs.selectAll('.' + indRowClust)
        .filter('.' + indColClust)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 2)

      // tlpoints
      d3
        .select('#g-TLPointsCo')
        .selectAll('.' + indColClust)
        .transition()
        .duration(500)
        .attr('stroke', 'black')
        .attr('stroke-width', 1)
    }

  } else {
    // timeline points mouseout
    vis = itemClass.split(' ')[0]
    indColClust = itemClass.split(' ')[1]

    // tlpoints
    d3
      .select('#g-TLPointsCo')
      .selectAll('.' + indColClust)
      .transition()
      .duration(500)
      .attr('stroke', 'black')
      .attr('stroke-width', 1)

    // small mulitples
    smallMultiples.SVGs.selectAll('.' + indColClust)
      .transition()
      .duration(500)
      .attr('stroke', 'black')
      .attr('stroke-width', 2)

    // heatmap
    d3
      .select('#g-heatMapCo')
      .selectAll('.HMBoundCo')
      .remove()
  }
}

// function when clicking the labels of the heatmap
var numClick = 0
var region = []
var interval = []
var clickLabelHM = function () {
  numClick = numClick + 1
  var item = d3.select(this)
  item
    .attr('font-size', 15)
    .transition()
    .duration(1000)
    .attr('font-size', 10)

  if (item.attr('class').includes('y')) {
    region.push(item.text())
  } else {
    interval.push(item.text())
  }
  if (numClick > 4) {
    window.alert('please only select 2 locations & 2 timestamps')
  }
}

// select observe area by drawing rectangle in the heatmap, highlighting corresponding
// records in the map and timeline
function drawBoundsCo () {
  if (numClick < 4) {
    window.alert('please click locations & timestamps first')
  } else {
    let rect0Region = d3.select('#g-heatMapCo').select('.r' + region[0])
    let rect1Region = d3.select('#g-heatMapCo').select('.r' + region[1])
    let rect0Interval= d3.select('#g-heatMapCo').select('.c' + interval[0])
    let rect1Interval= d3.select('#g-heatMapCo').select('.c' + interval[1])
    let boundXCo = Math.min(rect0Interval.attr('x'), rect1Interval.attr('x'))
    let boundYCo = Math.min(rect0Region.attr('y'), rect1Region.attr('y'))
    let boundHeightCo = Math.abs(rect0Region.attr('y') - rect1Region.attr('y'))
    let boundWidthCo = Math.abs(rect0Interval.attr('x') - rect1Interval.attr('x'))
    // draw bounds in the heatmap
    d3
      .select('#g-heatMapCo')
      .append('rect')
      .attr('id', 'HMBoundCo')
      .attr('x', boundXCo)
      .attr('y', boundYCo)
      .attr('height', boundHeightCo + heatMap.cellHeight)
      .attr('width', boundWidthCo + heatMap.cellWidth)
      .attr('stroke', 'black')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')

    // geomap highlighted
    let idxRow1 = parsedData.keysRow.indexOf(+region[0])
    let idxRow2 = parsedData.keysRow.indexOf(+region[1])
    let minRow = d3.min([idxRow1, idxRow2])
    let maxRow = d3.max([idxRow1, idxRow2])
    for (let i = minRow; i < maxRow + 1; i++) {
      d3
        .select('#svgMap')
        .select('#r' + parsedData.keysRow[i])
        .attr('stroke', 'orange')
        .attr('stroke-width', 5)
    }

    // timeline highlighted
    let idxCol1 = parsedData.keysCol.indexOf(interval[0])
    let idxCol2 = parsedData.keysCol.indexOf(interval[1])
    let minCol = d3.min([idxCol1, idxCol2])
    let maxCol = d3.max([idxCol1, idxCol2])
    for (let i = minCol; i < maxCol + 1; i++) {
      d3
        .select('#g-TLPointsCo')
        .select('#c' + parsedData.keysCol[i])
        .attr('stroke', 'orange')
        .attr('stroke-width', 3)
    }
  }
}

// clear observe area by removing rectangle in the heatmap and highlights in
// the map and timeline
var clearBoundsCo = function () {
  // remove bound in the heatmap
  d3
    .select('#g-heatMapCo')
    .select('#HMBoundCo')
    .remove()

  // geomap unhighlighted
  let idxRow1 = parsedData.keysRow.indexOf(+region[0])
  let idxRow2 = parsedData.keysRow.indexOf(+region[1])
  let minRow = d3.min([idxRow1, idxRow2])
  let maxRow = d3.max([idxRow1, idxRow2])
  for (let i = minRow; i < maxRow + 1; i++) {
    d3
      .select('#svgMap')
      .select('#r' + parsedData.keysRow[i])
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
  }

  // timeline unhighlighted
  let idxCol1 = parsedData.keysCol.indexOf(interval[0])
  let idxCol2 = parsedData.keysCol.indexOf(interval[1])
  let minCol = d3.min([idxCol1, idxCol2])
  let maxCol = d3.max([idxCol1, idxCol2])
  for (let i = minCol; i < maxCol + 1; i++) {
    d3
      .select('#g-TLPointsCo')
      .select('#c' + parsedData.keysCol[i])
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
  }

  numClick = 0
  region = []
  interval = []
}
