var mqtt = require('mqtt');
var config = require('../config.js');

var clients = {};

module.exports = mqttConnection = {


    write: function (type, msg, callback) {

        var client = mqtt.connect('mqtt://' + config.messageConnectionConfig.host);

        client.on('error', function (err) {
            console.log(err);
            callback();
        });

        client.on('connect', function () {
            if (type === 'command')
                client.publish('COORDINATION/NEW', JSON.stringify(msg));
            else if (type === 'run')
                client.publish('RUN/NEW', JSON.stringify(msg));
            else if (type === 'runupdate')
                client.publish('RUN/UPDATE', JSON.stringify(msg));
            else if (type === 'data')
                client.publish('DATA', JSON.stringify(msg));
            else if (type === 'agentbroadcast')
                client.publish('AGENTDESCRIPTION/DELETE', JSON.stringify(msg));

            client.end();
            callback();
        });

        client.on('error', function (err) {
            console.log(err);
        });
    },

    update: function (msg, callback) {
        var client = mqtt.connect('mqtt://' + config.messageConnectionConfig.host);

        client.on('error', function (err) {
            console.log(err);
            callback();
        });

        client.on('connect', function () {
            client.publish('COORDINATION/UPDATE', JSON.stringify(msg));

            client.end();
            callback();

        });

    },

    registerForNotification: function (type, runid, callback) {

        if (!clients[runid]) {
            clients[runid] = {
                connections: []
            }
        }

        var client = mqtt.connect('mqtt://' + config.messageConnectionConfig.host);

        clients[runid].connections.push(client);

        client.on('connect', function () {
            if (type === 'command')
                client.subscribe({'COORDINATION/UPDATE': 2});
            else if (type === 'run')
                client.subscribe('RUN/UPDATE');
            else if (type === 'descriptionCreate')
                client.subscribe('AGENTDESCRIPTION/NEW');
            else if (type === 'descriptionDelete')
                client.subscribe('AGENTDESCRIPTION/DELETE');
            else if (type === 'result')
                client.subscribe('RESULT');
        });

        client.on('message', function (topic, message) {
            var jsonmessage = JSON.parse(message.toString());
            callback(topic, jsonmessage);
        });

        client.on('error', function (err) {
            console.log(err);
        });
    },

    unregister: function (topic, runid, callback) {

        if (clients.hasOwnProperty(runid)) {
            for (var i = 0; i < clients[runid].connections.length; i++) {
                clients[runid].connections[i].end();
            }
            delete clients[runid];
        }

        callback();
    }
};