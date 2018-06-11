/**
 * Created by Yassin on 02.06.2016.
 */
var config = require('../config.js');
var pgp = require('pg-promise')();

var connection =  {
    host : config.messageConnectionConfig.host,
    port : 5432,
    database : config.messageConnectionConfig.internalname,
    user : config.messageConnectionConfig.user,
    password : config.messageConnectionConfig.password
};

var database = pgp(connection);

var query = 'SELECT rtuple FROM public.availablescripts WHERE rtuple ->> $1 = $2 AND rtuple ->> $3 = $4;';
var parameters = ['userid', JSON.stringify(1),'public', 'user'];
console.log('Query:');
console.log(pgp.as.format(query,parameters));
database.any(query, parameters).then(function(data){
    console.log('Result:');
    console.log(data[0].rtuple.name);
    console.log('Length:' + data.length);
}).catch(function(err){
    console.log(err);
});

console.log(JSON.stringify(1));
