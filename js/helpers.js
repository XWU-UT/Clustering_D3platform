// this file contains several functions that help to implement
// the visualization and analysis

// based on commonly used properties such as name, rowid, longitude and latitude,
// find out those attributes in the properties of the mapjson that are similar
// with above, which can be used to identify dataset-specific attributes for
// name, id etc. that are used to render the visualizations
var  simProperties
function findProperty () {
  simProperties = {}
  var property = "rowid;name;longitude;latitude".split(";")
  for (var temp in property) {
    var maxSim = 0
    var maxProp
    for (var prop in mapjson.features[0].properties) {
      // calculate the percentage of similarity and
      // decide which one is to be used based on the similarity value
      let simPerc = strSimilarity2Percent(prop.toLowerCase(), property[temp])
      if (simPerc > maxSim) {
        maxSim = simPerc
        maxProp = prop
      } else if (simPerc === maxSim && prop.toLowerCase().includes(property[temp])) {
        maxSim = simPerc
        maxProp = prop
      }
    }
    if (property[temp] in simProperties) {
      simProperties[property[temp]].push(maxProp)
    } else {
      simProperties[property[temp]] = []
      simProperties[property[temp]].push(maxProp)
    }
  }
}

// examine the similarity of two strings and return the percentage of similarity
function strSimilarity2Percent (s, t) {
  var l = s.length > t.length ? s.length : t.length
  var d = self.strSimilarity2Number(s, t)
  return (1 - d / l).toFixed(4)
}
// examine the similarity of two strings
function strSimilarity2Number (s, t) {
  var n = s.length
  var m = t.length
  var d = []
  var i, j, s_i, t_j, cost
  if (n == 0) return m
  if (m == 0) return n
  for (i = 0; i <= n; i++) {
    d[i] = []
    d[i][0] = i
  }
  for (j = 0; j <= m; j++) {
    d[0][j] = j
  }
  for (i = 1; i <= n; i++) {
    s_i = s.charAt(i - 1)
    for (j = 1; j <= m; j++) {
      t_j = t.charAt(j - 1)
      if (s_i == t_j) {
        cost = 0
      } else {
        cost = 1
      }
      d[i][j] = self.Minimum(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[n][m]
}

function Minimum (a, b, c) {
  return a < b ? (a < c ? a : c) : (b < c ? b : c)
}

// set color scheme according to the user' selection, blue-yellow-red as default
function setColorScheme () {
  var colorOptions = document.getElementById('colorOptions')
  var color = colorOptions.options[colorOptions.selectedIndex].value
  globalSettings.colorScheme = eval('d3.interpolate' + color)

  // set colorScheme of geomap
  if (timeLine.selectedTime === undefined) {
    d3.selectAll('.mapPolygon')
      .style('fill', function (d) {
        var code = "d.properties." + simProperties.rowid[0]
        var rowID = eval(code)
        var value = +parsedData.meanRow[rowID]
        return globalSettings.colorScheme(globalSettings.colorCoef.a * value + globalSettings.colorCoef.b)
      })
  } else {
    var valCol = parsedData.colBased[timeLine.selectedTime]
    valCol.forEach(function (r) {
      var rowID = '#r' + r.row
      d3
        .select(rowID)
        .transition()
        .duration(500)
        .style('fill', globalSettings.colorScheme(globalSettings.colorCoef.a * r.val + globalSettings.colorCoef.b))
    })
  }

  // set colorScheme of map legend
  d3.select('#svgMapLegend')
    .selectAll('rect')
    .style('fill', function (d) {
      return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
    })

  // set colorScheme of heatmap
  d3.select('#g-heatMapOri')
    .selectAll('rect')
    .attr('fill', function (d) {
      return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
    })

  // set colorScheme of heatmapCo and smallMultiples if they are already drawn
  if (!(d3.select('.coclust').empty())) {
    d3.select('#g-heatMapCo')
      .selectAll('rect')
      .attr('fill', function (d) {
        return globalSettings.colorScheme(globalSettings.colorCoef.a * d + globalSettings.colorCoef.b)
      })

    smallMultiples.SVGs.each(function (colClust) {
      var svgTemp = d3.select(this)
      svgTemp
        .selectAll('mapPolygon')
        .style('fill', function (d) {
          var code = "d.properties." + simProperties.rowid[0]
          var rowID = eval(code)
          var rowIndex = parsedData.keysRow.indexOf(rowID)
          var colorVal = colClust[rowIndex]
          return globalSettings.colorScheme(smallMultiples.colorCoef.a * colorVal + smallMultiples.colorCoef.b)
        })
    })
  }
}

// map the values to [1,0] for the colormap
function colorValueMapping (val1, val2) {
  var a, b
  a = 1 / (val1 - val2)
  b = -val2 / (val1 - val2)
  return { a: a, b: b }
}

// calculates the mean for each column (over all rows) used for timeline
function columnMean (data) {
  var meanCol = []
  for (var i=0; i< parsedData.keysCol.length; i++) {
    var col = parsedData.keysCol[i]
    if (data.hasOwnProperty(col)) {
      var meanVal = d3.mean(data[col], function (d) {
        return +d.val
      })
      meanCol.push({ idx: i, col: col, val: meanVal })
    }
  }
  return meanCol
}
