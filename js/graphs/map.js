// this file includes variables and functions that are related to the
// visualization in the geographical map

// global variable (store) needed for drawing map and map legend
// will hold all map and map legend related parameters,
var map = {}
var mapLegend = {}

function initMap () {
  // layout settings
  globalSettings.xpadding = 10
  globalSettings.ypadding = 10
  map.width = 450 - globalSettings.margin.left - globalSettings.margin.right
  map.height = 500 - globalSettings.margin.top - globalSettings.margin.bottom
  // set projection of the map
  map.projection = d3.geoMercator().scale(1).translate([0, 0])

  // mapLegend setting
  mapLegend.width = 300
  mapLegend.height = 50
  // set scales and axes of mapLegend
  mapLegend.xScale = d3.scaleLinear().range([globalSettings.xpadding, mapLegend.width - 1])
  mapLegend.xAxis = d3.axisBottom().scale(mapLegend.xScale).ticks(6).tickFormat(function (d) {
    return Math.ceil(d * 100) / 100
  })

  initMapSvg ()
}

function initMapSvg () {
  // setting for the geomap
  var svgMap = d3
    .select('#divMap')
    .append('svg')
    .attr('id', 'svgMap')
    .attr('width', map.width + globalSettings.margin.left + globalSettings.margin.right)
    .attr('height', map.height + globalSettings.margin.top + globalSettings.margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + globalSettings.margin.left + ',' + globalSettings.margin.top + ')')
  map.paths = svgMap.append('g').attr('id', 'g-mapPolygons').selectAll('path')
  map.points = svgMap.append('g').attr('id', 'g-mapPoints').selectAll('circle')
  map.labels = svgMap.append('g').attr('id', 'g-mapLabels').selectAll('text')
  map.gCo = svgMap.append('g').attr('id','g-mapPolygonsCo')

  // setting for the map legend
  var svgMapLegend = d3
    .select('#legendMap')
    .append('svg')
    .attr('id', 'svgMapLegend')
    .attr('width', mapLegend.width)
    .attr('height', mapLegend.height)
  // setting of tooltip for map legend
  mapLegend.tip = d3
    .tip()
    .attr('class', 'd3-tip')
    .attr('id', 'tipMapLegend')
    .offset([globalSettings.ypadding, globalSettings.xpadding])
    .html(function (d) {
      return (
        "<span style='color:blackfont-size:8'>" +
        Math.floor(d * 100) / 100 +
        '</span>'
      )
    })
  svgMapLegend.call(mapLegend.tip)
}

// visualizaiton of geomap based on mapjson
function updateMap () {
  // first find similar properties to be used in the next
  findProperty()

  // set the projection according to mapjson
  map.projection.fitSize([map.width, map.height], mapjson)
  var path = d3.geoPath()
    .projection(map.projection)

  // visualization of geomap
  d3.select("#svgMap")
    .selectAll(".mapPolygon")
    .remove()

  map.rowNames = {}
  map.paths
    .data(mapjson.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
    .attr('class', 'mapPolygon')
    .attr('id', function (d) {
      var code = "d.properties." + simProperties.rowid[0]
      var rowID = eval(code)
      if (rowID in map.rowNames) {
        map.rowNames[rowID].push(d.properties.Number_)
      } else {
        map.rowNames[rowID] = []
        map.rowNames[rowID].push(d.properties.Name)
      }
      return 'r' + rowID
    })
    .style('fill', function (d) {
      var code = "d.properties." + simProperties.rowid[0]
      var rowID = eval(code)
      var value = parsedData.meanRow[rowID]
      return globalSettings.colorScheme(globalSettings.colorCoef.a * value + globalSettings.colorCoef.b)
    })
    .on('mouseover', mouseOverOri)
    .on('mouseout', mouseOutOri)

  // update when data changes
  map.paths.style('fill', function (d) {
    var code = "d.properties." + simProperties.rowid[0]
    var rowID = eval(code)
    // var rowID = d.properties.stID
    var value = +parsedData.meanRow[rowID]
    return globalSettings.colorScheme(globalSettings.colorCoef.a * value + globalSettings.colorCoef.b)
  })

  // visualization of points and labels in the geomap
  d3.select("#svgMap")
    .selectAll(".mapLabels")
    .remove()

  map.points
    .data(mapjson.features)
    .enter()
    .append('circle')
    .attr('class', 'mapLabels')
    .attr('cx', function (d) {
      var code1 = "d.properties." + simProperties.longitude[0]
      var code2 = "d.properties." + simProperties.latitude[0]
      var x = eval(code1)
      var y = eval(code2)
      return map.projection([x, y])[0]
    })
    .attr('cy', function (d) {
      var code1 = "d.properties." + simProperties.longitude[0]
      var code2 = "d.properties." + simProperties.latitude[0]
      var x = eval(code1)
      var y = eval(code2)
      return map.projection([x, y])[1]
    })
    .attr('r', 3)
    .attr('fill', 'black')
    .style('pointer-events', 'none')
  // lables the circles with texts for each polygon
  map.labels
    .data(mapjson.features)
    .enter()
    // if line break is necessary
    // .append('foreignObject')
    // .attr('class', 'label')
    // .attr('width', '10')
    // .attr('height', '15')
    // .html(function (d) {
    //   var html = (d.properties.Number_ + ' ' + d.properties.Name).split(' ')
    //   return html.join('<br>')
    // })
    .append('text')
    .text(function (d) {
      var code1 = "d.properties." + simProperties.rowid[0]
      var code2 = "d.properties." + simProperties.name[0]
      return eval(code1) + ' ' + eval(code2)
    })
    .attr('class', 'mapLabels')
    .attr('x', function (d) {
      var code1 = "d.properties." + simProperties.longitude[0]
      var code2 = "d.properties." + simProperties.latitude[0]
      var x = eval(code1)
      var y = eval(code2)
      return map.projection([x, y])[0]
    })
    .attr('y', function (d) {
      var code1 = "d.properties." + simProperties.longitude[0]
      var code2 = "d.properties." + simProperties.latitude[0]
      var x = eval(code1)
      var y = eval(code2)
      return map.projection([x, y])[1]
    })
    .attr('font-size', 10)
    .attr('text-anchor', 'bottom')
    .style('pointer-events', 'none')

  // set and update map legend
  mapLegend.legendVal = Object.keys(parsedData.meanRow).map(function (d) {
    return parsedData.meanRow[d]
  })
  mapLegend.legendVal.sort(function (a, b) {
    return a - b
  })
  updateMapLegend()
}

// setting of the color and value for the map legend
function updateMapLegend () {
  mapLegend.minVal = d3.min(mapLegend.legendVal, function (d) {
    return d3.min(d)
  })
  mapLegend.maxVal = d3.max(mapLegend.legendVal, function (d) {
    return d3.max(d)
  })
  mapLegend.xScale.domain([mapLegend.minVal, mapLegend.maxVal])

  d3.select('#svgMapLegend').selectAll('.mapLegendLabel').remove()
  d3
    .select('#svgMapLegend')
    .selectAll('rect')
    .data(mapLegend.legendVal)
    .enter()
    .append('rect')
    .attr('width', (mapLegend.width - 2 * globalSettings.xpadding) / mapLegend.legendVal.length)
    .attr('height', mapLegend.height - globalSettings.ypadding)
    .attr('x', function (d, i) {
      return (mapLegend.width - globalSettings.xpadding) / mapLegend.legendVal.length * i + globalSettings.xpadding
    })
    .attr('y', -globalSettings.ypadding)
    .attr('class', 'mapLegendLabel')
    .attr('fill', function (d) {
      return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
    })
    .style('opacity', 0.85)
    .on('mouseover', mapLegend.tip.show)
    .on('mouseout', mapLegend.tip.hide)

  d3
    .select('#svgMapLegend')
    .selectAll('text')
    .data(mapLegend.legendVal)
    .enter()
    .append('text')
    .text(function (d, i) {
      if (i % 5 === 0) {
        return Math.floor(d * 100) / 100
      }
    })
    .attr('x', function (d, i) {
      return (mapLegend.width - globalSettings.xpadding) / mapLegend.legendVal.length * i
    })
    .attr('y', mapLegend.height)
    .attr('class', 'mapLegendLabel')
    .style('text-anchor', 'start')
    .attr('fill', 'black')
}

// visualization of geomap after BBAC_I is implemented
function updateMapCo () {
  // button of toggleMap visible
  d3.select('#btnMap').style('opacity', 1)
  // set indicator of co-clustering (=1) or original (=0)
  map.activeCo = 1

  // add the thick lines using the merged stations (smallMultiples.rlabelMerge) in the map
  // draw thick lines for row-clusters on top of Thiessen polygon in each map
  var indRowClust = 1
  smallMultiples.rlabelMerge.forEach(function (r) {
    var rclust = d3.set(r.rlabel)
    // assign row-cluster to each location
    rclust.each(function (rowID) {
      d3
        .select('#svgMap')
        .select('#r' + rowID)
        .attr('class', function (d) {
          return 'mapPolygons' + ' ' + 'rc' + indRowClust
        })
    })
    indRowClust = indRowClust + 1
  })

  d3.select('#svgMap')
    .selectAll('.mapPolygons')
    .on('mouseover', mouseOverCo)
    .on('mouseout', mouseOutCo)
}

// change between the modes of visualizing of the orignal data
// and the co-clustering results when clicking the button "toggleMap"
function toggleMap () {
  var activeMapCo = map.activeCo ? 0 : 1

  if (activeMapCo) {
    d3.select('#svgMap')
      .selectAll('.mapPolygons')
      .on('mouseover', mouseOverCo)
      .on('mouseout', mouseOutCo)
  } else {
    d3.select('#svgMap')
      .selectAll('.mapPolygons')
      .on('mouseover', mouseOverOri)
      .on('mouseout', mouseOutOri)
  }

  map.activeCo = activeMapCo
}
