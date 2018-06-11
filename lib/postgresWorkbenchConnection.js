var config = require('../config.js');
var conString = "postgres://" + config.workbenchConnectionConfig.user + ":" + config.workbenchConnectionConfig.password + "@" + config.workbenchConnectionConfig.host + ":" + config.workbenchConnectionConfig.port + "/" + config.workbenchConnectionConfig.internalname;
var async = require('async');
var pg = require('pg');
var uuid = require('node-uuid');
var async = require('async');

var buildQuery = function (type) {
    if (type === 'wiring')
        return 'INSERT INTO workflow (workflowjson) VALUES ($1)';
    else if (type === 'workflowgroup')
        return 'INSERT INTO workflowgrouplink (link) VALUES ($1)';
    else if (type === 'data')
        return 'INSERT INTO DATAMESSAGE (DATAJSON) VALUES ($1)';
    else if (type === 'user')
        return 'INSERT INTO USERDATA (USERDATA) VALUES ($1)';
    else if (type === 'role')
        return 'INSERT INTO ROLE (ROLE) VALUES ($1)';
    else if (type === 'group')
        return 'INSERT INTO GROUPDATA (GROUPDATA) VALUES ($1)';
    else if (type === 'result')
        return 'INSERT INTO result (result) VALUES ($1)';
    else if (type === 'run')
        return 'INSERT INTO runmessage (runjson) VALUES ($1)';
    else if (type === 'usergrouplink')
        return 'INSERT INTO usergrouplink (link) VALUES ($1)';
    else if (type === 'userrolelink')
        return 'INSERT INTO userrolelink (link) VALUES ($1)';
};

module.exports = postgresWorkbenchConnection = {

    write: function (type, msg, callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
				console.log(conString);
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

    // wirings

    readAllWirings: function (isPublic, user, callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var query;
            var queryParams;

            if (isPublic) {
                query = 'SELECT * FROM workflow WHERE workflowjson->> $1 = $2';
                queryParams = ['sharing', 'public'];
            } else {
                query = 'SELECT * FROM workflow WHERE workflowjson->> $1 = $2 AND workflowjson->> $3 = $4';
                queryParams = ['sharing', 'user', 'creator', user];
            }

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].workflowjson);

                callback(result);
            });
        });
    },

    getGroupsForSave: function (saveid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var query = 'SELECT * FROM workflowgrouplink WHERE link ->> $1 = $2';
            var queryParams = ['saveid', saveid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.length; i++)
                    result.push(res[i].link.saveid);

                callback(result);
            });
        });
    },

    // results and runs

    readResults: function (runid, callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var query = 'SELECT * FROM result WHERE result ->> $1 = $2';
            var queryParams = ['runid', runid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++) {
                    result.push(res.rows[i].result);
                }

                callback(result);
            });
        });

    },

    readErrorResults: function (runid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT * FROM errormessage WHERE errorjson ->> $1 = $2';
            var queryParams = ['runid', runid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].errorjson);

                callback(result);
            });
        });
    },

    updateRun: function (runid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2';
            var queryParams = ['runid', runid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i]);
                if (result.length) {
                    result[0].runjson.runstatus = 3;

                    var updateQuery = 'UPDATE runmessage SET runjson = $1 WHERE runjson ->> $2 = $3';
                    var updateQueryParams = [result[0].runjson, 'runid', runid];

                    client.query(updateQuery, updateQueryParams, function (err, res) {
                        done();

                        if (err) {
                            return console.error('error runing query', err);
                        }
                        callback();
                    });
                }

            });
        });

    },

    deleteRunById: function (runid, user, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2';
            var queryParams = ['runid', runid];

            client.query(query, queryParams, function (err, res) {
                done();
                if (err) {
                    return console.error('error running query', err);
                }

                if (res.rows && res.rows[0] && res.rows[0].runjson) {
                    if (res.rows[0].runjson.creator === user) {
                        postgresWorkbenchConnection.internalDeleteRunById(runid, callback);
                    }
                }
            });

        });
        //pg.connect(conString, function (err, client, done) {
        //    if (err) {
        //        return console.error('error fetching client from pool', err);
        //    }
        //
        //    var query = 'DELETE FROM runmessage WHERE runjson ->> $1 = $2 AND runjson ->> $3 = $4';
        //    var queryParams = ['runid', runid, 'userid', user];
        //
        //    client.query(query, queryParams, function (err, res) {
        //        done();
        //
        //        if (err) {
        //            return console.error('error running query', err);
        //        }
        //        query = 'DELETE FROM rungrouplink WHERE link ->> $1 = $2';
        //        queryParams = ['runid', runid];
        //
        //        client.query(query, queryParams, function (err, res) {
        //            done();
        //
        //            if (err) {
        //                return console.error('error running query', err);
        //            }
        //
        //            query = 'DELETE FROM result WHERE result ->> $1 = $2';
        //            queryParams = ['runid', runid];
        //
        //            client.query(query, queryParams, function (err, res) {
        //                done();
        //
        //                if (err) {
        //                    return console.error('error running query', err);
        //                }
        //                callback();
        //
        //            });
        //
        //        });
        //
        //    });
        //});

    },

    internalDeleteRunById: function(runid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            //var query = 'DELETE FROM runmessage WHERE runjson ->> $1 = $2 AND runjson ->> $3 = $4';
            //var queryParams = ['runid', runid, 'userid', user];
            var query = 'DELETE FROM runmessage WHERE runjson ->> $1 = $2';
            var queryParams = ['runid', runid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                query = 'DELETE FROM rungrouplink WHERE link ->> $1 = $2';
                queryParams = ['runid', runid];

                client.query(query, queryParams, function (err, res) {
                    done();

                    if (err) {
                        return console.error('error running query', err);
                    }

                    query = 'DELETE FROM result WHERE result ->> $1 = $2';
                    queryParams = ['runid', runid];

                    client.query(query, queryParams, function (err, res) {
                        done();

                        if (err) {
                            return console.error('error running query', err);
                        }
                        callback(runid);

                    });

                });

            });
        });
    },

    deleteSaveById: function (runid, user, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT workflowjson FROM workflow WHERE workflowjson ->> $1 = $2';
            var queryParams = ['saveid', runid];

            client.query(query, queryParams, function (err, res) {
                done();
                if (err) {
                    return console.error('error running query', err);
                }

                if (res.rows && res.rows[0] && res.rows[0].workflowjson) {
                    if (res.rows[0].workflowjson.creator === user) {
                        postgresWorkbenchConnection.internalDeleteSaveById(runid, callback);
                    }
                }
            });
        });

        //pg.connect(conString, function (err, client, done) {
        //    if (err) {
        //        return console.error('error fetching client from pool', err);
        //    }
        //
        //    //var query = 'DELETE FROM workflow WHERE workflowjson ->> $1 = $2 AND workflowjson ->> $3 = $4';
        //    //var queryParams = ['saveid', runid, 'creator', user];
        //    var query = 'DELETE FROM workflow WHERE workflowjson ->> $1 = $2';
        //    var queryParams = ['saveid', runid];
        //
        //    client.query(query, queryParams, function (err, res) {
        //        done();
        //
        //        if (err) {
        //            return console.error('error running query', err);
        //        }
        //        query = 'DELETE FROM workflowgrouplink WHERE link ->> $1 = $2';
        //        queryParams = ['runid', runid];
        //
        //        client.query(query, queryParams, function (err, res) {
        //            done();
        //
        //            if (err) {
        //                return console.error('error running query', err);
        //            }
        //
        //            //query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2 AND runjson ->> $3 = $4 AND runjson ->> $5 = $6';
        //            //queryParams = ['saveid', runid, 'userid', user, 'runstatus', 3];
        //            query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2';
        //            queryParams = ['saveid', runid];
        //
        //
        //            client.query(query, queryParams, function (err, res) {
        //                done();
        //
        //                if (err) {
        //                    return console.error('error running query', err);
        //                }
        //                var result = [];
        //                for (var i = 0; i < res.rows.length; i++)
        //                    result.push(res.rows[i].runjson.runid);
        //
        //                callback(result);
        //
        //            });
        //
        //        });
        //
        //    });
        //});

    },

    internalDeleteSaveById: function(runid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'DELETE FROM workflow WHERE workflowjson ->> $1 = $2';
            var queryParams = ['saveid', runid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }
                query = 'DELETE FROM workflowgrouplink WHERE link ->> $1 = $2';
                queryParams = ['runid', runid];

                client.query(query, queryParams, function (err, res) {
                    done();

                    if (err) {
                        return console.error('error running query', err);
                    }

                    query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2';
                    queryParams = ['saveid', runid];

                    client.query(query, queryParams, function (err, res) {
                        done();

                        if (err) {
                            return console.error('error running query', err);
                        }

                        var result = [];
                        for (var i = 0; i < res.rows.length; i++) {
                            result.push(res.rows[i].runjson.runid);
                        }

                        callback(result);

                    });

                });

            });
        });
    },

    getFinishedRuns: function (callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2 ORDER BY runjson ->> $3';
            var queryParams = ['runstatus', 3, 'rundate'];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].runjson);

                callback(result);
            });
        });
    },

    getResultInfo: function (runid, saveid, user, rundate, callback) {

        var resultinfo = {
            runid: runid,
            saveid: saveid,
            user: user,
            rundate: rundate
        };

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2 AND $3 = $4 AND $5 = $6 AND $7 = $8';
            var queryParams = ['runid', runid, 'userid', user, 'runstatus', 3, 'workflowid', saveid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                for (var i = 0; i < res.rows.length; i++) {
                    resultinfo.runname = res.rows[0].runjson.name;
                    resultinfo.rundescription = res.rows[0].runjson.description;

                }

                query = 'SELECT workflowjson FROM workflow WHERE workflowjson ->> $1 = $2';
                queryParams = ['saveid', saveid];

                client.query(query, queryParams, function (err, res) {
                    done();

                    if (err) {
                        return console.error('error running query', err);
                    }

                    for (var i = 0; i < res.rows.length; i++) {
                        resultinfo.wfname = res.rows[0].workflowjson.name;
                        resultinfo.wfdescription = res.rows[0].workflowjson.description;
                        resultinfo.wfwiring = res.rows[0].workflowjson.wiring;
                        resultinfo.wfdate = res.rows[0].workflowjson.date;
                    }

                    query = 'SELECT result FROM result WHERE result ->> $1 = $2';
                    queryParams = ['runid', runid];

                    client.query(query, queryParams, function (err, res) {
                        done();

                        if (err) {
                            return console.error('error running query', err);
                        }

                        var resultlinks = [];

                        for (var i = 0; i < res.rows.length; i++) {
                            resultlinks.push(res.rows[i].result.resultinfo);
                        }
                        resultinfo.resultlinks = resultlinks;

                        callback(resultinfo);

                    });

                });

            });
        });
    },

    getOwnedSaves: function (user, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT * FROM workflow WHERE workflowjson ->> $1 = $2';
            var queryParams = ['creator', user];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++) {
                    result.push(res.rows[i].workflowjson.saveid);
                }

                callback(result);
            });
        });
    },

    getAllSaves: function (callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT workflowjson FROM workflow';

            client.query(query, function(err, res){
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++) {
                    result.push(res.rows[i].workflowjson);
                }

                callback(result);
            });
        });
    },

    getOwnedRuns: function (user, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var query = 'SELECT * FROM runmessage WHERE runjson ->> $1 = $2 AND runjson ->> $3 = $4 ORDER BY runjson ->> $5';
            var queryParams = ['userid', user, 'runstatus', 3, 'rundate'];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];
                for (var i = 0; i < res.rows.length; i++) {
                    result.push(res.rows[i].runjson.runid);
                }
                callback(result);
            });
        });


    },

    getRunNamesForSave: function (user, saveId, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT * FROM runmessage WHERE runjson ->> $1 = $2 AND runjson ->> $3 = $4 AND runjson ->> $5 = $6';
            var queryParams = ['workflowid', saveId, 'userid', user, 'runstatus', 3];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];

                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].runjson.name);

                callback(result);
            });
        });

    },

    getGroupsForRun: function (runid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT link FROM rungrouplink WHERE link ->> $1 = $2';
            var queryParams = ['runid', runid];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];

                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].runid);

                callback(result);
            });
        });

    },

    // user stuff

    checkIfUserExists: function (username, email, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var queryUserName = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
            var queryUserNameParams = ['username', username];
            var queryUserEmail = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
            var queryUserEmailParams = ['email', email];

            client.query(queryUserName, queryUserNameParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }

                if (res.rows.length == 0) {
                    client.query(queryUserEmail, queryUserEmailParams, function (err, res) {
                        done();

                        if (err) {
                            return console.error('error running query', err);
                        }

                        if (res.rows.length == 0)
                            callback(null);
                        else
                            callback('email');

                    });
                } else {
                    done();
                    callback('name');
                }

            });
        });
    },

    readGroupByName: function (groupname, callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT groupdata FROM groupdata WHERE groupdata ->> $1 = $2';
            var queryParams = ['groupname', groupname];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                var result = [];

                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].groupname);

                callback(result);
            });
        });

    },

    getBasicUserDetails: function (userId, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
            var queryParams = ['userid', userId];

            client.query(query, queryParams, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                if (res && res.rows && res.rows[0]) {
                    callback(res.rows[0].userdata.username, res.rows[0].userdata.email);
                } else {
                    callback(null, null);
                }
            });
        });
    },

    removeUser: function (userId, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var queryUser = 'DELETE FROM userdata WHERE userdata ->> $1 = $2';
            var queryUserParams = ['userid', userId];
            var queryRoleLink = 'DELETE FROM userrolelink WHERE link ->> $1 = $2';
            var querygrouplink = 'DELETE FROM usergrouplink WHERE link ->> $1 = $2';


            client.query(queryUser, queryUserParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                client.query(queryRoleLink, queryUserParams, function (err, res) {

                    if (err) {
                        return console.error('error running query', err);
                    }
                    done();

                    client.query(querygrouplink, queryUserParams, function (err, res) {

                        if (err) {
                            return console.error('error running query', err);
                        }
                        done();
                        callback();

                    });

                });

            });
        });
    },

    removeRunGroup: function (param, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = "DELETE FROM rungrouplink WHERE link ->> $1 = $2";
            var queryParams = ["runid", param.id];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (param.ifPublic && param.groups) {

                    var groups = param.groups;

                    async.each(groups, function (group, cb) {
                        var id = uuid.v4();
                        var groupJson = {
                            uid: id,
                            flag: 31,
                            saveid: param.id,
                            groupid: group
                        };
                        var query = "INSERT INTO rungrouplink (link) VALUES ($1)";
                        var queryParams = [JSON.stringify(groupJson)];

                        client.query(query, queryParams, function (err, res) {

                            if (err) {
                                return console.error('error running query', err);
                            }
                            done();

                            cb();

                        });

                    }, function (err) {
                        callback();
                    });


                } else {
                    callback();
                }
            });
        });
        callback();
    },

    updateRename: function (userId, params, range, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT workflowjson FROM workflow WHERE workflowjson ->> $1 = $2 AND workflowjson ->> $3 = $4';
            var queryParams = ['saveid', params.id, 'creator', userId];

            client.query(query, queryParams, function (err, res) {
                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (res.rows.length) {

                    console.log(res);
                    var updateWorkflow = {
                        'saveid': params.id,
                        'flag': 3,
                        'name': params.name,
                        'description': params.description,
                        'wiring': res.rows[0].workflowjson.wiring,
                        'creator': userId,
                        'sharing': range,
                        'date': res.rows[0].workflowjson.date
                    };
                    var response = {};
                    response.ok = true;
                    response.name = params.name;
                    response.description = params.description;
                    response.id = params.id;
                    response.date = res.rows[0].workflowjson.date;

                    query = 'UPDATE workflow SET workflowjson = $1 WHERE workflowjson ->> $2 = $3 AND workflowjson ->> $4 = $5';
                    queryParams = [JSON.stringify(updateWorkflow), 'saveid', params.id, 'creator', userId];
                    client.query(query, queryParams, function (err, res) {
                        if (err) {
                            return console.error('error running query', err);
                        }
                        done();
                        console.log(params.id + " " + userId);

                        callback(response);
                    });
                } else {
                    var response = {};
                    response.ok = false;
                    response.name = params.name;
                    response.description = params.description;
                    response.id = params.id;
                    callback(response);
                }

            });
        });
    },

    removeGroupVisibility: function (userId, params, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = "DELETE FROM workflowgrouplink WHERE link ->> $1 = $2";
            var queryParams = ["saveid", params.id];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (params.ifPublic && params.groups) {

                    var groups = params.groups;

                    async.each(groups, function (group, cb) {
                        var id = uuid.v4();
                        var groupJson = {
                            uid: id,
                            flag: 30,
                            saveid: params.id,
                            groupid: group
                        };
                        var query = "INSERT INTO workflowgrouplink (link) VALUES ($1)";
                        var queryParams = [JSON.stringify(groupJson)];

                        client.query(query, queryParams, function (err, res) {

                            if (err) {
                                return console.error('error running query', err);
                            }
                            done();

                            cb();

                        });

                    }, function (err) {
                        callback();
                    });


                } else {
                    callback();
                }


            });


        });


        callback();
    },

    updateRunWithNewName: function (params, name, description, id, user, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT runjson FROM runmessage WHERE runjson ->> $1 = $2 AND runjson ->> $3 = $4 AND runjson ->> $5 = $6';
            var queryParams = ['runid', params.id, 'userid', user, 'runstatus', 3];

            client.query(query, queryParams, function (err, res) {
                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (res.rows.length) {
                    var oldRun = res.rows[0].runjson;

                    var updateRun = {
                        'runid': params.id,
                        'flag': 7,
                        'saveid': oldRun.saveid,
                        'userid': user,
                        'rundate': oldRun.rundate,
                        'runstatus': 3,
                        'runname': name,
                        'rundescription': description
                    };

                    query = 'UPDATE runmessage SET runjson = $1 WHERE runjson ->> $2 = $3 AND runjson ->> $4 = $5 AND runjson ->> $6 = $7';
                    queryParams = [JSON.stringify(updateRun), 'runid', params.id, 'userid', user, 'runstatus', 3];
                    client.query(query, queryParams, function (err, res) {
                        if (err) {
                            return console.error('error running query', err);
                        }
                        done();
                        callback(true);

                    });
                } else {
                    callback(false);
                }

            });
        });


    },

    removeGroup: function (groupid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var queryGroup = 'DELETE FROM groupdata WHERE groupdata ->> $1 = $2';
            var queryGroupParams = ['groupid', groupid];
            var queryGroupLink = 'DELETE FROM usergrouplink WHERE link ->> $1 = $2';


            client.query(queryGroup, queryGroupParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                client.query(queryGroupLink, queryGroupParams, function (err, res) {

                    if (err) {
                        return console.error('error running query', err);
                    }
                    done();

                    callback();

                });

            });
        });
    },

    getSaveGroups: function (saveid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT link FROM workflowgrouplink WHERE link ->> $1 = $2';
            var queryParams = ['saveid', saveid];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                var result = [];

                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].saveid);

                callback(result);

            });
        });
    },
    getGroupNames: function (ids, callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }
            var names = [];

            async.each(ids, function (id, cb) {
                var query = 'SELECT groupdata FROM groupdata WHERE groupdata ->> $1 = $2';
                var queryParams = ['groupid', id];
                client.query(query, queryParams, function (err, res) {

                    if (err) {
                        return console.error('error running query', err);
                    }
                    done();

                    for (var i = 0; i < res.rows.length; i++)
                        names.push(res.rows[i].groupdata.groupname);

                    cb();
                });

            }, function (err) {
                callback(names);

            });

        });
    },

    getUserGroups: function (user, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }


            var query = 'SELECT link FROM usergrouplink WHERE link ->> $1 = $2';
            var queryParams = ['userid', user];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                var result = [];

                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].link.groupid);

                callback(result);

            });
        });
    },

    getUserRoles: function (user, callback) {

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT link FROM userrolelink WHERE link ->> $1 = $2';
            var queryParams = ['userid', user];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                var result = [];

                for (var i = 0; i < res.rows.length; i++)
                    result.push(res.rows[i].userid);

                callback(result);

            });
        });
    },

    checkAdmin: function (userid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT link FROM userrolelink WHERE link ->> $1 = $2 AND link ->> $3 = $4';
            var queryParams = ['userid', userid, 'roleid', '0'];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (res.rows.length > 0)
                    callback(true);
                else
                    callback(false);
            });
        });
    },

    getFullUser: function (userid, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
            var queryParams = ['userid', userid];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (res.rows.length > 0)
                    callback(res.rows[0].userdata.username, res.rows[0].userdata.email);
                else
                    callback(null);
            });
        });
    },

    updateUser: function (userid, username, password, email, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var updateUser = {
                userid: userid,
                flag: 21,
                email: email,
                username: username,
                pw: password
            };

            var query = 'UPDATE userdata SET userdata = $1 WHERE userdata ->> $2 = $3';
            var queryParams = [updateUser, 'userid', userid];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                callback();
            });
        });

    },

    checkIfEmailExists: function (email, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
            var queryParams = ['email', email];

            client.query(query, queryParams, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                callback();
            });
        });
    },

    getAllUsers: function (callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT userdata FROM userdata';

            client.query(query, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                var users = {};

                if (res.rows.length > 0) {

                    for (var i = 0; i < res.rows.length; i++)
                        users[res.rows[i].userdata.userid] = res.rows[i].userdata.username;

                    callback(users);

                } else {
                    callback(null);
                }
            });
        });
    },
    getAllGroups: function (callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT groupdata FROM groupdata';

            client.query(query, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                var groups = {};

                if (res.rows.length > 0) {
                    for (var i = 0; i < res.rows.length; i++)
                        groups[res.rows[i].groupdata.groupid] = res.rows[i].groupdata.groupname;

                    callback(groups);

                } else {
                    callback(null);
                }
            });
        });
    },
    getAllRoles: function (callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT roledata FROM roledata';

            client.query(query, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                var roles = {};

                if (res.rows.length > 0) {
                    for (var i = 0; i < res.rows.length; i++)
                        roles[res.rows[i].roledata.roleid] = res.rows[i].roledata.rolename;

                    callback(roles);

                } else {
                    callback(null);
                }
            });
        });

    },

    getFullUserDetails: function (userid, callback) {
        var userDetails = {};

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT userdata FROM userdata WHERE userdata ->> $1 = $2';
            var queryParam = ['userid', userid];

            // get user
            client.query(query, queryParam, function (err, res) {
                done();

                if (err) {
                    return console.error('error running query', err);
                }

                for (var i = 0; i < res.rows.length; i++) {
                    userDetails['userId'] = res.rows[i].userdata.userid;
                    userDetails['userName'] = res.rows[i].userdata.username;
                    userDetails['userEmail'] = res.rows[i].userdata.email;
                }

                // get groups

                var userGroups = {};

                query = 'SELECT link FROM usergrouplink WHERE link ->> $1 = $2';
                queryParam = ['userid', userid];

                client.query(query, queryParam, function (err, res) {
                    done();

                    if (err) {
                        return console.error('error running query', err);
                    }

                    async.each(res.rows, function (link, cbpersistinner) {
                        query = 'SELECT groupdata FROM groupdata WHERE groupdata ->> $1 = $2';
                        queryParam = ['groupid', link.link.groupid];


                        client.query(query, queryParam, function (err, res) {
                            done();
                            if (err) {
                                cbpersistinner(err);
                            }

                            for (var i = 0; i < res.rows.length; i++) {
                                userGroups[res.rows[i].groupdata.groupid] = res.rows[i].groupdata.groupname;
                            }
                            cbpersistinner();
                        });
                    }, function (err) {
                        userDetails['userGroups'] = userGroups;

                        // get roles
                        var userRoles = {};

                        query = 'SELECT link FROM userrolelink WHERE link ->> $1 = $2';
                        queryParam = ['userid', userid];

                        client.query(query, queryParam, function (err, res) {
                            done();

                            if (err) {
                                return console.error('error running query', err);
                            }

                            async.each(res.rows, function (link, cbpersistinner) {

                                query = 'SELECT roledata FROM roledata WHERE roledata ->> $1 = $2';
                                queryParam = ['roleid', link.link.roleid];


                                client.query(query, queryParam, function (err, res) {
                                    done();
                                    if (err) {
                                        cbpersistinner(err);
                                    }

                                    for (var i = 0; i < res.rows.length; i++) {
                                        userRoles[res.rows[i].roledata.roleid] = res.rows[i].roledata.rolename;
                                    }
                                    cbpersistinner();
                                });
                            }, function (err) {
                                userDetails['userRoles'] = userRoles;
                                callback(userDetails);
                            });
                        });

                    });


                });

            });
        });

    },

    // user details save

    saveUserDetails: function (userid, groups, roles, callbackOut) {

        var that = this;

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT * FROM usergrouplink WHERE link ->> $1 = $2';
            var param = ['userid', userid];

            client.query(query, param, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                // first if user now has no group, delete all usergroup elements
                if (groups.length == 0) {
                    async.eachSeries(res.rows, function (result, callback) {
                        that.removeUserGroupLink(result, function () {
                            callback();
                        })
                    }, function (err) {
                        // now set roles
                        that.addRolesToUser(function (res) {
                            callbackOut(res);
                        });
                    });
                    // user has usergroups selected, now we check if new ones are added or some groups are removed
                } else {
                    // there are already some existing usergroups assigned to the selected user
                    if (res.rows.length > 0) {
                        async.series([
                            // first check if there are groups removed
                            that.removeDeselectedGroupsFromUser(groups, res.rows),
                            // add new groups to database
                            that.addSelectedGroupsToUser(groups, res.rows, userid)
                        ], function (err, results) {
                            that.addRolesToUser(roles, userid, function (res) {
                                callbackOut(res);
                            });
                        });
                    }
                    // no groups are assigned to the selected user
                    else {
                        async.eachSeries(groups, function (groupId, callback) {
                            var grouplink = {uid: uuid.v4(), flag: 23, groupid: groupId, userid: userid};
                            that.write('usergrouplink', grouplink, function () {
                                callback();
                            });

                        }, function (err) {
                            callbackOut(true);
                        });
                    }

                }
            });
        });
    },

    removeUserGroupLink: function (id, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'DELETE FROM usergrouplink where id = ' + id;

            client.query(query, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                callback();
            });
        });

    },

    removeUserRoleLink: function (id, callback) {
        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'DELETE FROM userrolelink WHERE id = ' + id;
            console.log(query);

            client.query(query, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();


                callback();
            });
        });
    },

    removeDeselectedGroupsFromUser: function (chosenGroups, groups) {

        var that = this;
        return function (cb) {
            async.eachSeries(groups, function (usergroup, callback) {
                // group removed from user -> remove it from database
                if (chosenGroups.indexOf(usergroup.link.groupid) == -1) {
                    that.removeUserGroupLink(usergroup.id, function () {
                        callback();
                    })
                } else {
                    callback();
                }
            }, function (err) {
                cb(err, null);
            });
        };
    },

    addSelectedGroupsToUser: function (chosenGroups, groups, userid) {
        var that = this;

        return function (callbackadded) {

            // look if groupid is in the set of ids from usergroups
            async.eachSeries(chosenGroups, function (groupid, callbackout) {
                var insert = true;
                async.eachSeries(groups, function (usergroup, callbackinner) {
                    if (groupid == usergroup.link.groupid) {
                        insert = false;
                    }
                    callbackinner();
                }, function (err) {
                    if (insert) {
                        var userGroupElement = {uid: uuid.v4(), flag: 23, userid: userid, groupid: groupid};
                        that.write('usergrouplink', userGroupElement, function () {
                            callbackout();
                        })
                    } else {
                        callbackout();
                    }
                });
            }, function (err) {
                callbackadded(err, null);
            });
        }

    },

    removeDeselectedRolesFromUser: function (chosenRoles, roles) {

        var that = this;
        return function (cb) {
            async.eachSeries(roles, function (userrole, callback) {
                // group removed from user -> remove it from database
                if (chosenRoles.indexOf(userrole.link.roleid) == -1) {
                    that.removeUserRoleLink(userrole.id, function () {
                        callback();
                    })
                } else {
                    callback();
                }
            }, function (err) {
                cb(err, null);
            });
        };
    },

    addSelectedRolesToUser: function (chosenRoles, roles, userid) {
        var that = this;

        return function (callbackadded) {

            // look if groupid is in the set of ids from usergroups
            async.eachSeries(chosenRoles, function (roleid, callbackout) {
                var insert = true;
                async.eachSeries(roles, function (userrole, callbackinner) {
                    if (roleid == userrole.link.roleid) {
                        insert = false;
                    }
                    callbackinner();
                }, function (err) {
                    if (insert) {
                        var userrolele = {uid: uuid.v4(), flag: 25, userid: userid, roleid: roleid};
                        that.write('userrolelink', userrolele, function () {
                            callbackout();
                        })
                    } else {
                        callbackout();
                    }
                });
            }, function (err) {
                callbackadded(err, null);
            });
        }

    },

    addRolesToUser: function (roles, userid, cb) {

        var that = this;

        pg.connect(conString, function (err, client, done) {
            if (err) {
                return console.error('error fetching client from pool', err);
            }

            var query = 'SELECT * FROM userrolelink WHERE link ->> $1 = $2';
            var param = ['userid', userid];

            client.query(query, param, function (err, res) {

                if (err) {
                    return console.error('error running query', err);
                }
                done();

                if (roles.length == 0) {
                    async.eachSeries(res.rows, function (result, callback) {
                        that.removeUserRoleLink(result, function () {
                            callback();
                        })
                    }, function (err) {
                        cb(true);
                    });
                } else {
                    if (res.rows.length > 0) {
                        async.series([
                            // first check if there are groups removed
                            that.removeDeselectedRolesFromUser(roles, res.rows),
                            // add new groups to database
                            that.addSelectedRolesToUser(roles, res.rows, userid)
                        ], function (err, results) {
                            cb(true);
                        });
                    }
                    // no groups are assigned to the selected user
                    else {
                        async.eachSeries(roles, function (roleid, callback) {
                            var grouplink = {uid: uuid.v4(), flag: 25, roleid: roleid, userid: userid};
                            that.write('userrolelink', grouplink, function () {
                                callback();
                            });

                        }, function (err) {
                            cb(true);
                        });
                    }

                }
            });
        });


    }


};