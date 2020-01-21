// this file is used to parse the data (rawData) as the needed formats
// for the visualization and analysis in the next, e.g. heatmap etc.

// global variable (store) needed for the parsed data in all needed structures
var parsedData = {}

// parse inputdata into different needed structures
function parseData (rawData) {
  // dataset organized according to each row
  // can be used in combination with keysRow, e.g. parsedData.rowBased[keysRow[i]]
  parsedData.rowBased = {}
  // dataset organized according to each column
  parsedData.colBased = {}
  // dataset organized for heatmap visualization
  parsedData.valHeatMap = []
  // dataset organized for co-clustering in R server
  parsedData.valRserver = []
  // keysRow stores rowIDs in the original data
  parsedData.keysRow = []
  // keysCol stores columnIDs in the original data
  parsedData.keysCol = []
  // get the mean value for each row, e.g. stations, and store them in meanRow,
  // whose extent is used to set the color domain for rendering the map
  parsedData.meanRow = {}

  // the general row name.e.g.station
  var rowName = rawData['columns'][0]
  // the keys of columns of the dataset, e.g. 1992
  parsedData.keysCol = rawData['columns'].slice(1, rawData['columns'].length)
  // read data into variables with differnt structures
  rawData.forEach(function (r) {
    var row = r[rowName]
    parsedData.keysRow.push(+row)
    var tempCol = []
    var tempData = []
    var idx = 0
    delete r[rowName]
    for (var col in r) {
      if (r.hasOwnProperty(col)) {
        tempCol.push({ col: col, val: +r[col] })
        tempData.push(+r[col])
        parsedData.valHeatMap.push(+r[col])

        if (row in parsedData.rowBased) {
          parsedData.rowBased[row].push({ idx: idx, col: col, val: +r[col] })
        } else {
          parsedData.rowBased[row] = []
          parsedData.rowBased[row].push({ idx: idx, col: col, val: +r[col] })
        }
        idx = idx + 1
        if (col in parsedData.colBased) {
          parsedData.colBased[col].push({ row: row, val: +r[col] })
        } else {
          parsedData.colBased[col] = []
          parsedData.colBased[col].push({ row: row, val: +r[col] })
        }
      }
    }

    parsedData.valRserver.push(tempData)

    if (row in parsedData.meanRow) {
      parsedData.meanRow[row].push(d3.mean(tempData))
    } else {
      parsedData.meanRow[row] = []
      parsedData.meanRow[row].push(d3.mean(tempData))
    }
  })
}
