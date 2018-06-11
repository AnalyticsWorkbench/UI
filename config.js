var fs = require('fs');

module.exports = config = {

    /*
        Port for plain http connection (only used as entry-point, then immediately redirected to https)
     */
    plainport: 3080,

    /*
        Port for https
     */
    secureport: 3081,

    // connection configs

    messageConnectionConfig : { host: 'localhost', port: 5432, user: 'workbench', password: 'workbench', internalname: 'workbench'},

    dataConnectionConfig : { host: 'localhost', port: 5432, user: 'workbench', password: 'workbench', internalname: 'workbench'},

    workbenchConnectionConfig : { host: 'localhost', port: 5432, user: 'workbench', password: 'workbench', internalname: 'workbench'},

    // select which backend is used (currently supported: message connection - mqtt, postgresql, data connection - ftp, postgresq
    // workbenchConnection - sqlspaces, postgresql)

    // mqtt or postgresql
    messageConnection: 'postgresql',

    // ftp or postgresql
    dataConnection: 'postgresql',

    // sqlspaces or postgresql
    workbenchConnection: 'postgresql',

    /*
        Certificate information for SSL connection (https)
     */
	ssloptions: {
//		ca: fs.readFileSync(__dirname + '/security/nodeworkbench.ca'),
		cert: fs.readFileSync(__dirname + '/security/webworkbench.crt'),
		key: fs.readFileSync(__dirname + '/security/webworkbench.key')
	},

    /*
        Host for which the ssl certificate is valid
     */
    // sslhost: 'workbench.collide.info'
    sslhost: 'localhost',

    /*
        Decide if you want to show information about the account guest/guest
     */
    allowguest: true,

    /*
     Directory from which results are served
     */
    resultdir: 'results'
};
