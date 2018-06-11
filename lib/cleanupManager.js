/**
 * Here any clean-up stuff like removing old agentdescriptions (if psql is chosen)
 */
var config = require('../config.js');
var cronJob = require('cron').CronJob;

var conString = "postgres://" + config.messageConnectionConfig.user + ":" + config.messageConnectionConfig.password + "@" + config.messageConnectionConfig.host 
+ ":" + config.messageConnectionConfig.port + "/" + config.messageConnectionConfig.internalname;
var pg = require('pg');


// cron job for agent description cleanup
function startCronJob() {
    // init cron job
    new cronJob('*/2 * * * *', function () {

        // read all agent descriptions which were not updated in the last 2 minutes
        pg.connect(conString, function(err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = "DELETE FROM agentdescription where timestamp < ( now() - interval '2 minutes' )";

            client.query(query, function(err, result) {
                done();

                if(err) {
                    return console.error('error running query', err);
                }
                // for debugging purpose
                //console.log('Cleanup Agent-Descriptions');
            });
        });


    }, null, true, 'Europe/Berlin');
}

function start() {

    console.log('started the housekeeper');

    // start cron job to cleanup old agentdescriptions if psql is chosen
    if (config.messageConnection === 'postgresql') {
        startCronJob();
    }
}

module.exports = cleanupManager = {

    start: function () {

        start();

    }
};