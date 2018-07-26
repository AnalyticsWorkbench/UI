# Analytics Workbench Setup UI with netbeans using postgresSQL

For running the Workbench, some additional folders and files are necessary:
in UI folder:
git
```
mkdir result
mkdir security
```

"results" - the folder which is used to server analysis results

"security" - the folder containing the security information for https/wss
   - webworkbench.key - private key file (filename is an example, may be configured)
   - webworkbench.crt - certificate file (filename is an example, may be configured)

   (Tutorial for creating keys, for "on a Mac" but actually "using openssl":
    http://houseofding.com/2008/11/generate-a-self-signed-ssl-certificate-for-local-development-on-a-mac/)

You have to create users by running "usercreator.js" (whenever you start with a completely SQLSpaces server)

Main file is workbench.js

  - first install necessary module by "npm install" in this directory

  on mac OS if you got error on node install becasue of version No longer building under node 10.0.0 / macOS 10.13.4
  try this commmands:

  ```
  brew install node@8
  brew link --overwrite --force node@8
  npm install noble
  ```

  - [not always] second step: run "node usercreator.js"
 ```
 node usercreator.js
```
  - [not always] second step: run "node postgresInitializer.js"
```
 node postgresInitializer.js
```
run the psql before runing workbench you can do it mannualy by command :
```
   postgres -D /usr/local/var/postgres
```
   
   to create user having psql DB is neccessary:
```
  createdb workbench
```
   To login into the workbench with (User : admin, Pass: admin-pw) runnig Start redis-server is neccessrary.
   Please clone this repository and follow Readme: 
   
   
   
   short commands in for running redis-server :
   
```
   % make
   % make test 
   % cd src 
   % ./redis-server
```  
   to run the local server on 3081: 
   
```
   node workbench.js
```
     
  check here for more info: https://www.postgresql.org/docs/8.0/static/app-createdb.html

  See https://github.com/AnalyticsWorkbench/Components for general instructions on system setup

## Debuging ClientV2


#### npm install

  if you face problem check on this wiki you can find your solution 

  some common bug in npm install 

###### error :
  npm ERR! Unexpected end of JSON input while parsing near '...07dae64be","tarball":'

###### solution is clear your npm cash.  
```
  npm cache clean --force 
```
   after installing npm if you have potentioal package lost try :
```
  npm audit
```
   and install missed dependencies.

#### npm run compile

###### error :
   sh: tasks/compile: Permission denied
   npm ERR! code ELIFECYCLE
   npm ERR! errno 126
 
###### solution

   go to the clientV2 in public_html and delete app.js and app.css 

   open task folder
     ./UI/clientV2/tasks 

   check the line that begin with (for mac users)
    ```
    UV_THREADPOOL_SIZE=100 NODE_ENV=development NODE_PATH=. ./node_modules/.bin/babel-node ./node_modules/.bin/webpack --progress --colors
    ```
    
 paste and execute this command into terminal to compile react   part into js in clientV2 in public_html folder.
 or go to the stask folder wich contain script files and do:
    
 You can open the terminal (press Ctrl + Alt + T) and cd to the target directory:

 cd /path/to/target
To give the file "the_file_name" execute permission (if the file-system allows you with the RW rights):
```
chmod +x the_file_name

```   
example is here after you got permission and do ls you should see * on your script as permition granted by linux core

![screenshot 2018-07-26 15 17 41](https://user-images.githubusercontent.com/17232450/43264790-4e1fd0a0-90e7-11e8-91da-3b23b3a63a8f.png)

###### error : 
Node Sass does not yet support your current environment (macOS 10.12.1, Node 7.0.0)


###### solution is reinstall the nodmodule and rebuid node-sass.

Removing node_modules and running npm install if not fix try this command.

 ```
 npm rebuild node-sass
 ```

