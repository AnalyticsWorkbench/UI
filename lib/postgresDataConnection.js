var config = require('../config.js');
var conString = "postgres://" + config.dataConnectionConfig.user + ":" + config.dataConnectionConfig.password + "@" + config.dataConnectionConfig.host 
+ ":" + config.dataConnectionConfig.port + "/" + config.dataConnectionConfig.internalname;
var pg = require('pg');

module.exports = postgresDataConnection = {

    storeData: function (uid, data, callback) {

        var client = new pg.Client(conString);
        client.connect(function(err) {
            if(err) {
                return console.error('could not connect to postgres', err);
            }

            var query = "INSERT INTO DATA VALUES ($1, $2)";
            var key = uid + '.' + data.filetype;

            client.query(query, [key, new Buffer(data.filedata)], function(err) {
                if(err) {
                    return console.error('error running query', err);
                }
                client.end();
                callback();
            });
        });

    }
};