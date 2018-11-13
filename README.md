## Analytics Workbench Setup UI with NetBeans using PostgreSQL



For running the Workbench, some additional folders and files are necessary:
in UI folder:

```
$ cd UI 
$ mkdir security
```
```
$ cd UI/public_html
$ mkdir results
```

<img src="https://user-images.githubusercontent.com/17232450/45694821-61fc9d80-bb60-11e8-8eed-99125b729fa9.png" width="340" height="380">


"results" - the folder that is used to server analysis results.

Esp. meta-analysis output files with workflow_id will be addressed here in "public HTML" to generate the "meta.js" file which is input for frontend in ClientV2 JSON inspector react Component. (first GET in the work_flow script in utils folder). 

"security" - the folder containing the security information for https/wss
   - webworkbench.key - private key file (filename is an example, may be configured)
   - webworkbench.crt - certificate file (filename is an example, may be configured)

---
   (Tutorial for creating keys, for "on a Mac" but actually "using OpenSSL":
    http://houseofding.com/2008/11/generate-a-self-signed-ssl-certificate-for-local-development-on-a-mac/)

You have to create users by running "usercreator.js" (whenever you start with a completely SQLSpaces server)

The main file is workbench.js that can be executed

  - first, install the necessary module by "npm install" in this directory

  on Mac OS if you got an error on node install because of version No longer building under node 10.0.0 / macOS 10.13.4
  try this commands:

  ```
  $ brew install node@8
  $ brew link --overwrite --force node@8
  $ npm install noble
  ```

  - [not always] second step: run "node usercreator.js"
 ```
 node usercreator.js
```
  - [not always] second step: run "node postgresInitializer.js"
```
  $ node postgresInitializer.js
```
run the psql before running workbench you can do it manually by the command line :
```
  $ postgres -D /usr/local/var/postgres
```
   
   to create user having psql DB is necessary:
```
  created workbench
```
   To login into the workbench with (User: admin, Pass: admin-pw) running Start redis-server is necessary.
   Please clone this repository and follow Readme: 
   
   short commands in for running Redis-server :
   
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
  Or execute with your IDE.   
  check here for more info: https://www.postgresql.org/docs/8.0/static/app-createdb.html

  See https://github.com/AnalyticsWorkbench/Components for general instructions on system setup.

## Debugging ClientV2


#### 1 .npm install
for both previous UI and clientV2, the first command before execution in tasks folder is :
```
  $ npm install
```
  if you face problem check on this wiki you can find your solution 

  some common bug in npm install 

###### error :
  npm ERR! Unexpected end of JSON input while parsing near '...07dae64be","tarball":'

###### solution is clear your npm cash.  
```
  $ npm cache clean --force 
```
   after installing npm if you have the potential package lost try :
```
  $ npm audit
```
   and install missed dependencies.

#### 2. npm run compile
```
  npm run compile
```

###### error :
   
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
 in compile file uncomment above command for the mac system or
    
 paste and execute this command into terminal to compile react part into js in clientV2 in public_html folder.
 or go to the task folder which contains script files and do:
    
 You can open the terminal (press Ctrl + Alt + T) and cd to the target directory:

 cd /path/to/target
 ###### error : 
 sh: tasks/compile: Permission denied
To give the file "the_file_name" execute permission (if the file-system allows you with the RW rights):
```
$ chmod +x the_file_name

```  
##deleting Package.jason.lock file and Nodemodule folder 
before doing "npm install" again make sure you remove Package.jason.lock file and Nodemodule folder  then restart it again.

an example is here after you got permission and do ls you should see * on your script as permission granted by Linux core
then do "npm install" again.


<img src="https://user-images.githubusercontent.com/17232450/43264790-4e1fd0a0-90e7-11e8-91da-3b23b3a63a8f.png" width="660" height="380">


###### error : 
Node Sass does not yet support your current environment (macOS 10.12.1, Node 7.0.0)


###### solution is reinstall the nodmodule and rebuid node-sass.

Removing node_modules and running npm install if not fix,  then try this command.

 ```
 $ npm rebuild node-sass
 ```
 ###### error :
 Error: ENOENT: no such file or directory, open '/Users/farbodaprin/Desktop/UIgit/UI/security/webworkbench.key'
 check the security fokder if the webworkbench.key exist if the folder is empty do the instruction in commponent README.de to make the keys.
 
  ###### error :
  ```
  $ npm run build
   ```
  
  basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")
          ^^^^^^^

SyntaxError: missing ) after argument list
    at new Script (vm.js:74:7)
    at createScript (vm.js:246:10)
    at Object.runInThisContext (vm.js:298:10)
    at Module._compile (internal/modules/cjs/loader.js:657:28)
    at Module._extensions..js (internal/modules/cjs/loader.js:700:10)
    at Object.require.extensions.(anonymous function) [as .js] (/Users/farbodaprin/Desktop/WorkbenchUi-7-AUG/UI/clientV2/node_modules/babel-register/lib/node.js:152:7)
    at Module.load (internal/modules/cjs/loader.js:599:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)
    at Function.Module._load (internal/modules/cjs/loader.js:530:3)
    at Function.Module.runMain (internal/modules/cjs/loader.js:742:12)
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! webworkbench-client-v2@1.0.0 build: `tasks/build` ...

 ###### solution is update webpack.
 npm install --save-dev webpack
 
 ### Security
 
Before pushing your changes on the remote branch, make sure if you add your file into the stage, exclude the security folder which contains your private key with this command before committing.
```
$ git add -u
$ git reset -- main/dontcheckmein.txt
```

<img src="https://user-images.githubusercontent.com/17232450/45820995-6c49a380-bce8-11e8-87d3-7b7d8ad99bb8.png" width="460" height="420">

### Debugging and IDE tools:

suggested frontend debugging tool: Chrome extension **React**, **Redux**
for putting brack point on your browser go into **.webpack** folder and inside you can see all components before compilation into webpack.


<img src="https://user-images.githubusercontent.com/17232450/48421534-fb10f480-e75c-11e8-976f-5aee18557c0d.png" width="640" height="380">
 
