var config = require('../config.js');
var conString = "postgres://" + config.messageConnectionConfig.user + ":" + config.messageConnectionConfig.password + "@" + config.messageConnectionConfig.host
    + ":" + config.messageConnectionConfig.port + "/" + config.messageConnectionConfig.internalname;
var pg = require('pg');

var clients = {};

var buildQuery = function (type) {
    if (type === 'command')
        return 'INSERT INTO COORDINATIONMESSAGE (COORDINATIONJSON) VALUES ($1)';
    else if (type === 'run')
        return 'INSERT INTO RUNMESSAGE (RUNJSON) VALUES ($1)';
    else if (type === 'data')
        return 'INSERT INTO DATAMESSAGE (DATAJSON) VALUES ($1)';
};

var firstrun = true;


module.exports = postgresqlConnection = {

    write: function (type, msg, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = buildQuery(type);

            client.query(query, [JSON.stringify(msg)], function (err, result) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                callback();
            });
        });
    },

    update: function (msg, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = "UPDATE COORDINATIONMESSAGE SET COORDINATIONJSON = $1 WHERE COORDINATIONJSON->>'runid' = $2 AND COORDINATIONJSON->>'instanceid' = $3;";

            client.query(query, [msg, msg.runid, msg.instanceid], function (err, result) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                callback();
            });

        });
    },

    registerForNotification: function (type, runid, callback) {
        console.log("registerForNotification called with type, runid: ", type, runid);
        if (!clients[runid]) {
            clients[runid] = {
                connections: []
            }
        }
        // function that establishes a client which listens on the provided postgres channel

        // var executeNotification = function (callbackCommand, messageAttribute, listenChannel){
        //     pg.connect(conString, function(err, client, done) {
        //         if(err) {
        //             return console.log(err);
        //         }
        //         var channel = {
        //             'client' : client,
        //             'name' : listenChannel,
        //             'done' : done
        //         };
        //         clients[runid].connections.push(channel);
        //
        //         client.on('notification', function(msg) {
        //             var json_msg = JSON.parse(msg.payload);
        //             callback(callbackCommand, json_msg[messageAttribute]);
        //         });
        //         client.query("LISTEN "+ listenChannel + ";");
        //     });
        // };

        var executeNotification = function (callbackCommand, messageAttribute, listenChannel) {
            var client = new pg.Client(conString);
            var channel = {
                'client': client,
                'name': listenChannel,
                'done': function(){}
            };
            clients[runid].connections.push(channel);

            client.on('notification', function (msg) {
                var json_msg = JSON.parse(msg.payload);
                callback(callbackCommand, json_msg[messageAttribute]);
            });
            client.connect(function(err){
                if(err){
                    console.error("Error establishing connection in registerForNotification", err)
                }
                client.query("LISTEN " + listenChannel + ";");
            });
        };

        if (type === 'command') {
            executeNotification('COORDINATION/UPDATE', 'coordinationjson', 'coordination_update');
        } else if (type === 'run') {
            executeNotification('RUN/UPDATE', 'runjson', 'run_update');
        } else if (type === 'result') {
            executeNotification('RESULT/UPDATE', 'result', 'result_update');
        } else if (type === 'error'){
            callback('ERROR','error','error_channel')
        }
    },

    unregister: function (topic, runid, callback) {
        console.log("Unregister Called with runid:", runid);

            if (clients.hasOwnProperty(runid)) {
                for (var i = 0; i < clients[runid].connections.length; i++) {
                    var channel = clients[runid].connections[i];
                    // channel.client.query("UNLISTEN " + channel.name + ";", function () {
                    //     console.log("Client end being called");
                    //     console.log(channel.name);
                    //     var localChannel = channel;
                    //     channel.client.end();
                    // });
                    console.log("Client end being called");
                    channel.client.end();
                }
                delete clients[runid];
            }

            callback();
    },

    read: function (callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT AGENTJSON FROM AGENTDESCRIPTION';

            client.query(query, function (err, result) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                callback(result);
            });
        });

    }
};
