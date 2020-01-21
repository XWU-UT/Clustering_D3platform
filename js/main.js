// this is the main file of the platform, including read the
// default/uploaded data, call other functions to visualize and analyze the
// data, also including sending request to the server for implementing BBAC_I

// settings that are used globally, including layout and color
var globalSettings = {}
globalSettings.xpadding = 10
globalSettings.ypadding = 10
globalSettings.margin = { top: 30, right: 30, bottom: 30, left: 30 }

globalSettings.colorScheme = d3.interpolateRdYlBu

var mapjson

// read NL yearly temperature as attribute data in default
d3.csv('data/temp_yr.csv', function (data) {
  // parse attribute data as needed formats
  parseData(data)
  initGraphs()
  updateTimeLine()
  updateHeatMap()
  // read NL Thiessen polygon geojson  file as default to visualize geomap
  d3.json('data/NL_wgs84.geojson', function (json) {
    mapjson = json
    updateMap()
  })
})

// read user uploaded csv file as inputdata for co-clustering analysis
var inputData = []
var csvFileInput = document.getElementById('csvFileInput')
var mapFileInput = document.getElementById('mapFileInput')

// read uploaded csv file
function readCSVFile (file) {
  var reader = new FileReader()
  reader.onload = function () {
    inputData = d3.csvParse(reader.result)
    parseData(inputData)
    updateTimeLine()
    updateHeatMap()
  }
  // start reading the file. When it is done, calls the onload event defined above.
  reader.readAsText(file)
}
// read uploaded geojson file
function readGeojsonFile (file) {
  var reader = new FileReader()
  reader.onload = function () {
    mapjson = JSON.parse(reader.result)
    updateMap()
  }
  // start reading the file. When it is done, calls the onload event defined above.
  reader.readAsText(file)
}

// add change event to file upload to check if the user has uploaded the attribute data
csvFileInput.addEventListener('change', function () {
  var csvFile = csvFileInput.files[0]
  if (!(csvFile.name.split('.').pop() === 'csv')) {
    window.alert('Please upload the CSV file for the attribute data')
    csvFileInput.value = ''
  }
})

mapFileInput.addEventListener('change', function () {
  // one geojson polygon file for geographical map with the coordinated
  // referenced sysetm as wgs84
  var geojsonFile = mapFileInput.files[0]
  if (mapFileInput.files.length === 1) {
    let geojsonFile = mapFileInput.files[0]
    if (!(geojsonFile.name.split('.').pop() === 'geojson')) {
      window.alert('Please upload the geojson file for the map')
      mapFileInput.value = ''
    } else {
      readCSVFile(csvFileInput.files[0])
      readGeojsonFile(mapFileInput.files[0])
    }
  }
})

// initialize the setting of visualizations
function initGraphs () {
  initTimeLine()
  initMap()
  initHeatMap()
  initSmallMultiples()
}

// implementation of co-clustering algorithm in the server written in R, connected
// using jug. The parameters (k:num. of row-cluster l: num. of col-cluster
// niters: num. of iterations for reducing the information loss nruns: num. of
// iterations for random initialization) are defined by user in the interface.
function coClustering () {
  // this variable is used to save parameters chosen by users, e.g. k,l
  var parameters = {}
  var p = []
  var url = ''
  // get values of all parameters
  parameters['k'] = document.querySelector('#numRC').value
  parameters['l'] = document.querySelector('#numCC').value
  parameters['niters'] = document.querySelector('#innerIter').value
  parameters['nruns'] = document.querySelector('#outerIter').value
  // join them together
  for (var k in parameters) {
    if (parameters[k].length > 0) {
      var x = k + '=' + parameters[k]
      p.push(x)
    }
  }

  // set up url with all parameters selected by users: this url contain the
  // parameters selected by the user and serve as req.params using d3.json()
  url = 'http://' + window.location.hostname + ':8888/?' + p.join('&')

  d3
    .json(url)
    // put data needed into req.body using d3.json() in the client side
    // to send it to the server side
    // the data in function(err,data) means the data in the res.body and is
    // the processed result of the server side
    .post(JSON.stringify({ data: parsedData.valRserver }), function (err, data) {
      // processed result (data) contains: rlabelInfo, clabelInfo, valueSM, Z_order
      // rlabelInfo includes: ix: the re-ordered row indices from row-cluster 1 to k
      // based on co-clustering results num: accumulated num. of row-clusters
      // rlabel: which row-cluster each row (from 1 to m) belongs to.

      // clabelInfo includes: ix: the re-ordered column indices from year-cluster 1 to l
      // based on co-clustering results num: accumulated num. of col-clusters
      // clabel: which col-cluster each column (from 1 to n) belongs to.

      // valueSM: values for small multiples using RCavg' (size: lxm)

      // Z_CoC: the co-clustered data matrix according to the co-clustering results
      // with size (mxn) x1 as a vector
      var clabel = [].concat.apply([], data.clabelInfo.clabel)
      var rlabel = [].concat.apply([], data.rlabelInfo.rlabel)
      // visualize the clustering results in the heatmap
      addHeatmap(data.Z_CoC, rlabel, clabel)

      // visualize the col-clusters in the timeline
      addTimeline(clabel)

      // rlabelMerge used for merging row-clusters for thick lines in small multiples
      smallMultiples.rlabelMerge = []
      for (var i = 1; i <= +document.querySelector('#numRC').value; i++) {
        var tempLabel = []
        for (var j = 0; j < rlabel.length; j++) {
          if (rlabel[j] === i) {
            tempLabel.push(parsedData.keysRow[j])
          }
        }
        smallMultiples.rlabelMerge.push({ rc: i, rlabel: tempLabel })
      }

      // visualize the clustering results (co-clusters) in the small multiples
      updateSmallmultiple(data.valueSM)
      updateMapCo()
    })
}
