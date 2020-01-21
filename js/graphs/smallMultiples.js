// this file includes variables and functions that are related to the
// visualization in the smallMultiples

// global variable (store) needed for drawing small multiples
// will hold all small multiples related parameters,
var smallMultiples = {}

function initSmallMultiples () {
  // layout settings
  smallMultiples.width = 900 - globalSettings.margin.left - globalSettings.margin.right
  smallMultiples.height = 300 - globalSettings.margin.top - globalSettings.margin.bottom
}

// create small multiples of geomaps to visualize co-clustering results: within
// each map for every col-clust, polygon is drawn using thin line and
// row-clusters are drawn using thick line.
// data: value of RCavg' (l x m) used to render each map
function updateSmallmultiple (data) {
  // layout settings for each map
  smallMultiples.mapWidth = Math.floor(smallMultiples.width / data.length)
  smallMultiples.mapHeight = smallMultiples.height - globalSettings.ypadding
  // color settings
  var minVal = d3.min(data, function (d) {
    return d3.min(d)
  })
  var maxVal = d3.max(data, function (d) {
    return d3.max(d)
  })
  smallMultiples.colorCoef = colorValueMapping(minVal, maxVal)

  // visualization of all maps in smallMultiples
  d3.select('#divSmallMultiples').selectAll('svg').remove()
  smallMultiples.SVGs = d3
    .select('#divSmallMultiples')
    .selectAll('svg')
    .data(data)
    .enter()
    .append('svg')
    .attr('id', function (d, i) {
      return 'col_cluster' + (i + 1)
    })
    .attr('class', 'map coclust')
    .attr('width', smallMultiples.mapWidth)
    .attr('height', smallMultiples.mapHeight)

  // set the projection of small multiples
  smallMultiples.projection = d3.geoMercator()
    .fitSize([smallMultiples.mapWidth, smallMultiples.mapHeight], mapjson)
  smallMultiples.path = d3.geoPath().projection(smallMultiples.projection)

  // change geojson to topojson that is neede to be used in d3.merge()
  smallMultiples.mapTopo = topojson.topology({ features: mapjson })

  var indColClust = 1
  smallMultiples.SVGs.each(function (colClust) {
    var svgTemp = d3.select(this)
    // first draw polygon map
    svgTemp
      .selectAll('path')
      .data(mapjson.features)
      .enter()
      .append('path')
      .attr('d', smallMultiples.path)
      .attr('class', 'mapPolygon')
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none')
      .style('fill', function (d) {
        var code = "d.properties." + simProperties.rowid[0]
        var rowID = eval(code)
        var rowIndex = parsedData.keysRow.indexOf(rowID)
        var colorVal = colClust[rowIndex]
        return globalSettings.colorScheme(smallMultiples.colorCoef.a * colorVal + smallMultiples.colorCoef.b)
      })
    // draw points for polygon map
    svgTemp
      .selectAll('circle')
      .data(mapjson.features)
      .enter()
      .append('circle')
      .attr('cx', function (d) {
        var code1 = "d.properties." + simProperties.longitude[0]
        var code2 = "d.properties." + simProperties.latitude[0]
        var x = eval(code1)
        var y = eval(code2)
        return smallMultiples.projection([x, y])[0]
      })
      .attr('cy', function (d) {
        var code1 = "d.properties." + simProperties.longitude[0]
        var code2 = "d.properties." + simProperties.latitude[0]
        var x = eval(code1)
        var y = eval(code2)
        return smallMultiples.projection([x, y])[1]
      })
      .attr('r', 1.5)
      .attr('fill', 'black')
      .style('pointer-events', 'none')

    // draw thick lines for row-clusters on top of each polygon map
    var indRowClust = 1
    smallMultiples.rlabelMerge.forEach(function (r) {
      var rclust = d3.set(r.rlabel)
      svgTemp
        .append('path')
        .datum(
          topojson.merge(
            smallMultiples.mapTopo,
            smallMultiples.mapTopo.objects.features.geometries.filter(function (d) {
              var code = "d.properties." + simProperties.rowid[0]
              var rowID = eval(code)
              return rclust.has(rowID)
            })
          )
        )
        .attr('d', smallMultiples.path)
        .attr('fill', 'none')
        .attr('class', function (d) {
          // class: sm rc1 cc1
          return 'sm' + ' ' + 'rc' + indRowClust + ' ' + 'cc' + indColClust
        })
        .attr('stroke', 'black')
        .attr('stroke-width', 2.5)
        .style('pointer-events', 'all')
        .on('mouseover', mouseOverCo)
        .on('mouseout', mouseOutCo)

      indRowClust = indRowClust + 1
    })
    indColClust = indColClust + 1
  })
}
