library(jug)
library(jsonlite)

#reproducability
set.seed(1)

#main function of BBAC_I (Scheme2) with inner iterations of 1000 and outer 100
BBAC_I <- function(Z, k, l, niters, nruns) {

  errobj <- 1e-6
  dist <- 1
  epsilon <- 1e-8
  W <- array(1, dim(Z))
  Rs<-list()
  Cs<-list()
  Ers<-list()

  #outer iterations for various random initialization of R & C
  for (r in 1:nruns) {

    error <- 2*errobj
    old_error<-0

    # random initialization of R and C
    R <- diag(k)[sample(k, dim(Z)[1], replace = TRUE),]
    C <- diag(l)[sample(l, dim(Z)[2], replace = TRUE),]

    #inner iterations to minimize the information loss
    for (s in 1:niters) {
      #co-clustered matrix
      CoCavg<-(t(R) %*% Z %*%C+ mean(Z) * epsilon)/(t(R) %*% W %*% C + epsilon)

      Zrowc <- array(dist, dim(Z))
      Zrowv <- CoCavg %*% t(C)

      D <- similarity_measure(Z, Zrowc, Zrowv, W, epsilon)
      id <- sapply(1:dim(D)[1], function(i) sort(D[i,], index.return = TRUE)$ix[1])
      res <- sapply(1:dim(D)[1], function(i) sort(D[i,])[1]^(2-dist))
      R<- diag(k)[id,]

      Zcolc = array(dist, dim(Z))
      Zcolv = R %*% CoCavg

      D <- similarity_measure(t(Z), t(Zcolc), t(Zcolv), t(W), epsilon)
      id <- sapply(1:dim(D)[1], function(i) sort(D[i,], index.return = TRUE)$ix[1])
      res <- sapply(1:dim(D)[1], function(i) sort(D[i,])[1]^(2-dist))
      C<- diag(l)[id,]
      error <- sum(res)

      # if converge in one nrun, save R C and error
      # then go on to the next run
      if (abs(error - old_error) < errobj) {
        Rs<-append(Rs,list(R))
        Cs<-append(Cs,list(C))
        Ers<-append(Ers,list(error))
        break
      }

      # Update objective value
      old_error <- error
    }

  }

  index_min=which.min(Ers)

  R<-Rs[[index_min]]
  C<-Cs[[index_min]]

  #re-order the data matrix according to resulting R and C
  #and create new R & C with row/col-clusters from 1 to k/l are with increasing values
  #Inputs: Z: original data matrix; R: mxk to indicate row-cluster membership; C: nxl to
  #indicate col-cluster membership
  #Outputs: reorder$rlabel (1xm) with value 1 to k to indicate row-cluster membership
  # reorder$clabel (1xn) with value 1 to l to indicate col-cluster membership

  reorder<-reorder_matrix(Z,R,C)

  newR <- diag(k)[reorder$rlabel,]
  newC <- diag(l)[reorder$clabel,]
  rlabelSort<-sort(reorder$rlabel,index.return=TRUE)
  clabelSort<-sort(reorder$clabel,index.return=TRUE)

  #calculate num. of row/col-cluster, e.g. 4, 3, 5, 8 for the accumulated num.
  #of row/col-clusters, e.g. 4, 7, 12, 20
  numRr=as.data.frame(table(reorder$rlabel))$Freq
  numCr=as.data.frame(table(reorder$clabel))$Freq

  #the ordered matrix with increasing values from bottom-left to top-right
  Z_order<-Z[rlabelSort$ix,clabelSort$ix]

  #the co-clustered matrix: kxl
  CoCavg <- (t(newR) %*% Z %*%newC+ mean(Z) * epsilon)/(t(newR) %*% W %*% newC + epsilon)
  #the co-clustered matrix: kxl
  Z_CoCavg <- newR %*% CoCavg %*% t(newC)
  #Z_CoCavg <- apply(Z_CoCavg, 2, rev)

  #28 rows with 4 clustered years: values used for rendering small multiples
  RCavg<-newR%*%CoCavg

  rlabelInfo=list(rlabel=reorder$rlabel,ix=rlabelSort$ix-1,num=cumsum(numRr))
  clabelInfo=list(clabel=reorder$clabel,ix=clabelSort$ix-1,num=cumsum(numCr))

  return(list(Z_CoC=as.vector(t(Z_CoCavg)),valueSM=t(RCavg),rlabelInfo=rlabelInfo,clabelInfo=clabelInfo))
}

#calculate distance matrix
similarity_measure <- function(Z, X, Y, W, epsilon) {
  return((W * X) %*% t(Y + epsilon) - (W * Z) %*% log(t(Y + epsilon)))
}

#re-order the data matrix according to resulting R and C
#and create new R & C with row/col-clusters from 1 to k/l are with increasing values
reorder_matrix <-function(Z,R,C){

  Rrinfo<-NULL
  sumr<-NULL
  for (r in 1: dim(R)[2]){
    temp1<-paste('R',r,'<-which(R[,',r,'] %in% 1)',sep='')
    eval(parse(text=temp1));

    temp2<-paste('q',r,'<-mean(Z[R',r,',])',sep='')
    eval(parse(text=temp2));

    sumr[r]<-eval(parse(text=paste('q',r,sep = '')));
  }

  rlabel=(1:dim(R)[2])%*%t(R)

  sumrResult<-sort(sumr,index.return=TRUE);

  Rrvalue<-NULL
  Rrnum<-NULL
  for (r in 1:dim(R)[2]){
    temp3<-sumrResult$ix[r]
    temp4<-eval(parse(text=paste('R',temp3,sep = '')))
    rlabel[temp4]=r+dim(R)[2]
    Rrvalue<-c(Rrvalue, temp4)
    Rrnum<-c(Rrnum,length(temp4))
  }
  rlabel<-rlabel-dim(R)[2]
  # Rrinfo<-list(RrID=Rrvalue,Rrlabel=rlabel,Rrnum=Rrnum)

  #columns
  Crinfo<-NULL
  sumc<-NULL
  for (c in 1:dim(C)[2]){
    temp1<-paste('C',c,'<-which(C[,',c,'] %in% 1)',sep='')
    eval(parse(text=temp1));

    temp2<-paste('p',c,'<-mean(Z[,C',c,'])',sep='')
    eval(parse(text=temp2));

    sumc[c]<-eval(parse(text=paste('p',c,sep = '')));
  }
  clabel=(1:dim(C)[2])%*%t(C)

  sumcResult<-sort(sumc,index.return=TRUE);

  Crvalue<-NULL
  Crnum<-NULL
  for (c in 1:dim(C)[2]){
    temp3<-sumcResult$ix[c]
    temp4<-eval(parse(text=paste('C',temp3,sep = '')))
    clabel[temp4]=c+dim(C)[2]
    #sumcResult$ix[c]
    Crvalue<-c(Crvalue, temp4)
    Crnum<-c(Crnum,length(temp4))
  }
  clabel<-clabel-dim(C)[2]

  #Crinfo<-list(CrID=Crvalue,Crlabel=clabel,Crnum=Crnum)

  return(list(rlabel=rlabel,clabel=clabel))
}

# A Jug instance with 1 middleware attached
jug() %>%
  cors(NULL,
       allow_methods=c("POST","GET", "PUT", "OPTIONS", "DELETE", "PATCH"),
       allow_origin="*",
       max_age=3600,
       allow_headers=c("Origin", "X-Requested-With", "Content-Type", "Accept")) %>%
  post(path=NULL,function(req,res,err){
    r <- req$params
    data <- as.matrix(fromJSON(req$body)$data)

    #if(typeof(Z)!="matrix"){
    #  Z=as.matrix(Z)
    #}

    t <- BBAC_I(data, as.numeric(r$k), as.numeric(r$l), as.numeric(r$niters), as.numeric(r$nruns))
    res$body<-jsonlite::toJSON(t, auto_unbox = TRUE, digits = 8)
    res$content_type("application/json")
  }) %>%
  simple_error_handler() %>%
  serve_it(port=8888)

#curl 'http://localhost:8080/?k=4&l=4&niters=1000&nruns=500'
