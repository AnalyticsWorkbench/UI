# Analytics Workbench Setup with netbeans using postgresSQL

## Components

**Requirements:**
- Current JDK
- PostgresSQL
- R Project

##  Current JDK
find the current version according to your operation system [JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)


##  PostgresSQL
- create database "workbench" and a corresponding user with all rights granted for the DB.

- initialization on [MacOs](https://chartio.com/resources/tutorials/how-to-start-postgresql-server-on-mac-os-x/) 
- Setting Up PostgreSQL on [MacOs](https://www.tunnelsup.com/setting-up-postgres-on-mac-osx/) 

Start manualy postgrade, you can observe the connections.
```
postgres -D /usr/local/var/postgres
```
Stop manualy postgrade
```
pg_ctl -D /usr/local/var/postgres stop -s -m fast
```

##  R Project
	
- R (https://cran.r-project.org/)

	- install necessary R packages (Runiversal, igraph, blockmodeling, fpc, Matrix, dplyr)
	
 Open the cmd of the R enviroment and write the command:
  ```
- install.packages(c(Runiversal”,”igraph”,”blockmodeling”,”fpc”,"Matrix", "dplyr"))
  ```
to de bug easier the requirements we can try them seperatly :
 ```
 install.packages(c(pkgs="dplyr"))
 ```
	
to install with the R user interface please check this [video](https://www.youtube.com/watch?v=b43DrsGIUZc)

## Workbench UI

**Requirements:**
- Redis (https://redis.io/download or on Windows https://github.com/dmajkic/redis/downloads)
To run Redis with the default configuration just type in terminal or cmd:
 ```
 % cd src
 % ./redis-server
  ```

- NodeJS (https://nodejs.org)
  - install necessary module by executing node, navigationg into “webworkbench” and executing „npm install“ (in the terminal/comand line) in the „webworkbench“ directory
  
```
npm install
```
  
Create folders and files (if they are not already there):

- Folder "results": the folder which is used to server analysis results

- Folder "security": the folder containing certificates for https/wss
	- nodeworkbench.key - private key file
	- nodeworkbench.crt - certificate file (filename is an example, may be configured)	


## Installation

	
### 1. Change sisob.config to local settings:

```
## hostname for message connection
server.message.name=localhost

## internalname for message connection (e.g. database for PSQL)
server.message.internalname=workbench

## internalname for data connection (e.g. database for PSQL)
server.data.internalname=workbench

## port for message connection
server.message.port=5432

## main could be 1883 2525 or 5432

## internalname for message connection (e.g. database for PSQL)
server.message.internalname=workbench

## username for message connection
server.message.username=workbench

## password for message connection
server.message.password=workbench

## location of the Rscript executable
rwrapper.executable=/usr/lib/R/bin/Rscript or on Windows usually C:\\Program Files\\R\\R-3.x.x\\bin\\Rscript.exe

## directory for the created output
slideshow.serverdir=path_to_project/webworkbench/results/

## directory from which the uploader offers files
upload.directory=path_to_project/webworkbench/upload files

## directory in which the resultcollector searches for created results
results.filelocation=path_to_project/webworkbench/results/

## -----------------------EXTRA ----------------------------------------------
## ----- set data connection here -----

## which backend for data communication (currently ftp, postgresql)
server.data=postgresql

## hostname for data connection
server.data.name=localhost


## port for data connection
server.data.port=5432


## username for databackend if needed
server.data.username=workbench

## password for databackend if needed
server.data.password=workbench

##md5906943237b36364eeacc1ff6ea3c0ae0
##server.data.password=workbench


## ----- set message connection here -----
## which backend for message communication (currently mqtt, postgresql)

connection.type=SINGLE

server.message=mqtt

server.message=postgresql

```

### 2. Initialise DB

In UI folder:
	- Run usercreator.js (Initial admin user (user:admin, pwd:admin-pw) and regular user (user:user, pwd:user-pw) will be created
	- Run postgresinitializer.js (node postgresinitializer.js)


In components folder 

- Run Maven build
```
mvn clean install
```
- Run postgresinit.java in executer folder
```
javac PostgresInitializer.java
```

### 3. Startup
-- Start the UI
-- Start redis-server
-- Start postsql-server
-- Run node server (node workbench.js) in webworkbench folder (Server listens at localhost:3081)
-- Start the components framework: 
-- Run components/components-executor/Executor.java (All analytics components listed in executor.xml will be started)

## Kick off workbench run local server video 
[![workbenchsisob](https://user-images.githubusercontent.com/17232450/42764608-56712c00-8916-11e8-84be-b1c4cbd25f7f.jpg)](https://youtu.be/FDGwaJuoVkg)


* Execution of postgradeinitilazer.js didn't mention in video please check the UI readme.md file on UI folder.
  
need to surf on server to know more about Sisob Workbench ? 
https://descartes.inf.uni-due.de:3081/workbench

New interface with react:
https://descartes.inf.uni-due.de:3081/Clientv
