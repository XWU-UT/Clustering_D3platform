## Clustering_D3platform

#### This source code is to build an interactive geovisual analytics platform where a co-clustering algorithm (BBAC_I) can be applied to various datasets

The installation of Python (version2x, and no version3x installed), R (R-3.4.4 is recommended) and RStudio is needed. Clone the files
to the local path and then follows the next two steps

1. Open one terminal to set up local server using python

  - first go to the directory
##### cd ...\Clustering_D3platform
  - then set python to the path of environment variables
if python is installed with other software, e.g. ArcGIS10.2, then the path should be set as
e.g. set PATH=%PATH%;C:\Python27\ArcGIS10.2\
##### set PATH=%PATH%;C:\Python27
  - set up the server on port 8888 (make sure that the port used is not taken, else use other port, e.g. 8887)
##### python -m SimpleHTTPServer 8888

2. Use the other terminal to set up jug connection which is used to connect the R server to the client side
install jug package in Rstudio, only needed in the first time (use install.packages in case that dependences are not installed automatically)
##### open jug.Rproj in jug-master file in RStudio and go to menu Build|Install and Restart

  - open the other terminal to go to server directory to run R code to start the jug connection
##### cd ...\Clustering_D3platform\server
  - set R to the path of environment variables and then run R code
##### set PATH=%PATH%;C:\Program Files\R\R-3.4.4\bin
##### Rscript server.R

3. Start the co-clustering analysis with any browser
##### localhost:8888
