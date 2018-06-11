var TS = require('sqlspaces');

var crypto = require('crypto');

var pg = require('pg');

var async = require('async');

var config = require('./config.js');

console.log('user creator started');

if (config.workbenchConnection === 'sqlspaces') {

    var ts = new TS.TupleSpace({host: config.workbenchConnectionConfig.host, port: config.workbenchConnectionConfig.port, space: 'userSpace'}, function () {

        console.log('server connection established');

        // create new information to be written to the server

        var tuples = [];

        // create initial users

        // please adjust to your needs - at least one admin is necessary (see also role definition and user role assignment)

        // fields are: ID, 21 as flag for user tuple, user name, password (as md5 hash), email address

        tuples.push(new TS.Tuple(['user-1', 21, 'admin', crypto.createHash('md5').update('admin-pw').digest('hex'), 'wbadmin@localhost']));

        tuples.push(new TS.Tuple(['user-2', 21, 'user', crypto.createHash('md5').update('user-pw').digest('hex'), 'wbuser@localhost']));

        // create initial groups

        // please adjust to your needs

        // fields are: ID, 22 as flag for group tuple, group name

        tuples.push(new TS.Tuple(['group-1', 22, 'GroupA']));

        // assign users to groups

        // please adjust to your needs

        // fields are: ID, 23 as flag for user-group tuples, group ID, user ID

        tuples.push(new TS.Tuple(['user-group-1', 23, 'group-1', 'user-2']));

        // create initial roles

        // currently only administrator and analyst are understood by the system

        // no configuration needed here - please don't change!

        // fields are: ID, 24 as flag for role tuples, role name

        tuples.push(new TS.Tuple(['0', 24, 'administrator']));

        tuples.push(new TS.Tuple(['1', 24, 'analyst']));

        // assign users to roles

        // please adjust to your needs

        // fields are: ID, 25 as flag for user-role tuples, user ID, role ID

        tuples.push(new TS.Tuple(['user-role-1', 25, 'user-1', '0']));

        tuples.push(new TS.Tuple(['user-role-2', 25, 'user-2', '1']));

        // define templates for removing old data from SQLSpaces server

        var usertemplate = new TS.Tuple([TS.fString, 21, TS.fString, TS.fString, TS.fString]);

        var grouptemplate = new TS.Tuple([TS.fString, 22, TS.fString]);

        var usergrouptemplate = new TS.Tuple([TS.fString, 23, TS.fString, TS.fString]);

        var roletemplate = new TS.Tuple([TS.fString, 24, TS.fString]);

        var userroletemplate = new TS.Tuple([TS.fString, 25, TS.fString, TS.fString]);

        var templates = [];

        templates.push(usertemplate);

        templates.push(grouptemplate);

        templates.push(usergrouptemplate);

        templates.push(roletemplate);

        templates.push(userroletemplate);

        // start making changes

        removetuples(0, function () {

            console.log('removed old data');

            writetuples(0, function () {

                console.log('added new data');

                var check = false;

                if (check) {

                    // here you may add checks for users for testing if everything worked

                    // this check is based on the original user definitions in this file

                    checkuser('admin', crypto.createHash('md5').update('admin-pw').digest('hex'), function () {

                        console.log('disconnect from server');

                        ts.disconnect();

                    });

                } else {

                    console.log('disconnect from server');

                    ts.disconnect();

                }

            });

        });

        function removetuples(index, callback) {

            if (index < templates.length) {

                ts.takeAll(templates[index], function () {

                    removetuples(++index, callback);

                });

            } else {

                callback();

            }

        }

        function writetuples(index, callback) {

            if (index < tuples.length) {

                ts.write(tuples[index], function () {

                    writetuples(++index, callback);

                });

            } else {

                callback();

            }

        }

        function checkuser(name, pass, callback) {

            console.log('checking for user ' + name);

            var template = new TS.Tuple([TS.fString, 21, name, pass, TS.fString]);

            ts.read(template, function (data) {

                console.log('got data: ' + JSON.stringify(data));

                if (data) {

                    console.log('accepted');

                } else {

                    console.log('denied');

                }

                callback();

            });

        }

    });

} else if (config.workbenchConnection === 'postgresql') {

    var conString = "postgres://" + config.workbenchConnectionConfig.user + ":" + config.workbenchConnectionConfig.password + "@" + config.workbenchConnectionConfig.host + "/" + config.workbenchConnectionConfig.internalname;

    // this method inserts new user data

    var clearUserData = function (cbclear) {

        pg.connect(conString, function (err, client, done) {

            if (err) {

                return console.error('error fetching client from pool', err);

            }

            var querys = [];

            querys.push('TRUNCATE userdata');

            querys.push('TRUNCATE groupdata');

            querys.push('TRUNCATE roledata');

            querys.push('TRUNCATE userrolelink');

            querys.push('TRUNCATE usergrouplink');

            async.each(querys, function (query, callback) {

                client.query(query, function (err, result) {

                    done();

                    if (err) {

                        callback(err);

                    }

                    callback();

                });

            }, function (err) {

                if (err) {

                    throw new Error('Error occurred!');

                } else {

                    cbclear();

                }

            });

        });

    };

    var writeNewData = function (cbwrite) {

        function persist(type, data, cbpersist) {

            var query;

            var param = [];

            if (type === 'user')

                query = 'INSERT INTO USERDATA (USERDATA) VALUES ($1)';

            else if (type === 'role')

                query = 'INSERT INTO ROLEDATA (ROLEDATA) VALUES ($1)';

            else if (type === 'group')

                query = 'INSERT INTO GROUPDATA (GROUPDATA) VALUES ($1)';

            else if (type === 'usergrouplink')

                query = 'INSERT INTO USERGROUPLINK (LINK) VALUES ($1)';

            else if (type === 'userrolelink')

                query = 'INSERT INTO USERROLELINK (LINK) VALUES ($1)';

            pg.connect(conString, function (err, client, done) {

                if (err) {

                    return console.error('error fetching client from pool', err);

                }

                async.each(data, function (entry, cbpersistinner) {

                    param = [entry];

                    client.query(query, param, function (err, result) {

                        done();

                        if (err) {

                            cbpersistinner(err);

                        }

                        cbpersistinner();

                    });

                }, function (err) {

                    if (err) {

                        throw new Error('Error occurred!');

                    } else {

                        cbpersist();

                    }

                });

            });

        }

        async.series([

                function (callback) {

                    var userdata = [];

                    // user accounts

                    userdata.push({userid : 'user-1', flag: 21, username: 'admin', pw : crypto.createHash('md5').update('admin-pw').digest('hex'), email: 'wbadmin@localhost'});

                    userdata.push({userid : 'user-2', flag: 21, username: 'user', pw : crypto.createHash('md5').update('user-pw').digest('hex'), email: 'wbuser@localhost'});

                    persist('user', userdata, function() {

                        callback(null, 'user');

                    });

                },

                function (callback) {

                    var usergroup = [];

                    usergroup.push({groupid : 'group-1', flag : 22, groupname : 'GroupA'});

                    persist('group', usergroup, function() {

                        callback(null, 'group');

                    });

                },

                function (callback) {

                    var userroles = [];

                    userroles.push({roleid : 0, flag : 24, rolename : 'administrator'});

                    userroles.push({roleid : 1, flag : 24, rolename : 'analyst'});

                    persist('role', userroles, function() {

                        callback(null, 'role');

                    });

                },

                function (callback) {

                    var userlinkgroup = [];

                    userlinkgroup.push({uid : 'user-group-1', flag : 23, groupid : 'group-1', userid : 'user-2'});

                    persist('usergrouplink', userlinkgroup, function() {

                        callback(null, 'usergrouplink');

                    });

                },

                function (callback) {

                    var userlinkrole = [];

                    userlinkrole.push({uid : 'user-role-1', flag : 25, userid : 'user-1', roleid : 0});

                    userlinkrole.push({uid : 'user-role-2', flag : 25, userid : 'user-2', roleid : 1});

                    persist('userrolelink', userlinkrole, function() {

                        callback(null, 'userrolelink');

                    });

                }

            ],

            function (err, results) {

                cbwrite();

            });

    };

    console.log('postgres user creation started');

    clearUserData(function () {

        writeNewData(function () {

            console.log('All done. Please wait a moment while im finishing all db connections');

        });

    });

}