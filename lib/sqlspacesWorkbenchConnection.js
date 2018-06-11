var TS = require('sqlspaces');
var config = require('../config.js');
var connectionDefaultSpace = {host: config.workbenchConnectionConfig.host, port: config.workbenchConnectionConfig.port};
var async = require('async');
var crypto = require('crypto');
var uuid = require('node-uuid');
var connectionUserSpace = {
    host: config.workbenchConnectionConfig.host,
    port: config.workbenchConnectionConfig.port,
    space: 'userSpace'
};
var defaultSpace;
var userSpace;

// transforms given json object to tuple

var convertToTuple = function (msg) {

    var tuple = [];

    for (var key in msg)
        if (msg.hasOwnProperty(key))
            tuple.push(msg[key]);


    return new TS.Tuple(tuple);
};


// decides if tuple is written to defaultspace or to userspace

var toDefaultSpace = function (type) {

    if (type === 'wiring' || type === 'workflowgroup' || type === 'result' || type === 'run' || type === 'error')
        return true;
    else
        return false;
};


module.exports = splspacesWorkbenchConnection = {

    write: function (type, msg, callback) {

        var tuple = convertToTuple(msg);

        if (toDefaultSpace(type)) {
            if (defaultSpace == null)
                defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
                });

            defaultSpace.write(tuple, function () {
                callback();
            });


        } else {
            if (userSpace == null)
                userSpace = new TS.TupleSpace(connectionUserSpace, function () {
                });

            userSpace.write(tuple, function () {
                callback();
            });

        }
    },

    readAllWirings: function (isPublic, user, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var results = [];
        var template;

        if (isPublic) {
            template = new TS.Tuple([
                TS.fString, // save-id
                3,
                TS.fString, // short name
                TS.fString, // description
                TS.fString, // wiring
                TS.fString, // user name
                "public",   // sharing info
                TS.fString  // save date
            ]);
        } else {
            // create template for the private wiring tuples of the user
            template = new TS.Tuple([
                TS.fString, // save-id
                3,
                TS.fString, // short name
                TS.fString, // description
                TS.fString, // wiring
                user, // user name
                "user",   // sharing info
                TS.fString  // save date
            ]);
        }

        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {

                for (var i = 0; i < tuples.length; i++) {
                    var wiring = {
                        saveid: tuples[i].getField(0).getValue(),
                        name: tuples[i].getField(2).getValue(),
                        description: tuples[i].getField(3).getValue(),
                        wiring: tuples[i].getField(4).getValue(),
                        creator: tuples[i].getField(5).getValue(),
                        sharing: tuples[i].getField(6).getValue(),
                        date: tuples[i].getField(7).getValue()
                    };

                    results.push(wiring);
                }

                callback(results);
            } else {
                callback(results);
            }
        });


    },

    getGroupsForSave: function (saveid, callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var result = [];

        var template = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 30),
            TS.createActualField('string', saveid),
            TS.createFormalField('string')
        ]);

        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    result.push(tuples[i].getField(3).getValue());
                }
                callback(result);
            }
            else {
                callback(result)
            }

        });
    },

    readResults: function (runid, callback) {
        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var results = [];

        var templateTuple = new TS.Tuple([
            runid,
            8,
            TS.fString, // agent
            TS.fString, // link
            TS.fString, // name
            TS.fString	// description
        ]);
        defaultSpace.readAll(templateTuple, function (resultTuples) {
            if (resultTuples) {
                for (var i = 0; i < resultTuples.length; i++) {
                    var result = {
                        runid: resultTuples[i].getField(0).getValue(),
                        instanceid: resultTuples[i].getField(2).getValue(),
                        resultinfo: resultTuples[i].getField(3).getValue(),
                        resultname: resultTuples[i].getField(4).getValue(),
                        resultdescription: resultTuples[i].getField(5).getValue()
                    };
                    results.push(result);
                }
            }
            callback(results);
        });
    },

    readErrorResults: function (runid, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var templateTuple = new TS.Tuple([
            runid,
            5,
            TS.fString,
            TS.fString,
            TS.fString
        ]);

        defaultSpace.readAll(templateTuple, function (resultTuples) {

            var results = [];
            if (resultTuples) {
                for (var i = 0; i < resultTuples.length; i++) {
                    var result = {
                        runid: resultTuples[i].getField(0).getValue(),
                        agentid: resultTuples[i].getField(2).getValue(),
                        instanceid: resultTuples[i].getField(3).getValue(),
                        errormessage: resultTuples[i].getField(4).getValue()
                    };
                    results.push(result);
                }
            }

            callback(results);
        });
    },

    updateRun: function (runid, callback) {
        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var templateTuple = new TS.Tuple([
            runid,
            7,
            TS.fString,
            TS.fString,
            TS.fString,
            TS.fInteger,
            TS.fString,
            TS.fString
        ]);

        defaultSpace.read(templateTuple, function (tuple) {

            var id = tuple.getTupleID();
            var updateTuple = new TS.Tuple([tuple.getField(0), 7, tuple.getField(2), tuple.getField(3), tuple.getField(4), 3, tuple.getField(6), tuple.getField(7)]);

            defaultSpace.update(id, updateTuple, function () {
                callback();
            });
        })
    },

    getFinishedRuns: function (callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        // create template for successfully finished runs
        var template = new TS.Tuple([
            TS.fString, // run-id
            7,          // flag for run tuple
            TS.fString, // save-id
            TS.fString,       // user
            TS.fString, // date string
            3,          // flag for successfully done
            TS.fString, // run name
            TS.fString  // run description
        ]);

        // read all tuples matching the template
        defaultSpace.readAll(template, function (tuples) {

            var runs = [];

            if (tuples) {

                for (var i = 0; i < tuples.length; i++) {
                    var run = {
                        runid: tuples[i].getField(0).getValue(),
                        saveid: tuples[i].getField(2).getValue(),
                        userid: tuples[i].getField(3).getValue(),
                        rundate: tuples[i].getField(4).getValue(),
                        runstatus: tuples[i].getField(5).getValue(),
                        runname: tuples[i].getField(6).getValue(),
                        rundescription: tuples[i].getField(7).getValue()
                    };
                    runs.push(run);
                }
            }
            callback(runs);
        });
    },

    getOwnedSaves: function (user, callback) {

        if (defaultSpace == null) {
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {});
        }

        //SAVE TUPLE
        var template = new TS.Tuple([
            TS.fString,   // saveid
            3,                  // flag for save tuple
            TS.fString,         //
            TS.fString, // description
            TS.fString, // wiring
            user, // user name
            TS.fString,   // sharing info
            TS.fString  // save date
        ]);
        var results = [];
        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    var id = tuples[i].getField(0).getValue();
                    results.push(id);
                }
            }
            callback(results);
        });
    },

    getAllSaves: function (callback) {
        if (defaultSpace == null) {
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {});
        }

        //SAVE TUPLE
        var template = new TS.Tuple([
            TS.fString,   // saveid
            3,                  // flag for save tuple
            TS.fString,         // workflow name
            TS.fString, // description
            TS.fString, // wiring
            TS.fString, // user name
            TS.fString,   // sharing info
            TS.fString  // save date
        ]);
        var results = [];
        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    // todo: username!
                    var workflowjson = {
                        saveid : tuples[i].getField(0).getValue(),
                        flag : tuples[i].getField(1).getValue(),
                        name : tuples[i].getField(2).getValue(),
                        desctiption : tuples[i].getField(3).getValue(),
                        wiring : tuples[i].getField(4).getValue(),
                        creator : tuples[i].getField(5).getValue(),
                        sharing : tuples[i].getField(6).getValue(),
                        date : tuples[i].getField(7).getValue()
                    };
                    results.push(workflowjson);
                }
            }
            callback(results);
        });
    },

    deleteRunById: function (runid, user, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });
        //RUN TUPLE
        var template = new TS.Tuple([
            runid,  // id of the run we want to rename
            7,          // flag for run tuple
            TS.fString, // save-id
            user,       // user
            TS.fString, // date string
            3,          // flag for successfully done
            TS.fString, // run name
            TS.fString  // run description
        ]);
        //RUN-GROUP TUPLE
        var template2 = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 31),
            TS.createActualField('string', runid),
            TS.createFormalField('string')
        ]);
        //RESULT TUPLE
        var template3 = new TS.Tuple([
            TS.createActualField('string', runid),
            TS.createActualField('integer', 8),
            TS.createFormalField('string'),
            TS.createFormalField('string'),//location
            TS.createFormalField('string'),
            TS.createFormalField('string')
        ]);

        //delete run tuple
        defaultSpace.deleteAll(template, function () {
            //delete run-group tuples
            defaultSpace.deleteAll(template2, function () {
                //delete results
                defaultSpace.deleteAll(template3, function (tuples) {
                    callback();
                });
            });
        });
    },

    internalDeleteRunById: function (runid, callback) {
        // TODO implement this
    },

    deleteSaveById: function (runid, user, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        //SAVE TUPLE
        var template = new TS.Tuple([
            runid,   // saveid
            3,                  // flag for save tuple
            TS.fString,         //
            TS.fString, // description
            TS.fString, // wiring
            user, // user name
            TS.fString,   // sharing info
            TS.fString  // save date
        ]);
        //SAVE-GROUP TUPLE
        var template2 = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 30),
            TS.createActualField('string', runid),
            TS.createFormalField('string')
        ]);
        //RUN TUPLE
        var template3 = new TS.Tuple([
            TS.fString,  // id of the run we want to rename
            7,          // flag for run tuple
            runid, // save-id
            user,       // user
            TS.fString, // date string
            3,          // flag for successfully done
            TS.fString, // run name
            TS.fString  // run description
        ]);
        //delete SaveTuples
        defaultSpace.deleteAll(template, function () {
            //delete save-groups tuples
            defaultSpace.deleteAll(template2, function () {
                //get corresponding runs
                defaultSpace.readAll(template3, function (tuples) {
                    var results = [];
                    if (tuples) {
                        for (var i = 0; i < tuples.length; i++) {
                            var runid = tuples[i].getField(0).getValue();
                            results.push(runid);
                        }
                    }
                    callback(results);
                });
            });
        });

    },

    internalDeleteSaveById: function (runid, callback) {
        // TODO implement this
    },

    getResultInfo: function (runid, saveid, user, rundate, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        // template for the result tuples
        var resultTemplate = new TS.Tuple([
            runid,   // id of the run of which we want results
            8,                  // flag for result tuple
            TS.fString,         // instance id
            TS.fString,         // result link
            TS.fString,         // result name
            TS.fString          // result description
        ]);

        // template for the workflow save tuple
        var workflowTemplate = new TS.Tuple([
            saveid,  // id of the saved workflow belonging to the results
            3,                  // flag for save tuples
            TS.fString,         // shortname of the saved wf
            TS.fString,         // long description of the saved wf
            TS.fString,         // wiring
            TS.fString,         // user who saved the wf
            TS.fString,         // sharing info ("public" or "user")
            TS.fString          // save date
        ]);

        // template for the run tuplee
        var runTemplate = new TS.Tuple([
            runid,   // id of the run connected which produced the results
            7,                  // flag for run tuples
            saveid,  // id of the executed workflow
            user,               // user who executed the run
            TS.fString,         // run date
            3,                  // run was successful
            TS.fString,         // run name
            TS.fString          // run description
        ]);

        // variable for the data to transfer
        var resultinfo = {
            runid: runid,
            saveid: saveid,
            user: user,
            rundate: rundate
        };

        // read the saved workflow
        defaultSpace.read(runTemplate, function (runTuple) {
            if (runTuple) {
                resultinfo.runname = runTuple.getField(6).getValue();
                resultinfo.rundescription = runTuple.getField(7).getValue();
            }
            defaultSpace.read(workflowTemplate, function (wfTuple) {
                if (wfTuple) {
                    // FIXME should be run info, not wf info!
                    resultinfo.wfname = wfTuple.getField(2).getValue();
                    resultinfo.wfdescription = wfTuple.getField(3).getValue();
                    resultinfo.wfwiring = wfTuple.getField(4).getValue();
                    resultinfo.wfdate = wfTuple.getField(7).getValue();
                }
                defaultSpace.readAll(resultTemplate, function (tuples) {
                    var resultlinks = [];
                    if (tuples) {
                        for (var i = 0; i < tuples.length; i++) {
                            resultlinks.push(tuples[i].getField(3).getValue());
                        }
                    }
                    resultinfo.resultlinks = resultlinks;
                    callback(resultinfo);
                });
            });
        });
    },

    getOwnedRuns: function (user, callback) {
        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        //RUN TUPLE
        var template = new TS.Tuple([
            TS.fString,  // id of the run we want to rename
            7,          // flag for run tuple
            TS.fString, // save-id
            user,       // user
            TS.fString, // date string
            3,          // flag for successfully done
            TS.fString, // run name
            TS.fString  // run description
        ]);
        var results = [];
        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    var id = tuples[i].getField(0).getValue();
                    results.push(id);
                }
            }
            callback(results);
        });
    },

    getRunNamesForSave: function (user, saveId, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        //RUN TUPLE
        var template = new TS.Tuple([
            TS.fString,  // id of the run we want to rename
            7,          // flag for run tuple
            saveId, // save-id
            user,       // user
            TS.fString, // date string
            3,          // flag for successfully done
            TS.fString, // run name
            TS.fString  // run description
        ]);
        var results = [];
        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    var name = tuples[i].getField(6).getValue();
                    results.push(name);
                }
            }
            callback(results);
        });

    },

    removeRunGroup: function (params, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var template = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 31),
            TS.createActualField('string', params.id),
            TS.createFormalField('string')
        ]);


        defaultSpace.deleteAll(template, function () {
            if (params.ifPublic) {
                //Change groups
                var groups = [];
                if (params.groups) {

                    groups = params.groups;
                    //create new save->grp tuples
                    for (var i = 0; i < groups.length; i++) {
                        var id = uuid.v4();
                        var templateNew = new TS.Tuple([
                            TS.createActualField('string', id),
                            TS.createActualField('integer', 31),
                            TS.createActualField('string', params.id),
                            TS.createActualField('string', groups[i])
                        ]);
                        defaultSpace.write(templateNew, function () {
                        });
                    }
                }
            }
            callback();
        });
    },

    updateRunWithNewName: function (params, name, description, id, user, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });


        // old Tuple
        var resultTemplate = new TS.Tuple([
            params.id,  // id of the run we want to rename
            7,          // flag for run tuple
            TS.fString, // save-id
            user,       // user
            TS.fString, // date string
            3,          // flag for successfully done
            TS.fString, // run name
            TS.fString  // run description
        ]);


        // find tuple
        defaultSpace.take(resultTemplate, function (tuple) {
            var response = {
                "name": name,
                "description": description,
                "id": id
            };
            //found
            if (tuple) {
                // build new tuple
                var newRunTuple = new TS.Tuple([
                    params.id,                      // id of the run
                    7,                              // flag for run tuple
                    tuple.getField(2).getValue(),   // old save id
                    user,                           // user who has executed the run
                    tuple.getField(4).getValue(),   // old execution date
                    3,                              // flag for successfully done
                    name,                           // new name to be set
                    description                     // new description to be set
                ]);
                // write new tuple
                defaultSpace.write(newRunTuple, function () {
                });
                // show in the response the description was modified
                callback(true);
            } else {
                // show in the response the description was not modified
                callback(false);
            }
        });


    },

    getGroupsForRun: function (runid, callback) {
        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var groups = [];
        var template = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 31),
            TS.createActualField('string', runId),
            TS.createFormalField('string')
        ]);

        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    groups.push(tuples[i].getField(3).getValue());
                }
                callback(groups);
            }
            else {
                callback(groups)
            }

        });
    },

    // user stuff


    checkIfUserExists: function (username, email, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var userNameTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 21), TS.createActualField('string', username), TS.createFormalField('string'), TS.createFormalField('string')]);
        userSpace.read(userNameTemplate, function (tuple) {
            if (!tuple) {
                var userMailTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createActualField('string', email)]);
                userSpace.read(userMailTemplate, function (tuple) {
                    if (!tuple)
                        callback(null);
                    else
                        callback('email');
                });

            } else {
                callback('name');
            }
        });
    },

    getBasicUserDetails: function (userId, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });
        var userTemplate = new TS.Tuple([TS.createActualField('string', userId), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createFormalField('string')]);
        userSpace.read(userTemplate, function (tuple) {
            if (tuple != null) {
                var userName = tuple.getField(2).getValue();
                var userEmail = tuple.getField(4).getValue();
            }
            callback(userName, userEmail);
        });
    },

    removeUser: function (userId, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });
        var userTemplate = new TS.Tuple([TS.createActualField('string', userId), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createFormalField('string')]);
        var userRoleLinkTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 25), TS.createActualField('string', userId), TS.createFormalField('string')]);
        var userGroupLinkTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 23), TS.createActualField('string', userId), TS.createFormalField('string')]);
        userSpace.deleteAll(userTemplate, function () {
            userSpace.deleteAll(userRoleLinkTemplate, function () {
                userSpace.deleteAll(userGroupLinkTemplate, function () {
                    callback(true);
                });
            });
        });
    },

    removeGroup: function (groupId, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });
        var groupTemplate = new TS.Tuple([TS.createActualField('string', groupId), TS.createActualField('integer', 22), TS.createFormalField('string')]);
        var groupLinkTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 23), TS.createFormalField('string'), TS.createActualField('string', groupId)]);
        userSpace.deleteAll(groupLinkTemplate, function () {
            userSpace.deleteAll(groupTemplate, function () {
                callback();
            });
        });
    },

    getSaveGroups: function (saveid, callback) {
        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        var grps = [];

        var template = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 30),
            TS.createActualField('string', saveId),
            TS.createFormalField('string')
        ]);

        defaultSpace.readAll(template, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    grps.push(tuples[i].getField(0).getValue(3));
                }
                callback(grps);
            }
        });
    },

    getUserGroups: function (user, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var grps = [];

        var userGrpLinkTemplate = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 23),
            TS.createFormalField('string'),
            TS.createActualField('string', user)
        ]);


        userSpace.readAll(userGrpLinkTemplate, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    grps.push(tuples[i].getField(2).getValue());
                }
            }
            callback(grps);
        });
    },

    removeGroupVisibility: function (userId, params, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        //delete old group visibility
        var template = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 30),
            TS.createActualField('string', params.id),
            TS.createFormalField('string')
        ]);

        defaultSpace.deleteAll(template, function () {
            if (params.ifPublic) {
                //Change groups
                var groups = [];
                if (params.groups) {

                    groups = params.groups;

                    //create new save->grp tuples
                    for (var i = 0; i < groups.length; i++) {
                        var id = uuid.v4();
                        var templateNew = new TS.Tuple([
                            TS.createActualField('string', id),
                            TS.createActualField('integer', 30),
                            TS.createActualField('string', params.id),
                            TS.createActualField('string', groups[i])
                        ]);
                        defaultSpace.write(templateNew, function () {
                        });
                    }
                }
            }
            callback();
        });
    },

    updateRename: function (userId, params, range, callback) {

        if (defaultSpace == null)
            defaultSpace = new TS.TupleSpace(connectionDefaultSpace, function () {
            });

        // old Tuple
        var oldTupleTemplate = new TS.Tuple([
            params.id,   // saveid
            3,                  // flag for save tuple
            TS.fString,         //
            TS.fString, // description
            TS.fString, // wiring
            userId, // user name
            TS.fString,   // sharing info
            TS.fString  // save date
        ]);


        // find tuple
        defaultSpace.read(oldTupleTemplate, function (tuple) {
            //found
            if (tuple) {
                // new Tuple
                var newTupleTemplate = new TS.Tuple([
                    params.id,   // saveid
                    3,                  // flag for save tuple
                    params.name,         //
                    params.description, // description
                    tuple.getField(4).getValue(), // wiring
//	                         user, // user name
                    userId, //TODO check if correct
                    range,   // sharing info
                    tuple.getField(7).getValue() // save date
                ]);
                // delete old Tuple
                defaultSpace.delete(oldTupleTemplate, function () {
                });
                // create new one
                defaultSpace.write(newTupleTemplate, function () {
                });

                var response = {};
                response.ok = true;
                response.name = params.name;
                response.description = params.description;
                response.id = params.id;
                response.date = tuple.getField(7).getValue();
                callback(response);
            }
            if (!tuple) {
                var response = {};
                response.ok = false;
                response.name = params.name;
                response.description = params.description;
                response.id = params.id;
                callback(response);
            }
        });


    },

    getUserRoles: function (user, callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var roles = [];

        var userRoleLinkTemplate = new TS.Tuple([
            TS.createFormalField('string'),
            TS.createActualField('integer', 25),
            TS.createActualField('string', user),
            TS.createFormalField('string')
        ]);

        userSpace.readAll(userRoleLinkTemplate, function (tuples) {
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    roles.push(tuples[i].getField(0).getValue(3));
                }
                callback(roles);
            }
        });
    },

    checkAdmin: function (userid, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var userRolesTemplate = new TS.Tuple([
            TS.fString,
            25,
            userid,
            "0"
        ]);

        userSpace.readAll(userRolesTemplate, function (userRolesLinkTuples) {
            if (userRolesLinkTuples) {
                callback(true);
            } else {
                callback(false);
            }
        });
    },

    getFullUser: function (userid, callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var userTemplate = new TS.Tuple([TS.createActualField('string', userid), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createFormalField('string')]);
        userSpace.read(userTemplate, function (tuple) {
            if (tuple)
                callback(tuple.getField(2).getValue(), tuple.getField(4).getValue());
        });
    },

    updateUser: function (userid, username, password, email, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var temp = new TS.Tuple([TS.createActualField('string', userid), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createFormalField('string')]);

        userSpace.read(temp, function (res) {
            var userTuple = new TS.Tuple([TS.createActualField('string', userid), TS.createActualField('integer', 21), TS.createActualField('string', username), TS.createActualField('string', password), TS.createActualField('string', email)]);
            userSpace.update(res.getTupleID(), userTuple, function (cbTuple1) {
                callback()
            });
        });


    },

    checkIfEmailExists: function (email, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });
        var mailTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createActualField('string', email)]);
        userSpace.read(mailTemplate, function (mailTuple) {
            if (mailTuple)
                callback(true);
            else
                callback(false);
        });
    },

    getAllUsers: function (callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var usertemplate = new TS.Tuple([TS.fString, 21, TS.fString, TS.fString, TS.fString]);
        userSpace.readAll(usertemplate, function (tuples) {
            var users = {};
            if (tuples) {
                for (var i = 0; i < tuples.length; i++) {
                    users[tuples[i].getField(0).getValue()] = tuples[i].getField(2).getValue();
                }
                callback(users);
            } else {
                callback(null);
            }
        });
    },

    getAllGroups: function (callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var grouptemplate = new TS.Tuple([TS.fString, 22, TS.fString]);
        var groups = {};
        userSpace.readAll(grouptemplate, function (tuples) {
            for (var i = 0; i < tuples.length; i++) {
                groups[tuples[i].getField(0).getValue()] = tuples[i].getField(2).getValue();
            }

            callback(groups);


        });
    },

    getGroupNames: function (ids, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });
        var names = [];

        var max = ids.length;
        var counter = 0;

        for (var i = 0; i < max; i++) {

            var template = new TS.Tuple([
                TS.createActualField('string', ids[i]),
                TS.createActualField('integer', 22),
                TS.createFormalField('string')
            ]);

            userSpace.read(template, function (tuple) {
                if (tuple) {
                    names.push(tuple.getField(2).getValue());
                }
                counter++;
                if (counter >= max) {
                    callback(names);
                }
            });

        }
    },

    getAllRoles: function (callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var roleTemplate = new TS.Tuple([TS.fString, 24, TS.fString]);
        var roles = {};
        userSpace.readAll(roleTemplate, function (tuples) {
            for (var i = 0; i < tuples.length; i++) {
                roles[tuples[i].getField(0).getValue()] = tuples[i].getField(2).getValue();
            }

            callback(roles);

        });
    },

    getFullUserDetails: function (userid, callback) {
        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var userDetails = {};

        var getRoles = function () {
            var userRolesTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 25), TS.createActualField('string', userid), TS.createFormalField('string')]);
            userSpace.readAll(userRolesTemplate, function (userRolesLinkTuples) {
                if (userRolesLinkTuples) {
                    var rolesTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 24), TS.createFormalField('string')]);
                    userSpace.readAll(rolesTemplate, function (rolesTuples) {
                        if (rolesTuples) {
                            var userRoles = {};
                            for (var i = 0; i < userRolesLinkTuples.length; i++) {
                                for (var j = 0; j < rolesTuples.length; j++) {
                                    if (rolesTuples[j].getField(0).getValue() == userRolesLinkTuples[i].getField(3).getValue()) {
                                        userRoles[rolesTuples[j].getField(0).getValue()] = rolesTuples[j].getField(2).getValue();
                                        break;
                                    }
                                }
                            }
                            userDetails['userRoles'] = userRoles;
                            callback(userDetails);
                        }
                    });

                }
                else {
                    callback(userDetails);
                }
            });
        };

        var roleTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 24), TS.createFormalField('string')]);
        var userTemplate = new TS.Tuple([TS.createActualField('string', userid), TS.createActualField('integer', 21), TS.createFormalField('string'), TS.createFormalField('string'), TS.createFormalField('string')]);
        userSpace.read(userTemplate, function (tuple) {
            userDetails['userId'] = userid;
            userDetails['userName'] = tuple.getField(2).getValue();
            userDetails['userEmail'] = tuple.getField(4).getValue();
            var userGroupsTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 23), TS.createActualField('string', userid), TS.createFormalField('string')]);
            userSpace.readAll(userGroupsTemplate, function (userGroupsLinkTuples) {
                if (userGroupsLinkTuples) {
                    var groupsTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 22), TS.createFormalField('string')]);
                    userSpace.readAll(groupsTemplate, function (groupsTuples) {
                        if (groupsTuples) {
                            var userGroups = {};
                            for (var i = 0; i < userGroupsLinkTuples.length; i++) {
                                for (var j = 0; j < groupsTuples.length; j++) {
                                    if (groupsTuples[j].getField(0).getValue() == userGroupsLinkTuples[i].getField(3).getValue()) {
                                        userGroups[groupsTuples[j].getField(0).getValue()] = groupsTuples[j].getField(2).getValue();
                                        break;
                                    }
                                }
                            }
                            userDetails['userGroups'] = userGroups;
                            //callback(userDetails);
                            getRoles();
                        }
                    });

                }
                else {
//                                callback(userDetails);
                    getRoles();
                }
            });
        });
    },

    // user details save

    saveUserDetails: function (userid, groups, roles, callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var setRoles = function () {
            var rolesLinkTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 25), TS.createActualField('string', userid), TS.createFormalField('string')]);
            userSpace.readAll(rolesLinkTemplate, function (rolesLinkTuples) {
                if (rolesLinkTuples) {
                    async.forEachSeries(rolesLinkTuples, function (rolesLink, callbackOuter) {
                        var del = true;
                        async.forEachSeries(roles, function (roleId, callback) {
                            var exists = false;
                            if (rolesLink.getField(3).getValue() == roleId) {
                                del = false;
                            }
                            for (var i = 0; i < rolesLinkTuples.length; i++) {
                                if (roleId == rolesLinkTuples[i].getField(3).getValue()) {
                                    exists = true;
                                }
                            }
                            if (!exists) {
                                newRolesLinkTuple = new TS.Tuple([TS.createActualField('string', uuid.v4()), TS.createActualField('integer', 25), TS.createActualField('string', userid), TS.createActualField('string', roleId)]);
                                userSpace.write(newRolesLinkTuple, function () {
                                    callback();
                                });
                            }
                            else {
                                callback();
                            }


                        }, function (err) {
                            if (del) {
                                var newRolesLinkTuple = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 25), TS.createActualField('string', userid), TS.createActualField('string', rolesLink.getField(3).getValue())]);
                                userSpace.delete(newRolesLinkTuple, function (tuple) {
                                    callbackOuter();

                                });
                            }
                            else {
                                callbackOuter();

                            }
                        });
                    }, function (err) {
                        callback(true);
                    });
                }
                //TODO modify whole function
                else {
                    async.forEachSeries(groups, function (roleId, callback) {

                        var newRolesLinkTuple = new TS.Tuple([TS.createActualField('string', uuid.v4()), TS.createActualField('integer', 25), TS.createActualField('string', userid), TS.createActualField('string', roleId)]);
                        userSpace.write(newRolesLinkTuple, function () {
                            callback();

                        });
                    }, function (err) {
                    });
                }

            });
        };


        var roleLinkTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 25), TS.createActualField('string', userid), TS.createFormalField('string')]);
        userSpace.read(roleLinkTemplate, function (roleLinkTuples) {
//            if (roleLinkTuple) {
//                if (roleLinkTuple.getField(3) != data.role) {
//                    var rlUpdateTuple = new TS.Tuple([TS.createActualField('string', roleLinkTuple.getField(0).getValue()), TS.createActualField('integer', 25), TS.createActualField('string', data.userId), TS.createActualField('string', data.role)]);
//                    userSpace.update(roleLinkTuple.getTupleID(), rlUpdateTuple, function (tuple) {

            var groupLinkTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 23), TS.createActualField('string', userid), TS.createFormalField('string')]);
            userSpace.readAll(groupLinkTemplate, function (groupLinkTuples) {
                if (groups.length == 0) {
                    var groupLinkT = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 23), TS.createActualField('string', userid), TS.createFormalField('string')]);
                    userSpace.deleteAll(groupLinkT, function (tuples) {
                        // callback(true);
                        setRoles();
                    });
                }
                else {
                    if (groupLinkTuples) {
                        async.forEachSeries(groupLinkTuples, function (groupLink, callbackOuter) {
                            var del = true;
                            async.forEachSeries(groups, function (groupId, callback) {
                                var exists = false;
                                if (groupLink.getField(3).getValue() == groupId) {
                                    del = false;
                                }
                                for (var i = 0; i < groupLinkTuples.length; i++) {
                                    if (groupId == groupLinkTuples[i].getField(3).getValue()) {
                                        exists = true;
                                    }
                                }
                                if (!exists) {
                                    newGroupLinkTuple = new TS.Tuple([TS.createActualField('string', uuid.v4()), TS.createActualField('integer', 23), TS.createActualField('string', userid), TS.createActualField('string', groupId)]);
                                    userSpace.write(newGroupLinkTuple, function () {
                                        callback();
                                    });
                                }
                                else {
                                    callback();
                                }


                            }, function (err) {
                                if (del) {
                                    var newGroupLinkTuple = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 23), TS.createActualField('string', userid), TS.createActualField('string', groupLink.getField(3).getValue())]);
                                    userSpace.delete(newGroupLinkTuple, function (tuple) {
                                        callbackOuter();

                                    });
                                }
                                else {
                                    callbackOuter();

                                }
                            });
                        }, function (err) {
//                                        callback(true);
                            setRoles();
                        });
                    }
                    //TODO modify whole function
                    else {
                        async.forEachSeries(groups, function (groupId, callback) {

                            var newGroupLinkTuple = new TS.Tuple([TS.createActualField('string', uuid.v4()), TS.createActualField('integer', 23), TS.createActualField('string', userid), TS.createActualField('string', groupId)]);
                            userSpace.write(newGroupLinkTuple, function () {
                                callback();

                            });
                        }, function (err) {
                            callback(true);
                        });
                    }
                }

            });
        });


    },

    readGroupByName: function (groupname, callback) {

        if (userSpace == null)
            userSpace = new TS.TupleSpace(connectionUserSpace, function () {
            });

        var groupTemplate = new TS.Tuple([TS.createFormalField('string'), TS.createActualField('integer', 22), TS.createActualField('string', groupname)]);
        userSpace.read(groupTemplate, function (tuple) {
            if (!tuple)
                callback([])
            else
                callback(tuple);
        });


    }

};