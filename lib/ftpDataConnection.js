var ftp = require('ftp');
var config = require('../config.js');
var async = require('async');

module.exports = ftpDataConnection = {

    storeData: function (uid, data, callback) {

        var client = new ftp();

        client.connect(config.dataConnectionConfig);

        client.on('error', function (err) {
            console.log(err);
            callback();
        });

        client.on('ready', function () {

            client.put(new Buffer(data.filedata), uid + '.' + data.filetype, function (err) {
                if (err) throw err;
                client.end();
                callback();


            });
        });
    }
};