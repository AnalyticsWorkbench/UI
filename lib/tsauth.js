var LocalStrategy = require('passport-local').Strategy;
//var passport = require('passport');
var TS = require('sqlspaces');
var config = require('../config.js');
var crypto = require('crypto');
var pg = require('pg');
var connectionUserSpace = {
    host: config.workbenchConnectionConfig.host,
    port: config.workbenchConnectionConfig.port,
    space: 'userSpace'
};

module.exports = tsauth = {

    usercache: {},

    initTSAuth: function () {

        console.log('initialize authorization strategy');

        return new LocalStrategy(
            function (username, password, done) {

                if (config.workbenchConnection === 'sqlspaces') {

                    var ts = new TS.TupleSpace(connectionUserSpace, function () {

                        var userTemplateTuple = new TS.Tuple([
                            TS.fString,
                            21,
                            username,
                            TS.fString,
                            TS.fString]);

                        ts.read(userTemplateTuple, function (tuple) {
                            if (tuple) {
                                var pass = tuple.getField(3).getValue();
                                if (pass != crypto.createHash('md5').update(password).digest('hex')) {
                                    ts.disconnect();
                                    return done(null, false, {message: 'Incorrect password.'});
                                }

                                // assumption: admin-role has ID 0
                                var adminTemplateTuple = new TS.Tuple([
                                    TS.fString,
                                    25,
                                    tuple.getField(0).getValue(),
                                    '0'
                                ]);

                                var user = {
                                    name: username,
                                    id: tuple.getField(0).getValue(),
                                    mail: tuple.getField(4).getValue(),
                                    admin: false
                                };

                                ts.read(adminTemplateTuple, function (tuple) {
                                    if (tuple) {
                                        user.admin = true;
                                    }
                                    tsauth.usercache[user.id] = user;
                                    ts.disconnect();
                                    return done(null, user);
                                });

                            } else {

                                var mailTemplateTuple = new TS.Tuple([
                                    TS.fString,
                                    21,
                                    TS.fString,
                                    TS.fString,
                                    username
                                ]);

                                ts.read(mailTemplateTuple, function (tuple) {
                                    if (tuple) {

                                        var pass = tuple.getField(3).getValue();
                                        if (pass != crypto.createHash('md5').update(password).digest('hex')) {
                                            ts.disconnect();
                                            return done(null, false, {message: 'Incorrect password.'});
                                        }

                                        // assumption: admin-role has ID 0
                                        var adminTemplateTuple = new TS.Tuple([
                                            TS.fString,
                                            25,
                                            tuple.getField(0).getValue(),
                                            '0'
                                        ]);

                                        var user = {
                                            name: username,
                                            id: tuple.getField(0).getValue(),
                                            mail: tuple.getField(4).getValue(),
                                            admin: false
                                        };

                                        ts.read(adminTemplateTuple, function (tuple) {
                                            if (tuple) {
                                                user.admin = true;
                                            }
                                            tsauth.usercache[user.id] = user;
                                            ts.disconnect();
                                            return done(null, user);
                                        });

                                    } else {
                                        ts.disconnect();
                                        return done(null, false, {message: 'User not found.'});
                                    }
                                });

                            }
                        });

                    });

                } else if (config.workbenchConnection === 'postgresql') {
                    var conString = "postgres://" + config.workbenchConnectionConfig.user + ":" + config.workbenchConnectionConfig.password + "@" + config.workbenchConnectionConfig.host 
						+ ":" + config.workbenchConnectionConfig.port + "/" + config.workbenchConnectionConfig.internalname;
						
                    pg.connect(conString, function (err, client, doneDB) {
                        if (err) {
                            return console.error('error fetching client from pool', err);
                        }

                        var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
                        var queryParams = ['username', username];

                        client.query(query, queryParams, function (err, res) {

                            if (err) {
                                return console.error('error running query', err);
                            }
                            doneDB();

                            if (res.rows.length > 0) {

                                var result = res.rows[0];

                                var pass = result.userdata.pw;
                                if (pass != crypto.createHash('md5').update(password).digest('hex')) {
                                    return done(null, false, {message: 'Incorrect password. '});
                                }

                                var user = {name: username, id: result.userdata.userid, mail: result.userdata.email, admin: false};

                                query = 'SELECT link FROM userrolelink WHERE link ->> $1 = $2 AND link ->> $3 = $4';
                                queryParams = ['userid', result.userdata.userid, 'roleid', 0];

                                client.query(query, queryParams, function (err, res) {
                                    if (err) {
                                        return console.error('error running query', err);
                                    }
                                    doneDB();

                                    if (res.rows.length > 0) {
                                        user.admin = true;
                                    }

                                    tsauth.usercache[user.id] = user;
                                    return done(null, user);

                                });

                            } else {
                                var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
                                var queryParams = ['email', username];

                                client.query(query, queryParams, function (err, res) {

                                    if (err) {
                                        return console.error('error running query', err);
                                    }
                                    doneDB();
                                    if (res.rows.length > 0) {

                                        var result = res.rows[0];

                                        var pass = result.userdata.pw;
                                        if (pass != crypto.createHash('md5').update(password).digest('hex')) {
                                            return done(null, false, {message: 'Incorrect password. '});
                                        }

                                        var user = {
                                            name: username,
                                            id: result.userdata.userid,
                                            mail: result.userdata.email,
                                            admin: false
                                        };

                                        query = 'SELECT link FROM userrolelink WHERE link ->> $1 = $2 AND link ->> $3 = $4';
                                        queryParams = ['userid', result.userdata.userid, 'roleid', 0];

                                        client.query(query, queryParams, function (err, res) {
                                            if (err) {
                                                return console.error('error running query', err);
                                            }
                                            doneDB();

                                            if (res.rows.length > 0) {
                                                user.admin = true;
                                            }

                                            tsauth.usercache[user.id] = user;
                                            return done(null, user);

                                        });


                                    } else {
                                        return done(null, false, {message: 'User not found.'});
                                    }

                                });

                            }
                        });
                    });
                }
            }
        );

    },

    serializeUser: function (user, done) {
        done(null, user.id);
    },

    deserializeUser: function (id, done) {

        if (tsauth.usercache[id]) {
            done(null, tsauth.usercache[id]);
        } else {

            if (config.workbenchConnection === 'sqlspaces') {
                var ts = new TS.TupleSpace(config.usertsconfig, function () {

                    var userTemplateTuple = new TS.Tuple([
                        id,
                        21,
                        TS.fString,
                        TS.fString,
                        TS.fString]);

                    ts.read(userTemplateTuple, function (tuple) {
                        if (tuple) {

                            // assumption: admin-role has ID 0
                            var adminTemplateTuple = new TS.Tuple([
                                TS.fString,
                                25,
                                tuple.getField(0).getValue(),
                                '0'
                            ]);

                            var user = {
                                name: tuple.getField(2).getValue(),
                                id: id,
                                mail: tuple.getField(4).getValue(),
                                admin: false
                            };

                            ts.read(adminTemplateTuple, function (tuple) {
                                if (tuple) {
                                    user.admin = true;
                                }
                                tsauth.usercache[user.id] = user;
                                ts.disconnect();
                                done(null, user);
                            });

                        } else {
                            ts.disconnect();
                            done(new Error('User ' + id + ' does not exist!'));
                        }
                    });

                });
            } else if (config.workbenchConnection === 'postgresql') {

            	var conString = "postgres://" + config.workbenchConnectionConfig.user + ":" + config.workbenchConnectionConfig.password + "@" + config.workbenchConnectionConfig.host + "/" + config.workbenchConnectionConfig.internalname;

                pg.connect(conString, function (err, client, doneDB) {
                    if (err) {
                        return console.error('error fetching client from pool', err);
                    }

                    var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
                    var queryParams = ['userid', id];

                    client.query(query, queryParams, function (err, res) {

                        if (err) {
                            return console.error('error running query', err);
                        }
                        doneDB();

                        if (res.rows.length > 0) {
                            var user = {
                                name: res.rows[0].userdata.username,
                                id: id,
                                mail: res.rows[0].userdata.email,
                                admin: false
                            };

                            query = 'SELECT link FROM userrolelink WHERE link ->> $1 = $2 AND $3 = $4';
                            queryParams = ['userid', id, 'roleid', 0];
                            client.query(query, queryParams, function (err, res) {
                                if (err) {
                                    return console.error('error running query', err);
                                }
                                doneDB();

                                if (res.rows.length > 0) {
                                    user.admin = true;
                                }
                                tsauth.usercache[user.id] = user;
                                done(null, user);
                            });
                        } else {
                            done(new Error('User ' + id + ' does not exist!'));
                        }
                    });
                });

            }

        }

    }

}
