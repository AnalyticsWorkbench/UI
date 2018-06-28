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

  run the psql before runing workbench you can do it mannualy by command :
  ´´´
  postgres -D /usr/local/var/postgres
  ´´´
  - then run "node workbench.js":

   ```
   node workbench.js

```

  to create user having psql DB is neccessary:
```
  createdb demo
  ```
  check here for more info: https://www.postgresql.org/docs/8.0/static/app-createdb.html


  See https://github.com/AnalyticsWorkbench/Components for general instructions on system setup
