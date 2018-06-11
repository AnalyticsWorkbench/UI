For running the Workbench, some additional folders and files are necessary:

"results" - the folder which is used to server analysis results

"security" - the folder containing the security information for https/wss
   - nodeworkbench.key - private key file (filename is an example, may be configured)
   - nodeworkbench.crt - certificate file (filename is an example, may be configured)
   
   (Tutorial for creating keys, for "on a Mac" but actually "using openssl":
    http://houseofding.com/2008/11/generate-a-self-signed-ssl-certificate-for-local-development-on-a-mac/)
    
You have to create users by running "usercreator.js" (whenever you start with a completely SQLSpaces server)

Main file is workbench.js


  - first install necessary module by "npm install" in this directory
  - [not always] second step: run "node usercreator.js"
  - then run "node workbench.js"