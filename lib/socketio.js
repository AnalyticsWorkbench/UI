var config = require('../config.js');
var util = require('./util.js');
var uuid = require('node-uuid');
var async = require('async');
var fs = require('fs');
var fsextra = require('fs-extra');
var path = require('path');
var crypto = require('crypto');



var messageConnection;
var dataConnection;
var workbenchConnection;

var userSpace;
var defaultSpace;


//Add by Yassin
var pavs = require('./postgresAvailableScriptsConnection.js');


sf = {

    callbacks: {},

    monitorIDs: {},

    monitorRunIds: {},

    onconnect: function (socket) {
        // TODO reload of node server destroys UI of connected clients

        // if we don't have a user, this an authorized request, so we ignore it
        // TODO: This has to be explained more explicitly! Otherwise it is very difficult to understand. (15.11.2016 TH)
        var userObj = socket.client.request.user;
        if (!userObj) {
            return;
        } else {

            var userId = userObj.id;
            socket.join(userId);

            var clientUser = {};
            clientUser.username = userObj.name;
            clientUser.email = userObj.mail;
            clientUser.id = userObj.id;
        }

        socket.emit('user', {user: clientUser});

        socket.on('request', function (req) {

            // if the sender is not logged in, we do not react
            if (userObj && userObj.logged_in) {

                //check if the connection to ts exists and create one if not
                initConnection();

                var self = this;

                if (sf[req.command]) {
                    var executeCommand = function () {
                        if (req.data) {
                            if (req.notification) {
                                sf[req.command].call(self, userId, req.data, socket, function (resData) {
                                    socket.emit('response', {reqid: req.id, data: resData});
                                });
                            } else {
                                sf[req.command].call(self, userId, req.data, function (resData) {
                                    if (resData != null && resData.customResponse != null) {
                                        socket.emit(resData.customResponse, {data: resData});
                                    }
                                    else {
                                        socket.emit('response', {reqid: req.id, data: resData});
                                    }
                                });
                            }
                        } else {
                            sf[req.command].call(self, userId, function (resData) {
                                //handle later
                                if (resData != null && resData.customResponse != null) {
                                    socket.emit(resData.customResponse, {reqid: req.id, data: resData});
                                }
                                else {
                                    socket.emit('response', {reqid: req.id, data: resData});
                                }

                            });
                        }
                    };
                    if (req.command.indexOf("admin") == -1) {
                        executeCommand();
                    }
                    else {
                        checkAdmin(userId, function (isAdmin) {
                            if (isAdmin) {
                                executeCommand();
                            }
                        });
                    }
                }
            }
        });
    },

    wfm_exe: function (user, data, callback) {
        var cb = callback;
        var self = this;
        if (wfm) {
            wfm.exe(data.cmd, data.params, function (result) {
                cb.call(self, result); //call outer callback as callback :)
            });
        } else {
            callback();
        }
    },

    if_wfm: function (user, callback) {
        if (wfm) {
            callback(true);
        } else {
            callback(false);
        }
    },


/*******************************************************************************************************************/
//add by popo

    /**
     * rewrite the RWrapper filter so that custom R-scripts could show in the RWrapper drop list
     *         modified function
     * @param user
     *         user-id
     * @param callback
     *         callback function
     */
    getFilterDescriptions: function (user, callback) {

        var self = this;

        var filters = [];
        //check if find out the component of RWrapper
        var RWrapper = false;
        //filter of RWrapper
        var RWrapperfilter = null;

        if (config.messageConnection == 'mqtt') {
            async.series([
                    function (callback) {
                        messageConnection.registerForNotification('descriptionCreate', 'agentdescribe', function (topic, msg) {
                            if (topic === 'AGENTDESCRIPTION/NEW') {
                            	filter = JSON.parse(msg.AgentDescription);
                                filters.push(filter);

                            }
                        });
                        callback(null, 'registration');
                    },
                    function (callback) {
                        messageConnection.write('agentbroadcast', {'broadcast': 'true'}, function () {
                            // wait 10 seconds
                            callback(null, 'broadcast');

                        });
                    }
                ],
                // optional callback
                function (err, results) {
                    if (err) throw err;
                    setTimeout(function () {
                        messageConnection.unregister('descriptionCreate', 'agentdescribe', function () {
                            callback.call(self, filters);
                        })
                    }, 4000);
                });
        } else if (config.messageConnection === 'postgresql') {
            messageConnection.read(function (result) {
                if (result.rows.length > 0) {
                    for (var i = 0; i < result.rows.length; i++){
                    	filter = result.rows[i].agentjson
                        filters.push(filter);
                        if(!RWrapper)
                        {
                            //find RWrapper
                            if(filter.name == "R-Analysis")
                            {
                                RWrapperfilter = filter;
                                RWrapper = true;
                            }
                        }
                    }
                }
                if(RWrapper)
                {
                    //read all available R-scripts by user-id
                    pavs.getAvailableScripts(user,function(results) {
                        if(results)
                        {
                            //since there is only a drop list in RWrapper, that is container.fields[0]
                            //attribute of selectOptions is for representation
                            //attribute of selectValues is for data values
                            RWrapperfilter.container.fields[0].selectOptions = [];
                            var selectValues = RWrapperfilter.container.fields[0].selectValues;

                            //number of default R-scripts
                            var oldlength = selectValues.length;

                            //rewirte default R-scripts
                            for (var j = 0; j < oldlength; j = j + 1) {
                                RWrapperfilter.container.fields[0].selectOptions[j] = selectValues[j];
                            }

                            //rewirte custom R-scripts
                            for (var j = 0; j < results.length; j = j + 1) {
                                selectValues[j+oldlength] = JSON.stringify(results[j]);
                                RWrapperfilter.container.fields[0].selectOptions[j+oldlength] = results[j].name + " - " + results[j].filename + " [" + results[j].creator + "]";
                            }
                        }
                        callback.call(self, filters);
                    });
                }
                else
                    callback.call(self, filters);

            });
        }
    },

//End of Adding
/********************************************************************************/

    saveWiring: function (user, parameters, callback) {

        var self = this;

        var grps;
        var sharing = parameters['sharing'];
        var id = uuid.v4();

        if (sharing == "public") {
            grps = parameters['groups'];
            for (var i = 0; i < grps.length; i++) {
                var SaveGrpLinkTemplate = {
                    uid: id,
                    flag: 30,
                    saveid: parameters['saveid'],
                    groupid: grps[i]
                };
                workbenchConnection.write('workflowgroup', SaveGrpLinkTemplate, function () {
                });
            }
        }

        var wiring = {
            saveid: parameters['saveid'],
            flag: parameters['flag'],
            name: parameters['shortname'],
            description: parameters['description'],
            wiring: parameters['wiring'],
            creator: user,
            sharing: parameters['sharing'],
            date: parameters['date']
        };

        workbenchConnection.write('wiring', wiring, function () {
            // tell the editor that saving was successful
            callback.call(self, {saveid: parameters['saveid']});
        });
    },

    getLoadableWirings: function (user, callback) {

        var self = this;

        workbenchConnection.readAllWirings(true, user, function (res) {
            var results = [];

            if (res.length > 0) {
                results = res;

                //cut out the public elements which arent shared with the user

                trimPublicSetByVisibleUserShares(user, results, function (trimedResult) {
                    readOwnerOfWirings(trimedResult);
                });
            } else {
                readOwnerOfWirings(results);
            }

        });

        function readOwnerOfWirings(results) {

            workbenchConnection.readAllWirings(false, user, function (res) {

                if (res.length > 0) {
                    var autoSaves = [];

                    // we determine if it is an autosave or a user save

                    for (var i = 0; i < res.length; i++) {

                        if (res[i].name != "autosave")
                            results.push(res[i]);
                        else
                            autoSaves.push(res[i]);
                    }
                    results = results.concat(autoSaves);
                }
                callback.call(self, results);
            });
        }

    },

    getResults: function (user, parameters, callback) {

        var self = this;
        var results = [];

        if (parameters.runid) {
            workbenchConnection.readResults(parameters.runid, function (res) {
                if (res.length > 0) {
                    results = res;
                }
                callback.call(self, results);
            });
        } else {
            callback.call(self, results);
        }
    },

    getErrorResults: function (user, parameters, callback) {

        var self = this;

        workbenchConnection.readErrorResults(parameters.runid, function (res) {
            var results = [];
            if (res.length > 0)
                results = res;

            callback.call(self, results);
        });
    },

    handleDataUpload: function (user, parameters, callback) {
        var self = this;

        var fileset = JSON.parse(parameters.fileset);

        setTimeout(function() {async.eachSeries(fileset,

            function (file, cb) {
                var uid = uuid.v4();
                try {
                    dataConnection.storeData(uid, file, function () {
                        var filepath = uid + '.' + file.filetype;
                        delete file.filedata;
                        file.filedata = filepath;
                        cb();
                    });
                } catch (ex) {
                    console.log(ex);
                }
            },
            function (err) {
                if (err) throw err;

                parameters.fileset = fileset;

                var dataMessage = {
                    runid: parameters.runid,
                    pipeid: parameters.pipe,
                    payload: parameters.fileset,
                    '': ''
                };

                // callbacks :)

                messageConnection.write('data', dataMessage, function () {

                    // TODO find soloution for other uploads??

                    var commandMessage = {
                        runid: parameters.runid,
                        agentstate: 3,
                        instanceid: parameters.instanceid,
                        agentid: 'Direct Uploader'
                        //pipes: result.doc.pipes,
                    };

                    messageConnection.update(commandMessage, function () {
                        callback.call(self);
                    });
                });
            })}, 5000);
    },

    executeWiring: function (user, parameters, socket, callback) {
        var starttime = new Date().getTime();
        var self = this;
        var seqRun = uuid.v4();
        var seqCoordination = uuid.v4();
        var seqResult = uuid.v4();

        var runMessage = {
            runid: parameters.runid,
            flag: 7,
            saveid: parameters.saveid,
            userid: parameters.username,
            rundate: parameters.date,
            runstatus: 1,
            runname: 'run_' + parameters.runid,
            rundescription: ''
        };

        sf.monitorRunIds[parameters.runid] = {
            run: {
                type: 'run',
                runid: parameters.runid,
                wfid: parameters.saveid,
                status: 1,
                rundate: parameters.date,
                finished: false
            },
            tree: parameters.tree,
            removeNodeFromTree: function (id, cb) {
                for (var i = 0; i < this.tree.length; i++) {
                    if (this.tree[i].id == id) {
                        this.tree.splice(i, 1);
                        break;
                    }
                }
                cb();
            },
            getDirectSuccesorsById: function (id) {
                for (var i = 0; i < this.tree.length; i++) {
                    if (this.tree[i].id == id) {
                        return this.tree[i].successors;
                    }
                }
            },
            removeNodeWhileError: function (id, cb) {
                for (var i = 0; i < this.tree.length; i++) {
                    if (this.tree[i].id == id) {
                        var successors = this.tree[i].successors;
                        if (successors.length != 0) {
                            for (var j = 0; j < successors.length; j++) {
                                for (var k = 0; k < this.tree.length; k++) {
                                    if (this.tree[k].id == successors[j]) {
                                        this.tree.splice(k, 1);
                                        break;
                                    }
                                }
                            }
                        }
                        for (var l = 0; l < this.tree.length; l++) {

                            if (this.tree[l].id == id) {
                                this.tree.splice(l, 1);
                                break;
                            }
                        }
                        break;
                    }
                }
                cb();
            }
        };

        // build command tuples for the single filters/agents

        var commandMessages = [];
        for (var i = 0; i < parameters.filters.length; i++) {
            var commandMessage = {
                runid: parameters.runid,
                agentstate: 1,
                instanceid: parameters.filters[i].instanceid,
                agentid: parameters.filters[i].agentid,
                pipes: parameters.filters[i].pipes,
                parameters: parameters.filters[i].newvalues
            };
            commandMessages.push(commandMessage);
        }

        // write all tuples into the spaces, thus starting the analysis
        var startExecution = function () {

            console.log("start exeecution");
            // first run message
            messageConnection.write('run', runMessage, function () {
                console.log("run tuple written.");
                if (config.workbenchConnection == 'sqlspaces') {
                    workbenchConnection.write('run', runMessage, function () {
                    });
                } else if (config.workbenchConnection == 'postgresql' && config.messageConnection != 'postgresql') {

                    workbenchConnection.write('run', runMessage, function () {
                    });
                }
            });

            // all command messages
            for (var i = 0; i < commandMessages.length; i++) {
                messageConnection.write('command', commandMessages[i], function () {
                });
            }
            // notify that work is done
            callback.call(self);

        };

        var registerCallbacks = function () {

            messageConnection.registerForNotification('run', parameters.runid, function (topic, message) {
                var runId = message.runid;
                var wfId = message.workflowid;
                var wfUser = message.userid;
                var runDate = message.rundate;
                var runStatus = message.runstatus;
                sf.sendNotification(sf.monitorIDs[seqRun].runid, {
                    type: 'run',
                    runid: runId,
                    wfid: wfId,
                    status: runStatus,
                    rundate: runDate
                }, socket);
            });

            messageConnection.registerForNotification('command', parameters.runid, function (topic, message) {

                var runId = message.runid;
                var agentStatus = message.agentstate;
                var instanceId = message.instanceid;

                var agentId = message.agentid;

                sf.sendNotification(sf.monitorIDs[seqCoordination].runid, {
                    type: 'agent',
                    runid: runId,
                    agentid: agentId,
                    instanceid: instanceId,
                    status: agentStatus
                }, socket);

                if (agentStatus === 3) {
                    if (sf.monitorRunIds.hasOwnProperty(runId)) {
                        sf.monitorRunIds[runId].removeNodeFromTree(instanceId, function () {
                            if (sf.monitorRunIds[runId].tree.length == 0) {
                                var run = sf.monitorRunIds[runId].run;
                                run.status = 3;
                                messageConnection.unregister('', runId, function () {
                                    workbenchConnection.updateRun(runId, function () {
                                        delete sf.monitorRunIds[runId];
                                        sf.sendNotification(runId, run, socket);
                                    })
                                });
                            }
                        });
                    }
                } else if (agentStatus == 5) {
                    if (sf.monitorRunIds.hasOwnProperty(runId)) {

                        var succesors = sf.monitorRunIds[runId].getDirectSuccesorsById(instanceId);

                        sf.monitorRunIds[runId].removeNodeWhileError(instanceId, function () {
                            if (sf.monitorRunIds[runId].tree.length == 0) {
                                var run = sf.monitorRunIds[runId].run;
                                run.status = 5;
                                messageConnection.unregister('', runId, function () {
                                    workbenchConnection.updateRun(runId, function () {
                                        delete sf.monitorRunIds[runId];
                                        sf.sendNotification(runId, run, socket);
                                    })
                                });
                            }
                        });

                    }
                }
            });

            messageConnection.registerForNotification('result', parameters.runid, function (topic, message) {

                if (parameters.runid == message.runid) {
                    var result = {
                        runid: message.runid,
                        flag: 8,
                        instanceid: message.instanceid,
                        resultinfo: message.resultinfo,
                        resultname: message.resultname,
                        resultdescription: message.resultdescription
                    };
                    if (config.workbenchConnection == 'sqlspaces') {
                        workbenchConnection.write('result', result, function () {
                        });
                    } else if (config.workbenchConnection == 'postgresql' && config.messageConnection != 'postgresql') {
                        workbenchConnection.write('result', result, function () {
                        });
                    }
                }
            });

            messageConnection.registerForNotification('error', parameters.runid, function (topic, message) {

                if (parameters.runid == message.runid) {
                    var message = {
                        runid: message.runid,
                        flag: 5,
                        agentid: message.agentid,
                        instanceid: message.instanceid,
                        errormessage: message.errormessage
                    };
                    workbenchConnection.write('error', result, function () {
                    });
                }
            });

            sf.monitorIDs[seqRun] = {
                id: seqRun,
                runid: parameters.runid,
                workflowid: parameters.saveid,
                userid: parameters.username,
                rundate: parameters.date,
                type: 'run'
            };

            sf.monitorIDs[seqCoordination] = {
                id: seqCoordination,
                runid: parameters.runid,
                type: 'agent'
            };

            sf.monitorIDs[seqResult] = {
                id: seqResult,
                runid: parameters.runid,
                type: 'result'
            };


            startExecution();

        };
        registerCallbacks();
    },

    getLoadableResults: function (user, callback) {
        var self = this;

        var results = [];

        workbenchConnection.getFinishedRuns(function (runs) {
            if (runs.length) {
                filterRunMessagesByUserGroups(user, runs, function (filteredRuns) {
                    if (filteredRuns) {
                        results = filteredRuns;
                        callback.call(self, results);
                    } else {
                        callback.call(self, results);
                    }
                })
            } else {
                callback.call(self, results);
            }
        });
    }
    ,

    getResultInfo: function (user, resultdata, callback) {
        var self = this;

        workbenchConnection.getResultInfo(resultdata.runid, resultdata.saveid, user, resultdata.rundate, function (resultinfo) {

            if (resultinfo) {
                callback.call(self, resultinfo);
            } else {
                callback.call(self, []);
            }
        });
    }
    ,

    deleteRunTuple: function (user, params, callback) {

        var runId = params.runId;

        workbenchConnection.deleteRunById(runId, user, function () {
            //var path = "./results/" + runId;
            //try {
            //    fsextra.remove(path, function () {
            //    })
            //} catch (e) {
            //    var msg = "Error: could not delete directory: " + path;
            //    console.log(msg);
            //}
            deleteResults(runId, function(deleteId) {
                // do nothing here
            });
            callback({ok: true, runId: runId});

        });
    }
    ,

    deleteSaveTuple: function (user, params, callback) {

        var id = params.saveId;

        workbenchConnection.deleteSaveById(id, user, function (res) {
            if (res.length) {
                for (var i = 0; i < res.length; i++) {
                    var runId = res[i];
                    workbenchConnection.internalDeleteRunById(runId, function () {
                        console.log("dst: deleting " + runId);
                        deleteResults(runId, function(deleteId) {
                            // do nothing here
                        });
                    });
                }
            }
            // important: it is not safe to assume that anything has really been deleted yet!
            callback({ok: true, saveId: id});
        });
    }
    ,

    getOwnedSaves: function (user, callback) {

        workbenchConnection.getOwnedSaves(user, function (res) {

            var results = [];

            if (res.length > 0)
                results = res;

            callback(results);

        });
    }
    ,

    getRunNamesForSave: function (user, saveId, callback) {

        workbenchConnection.getRunNamesForSave(user, saveId, function (res) {
            var results = [];

            if (res.length > 0)
                results = res;

            callback(results);
        });

    }
    ,

    getOwnedRuns: function (user, callback) {
        workbenchConnection.getOwnedRuns(user, function (res) {
            var result = [];

            if (res.length > 0)
                result = res;

            callback(result);
        });
    }
    ,


    /**
     * sets a name / description for a result tuple
     * @param: user who executes the request
     * @param: params {Object}
     *                    params.id = the runid to identify the result tuple which is to change
     *                    params.name will be the results name
     *                    params.description will be the results description
     * @param: {Function} callback which transports response: here ok/false, name, description, id
     */
    renameRunTuple: function (user, params, callback) {

        var self = this;

        var description = "";
        if (params.description) {
            description = params.description;
        }
        var name = "";
        if (params.name) {
            name = params.name;
        }
        var id = params.id;

        var range = "user";
        if (params.ifPublic) {
            range = "public";
        }

        workbenchConnection.removeRunGroup(params, function () {
            // no op
        });

        workbenchConnection.updateRunWithNewName(params, name, description, id, user, function (result) {

            var response = {
                'name': name,
                'description': description,
                'id': id
            };

            if (result)
                response.ok = true;
            else
                response.ok = false;

            callback.call(self, response);
        });

    }
    ,

    renameAutosaveTuple: function (userId, params, callback) {

        var self = this;

        var description = "";

        var name = "";


        if (params.description)
            description = params.description;

        if (params.name)
            name = params.name;

        var range = "user";
        if (params.ifPublic) {
            range = "public";
        }

        workbenchConnection.removeGroupVisibility(userId, params, function () {
            // no op

        });

        workbenchConnection.updateRename(userId, params, range, function (response) {
            callback.call(self, response);
        });
    }
    ,

    sendNotification: function (id, response, socket) {
        socket.emit('notification', {id: id, data: response});
    }
    ,

    admin_getUsers: function (user, callback) {

        var self = this;

        workbenchConnection.getAllUsers(function (users) {
            var response = {};
            if (users != null) {
                response.customResponse = "admin_loadedInitData_users";
                response.ok = true;
                response.users = users;
                callback.call(self, response);
            } else {
                response.ok = false;
                response.users = users;
                console.log("get users: not ok");
                callback.call(self, response);
            }
        });
    }
    ,

    admin_getGroups: function (user, callback) {

        var self = this;

        workbenchConnection.getAllGroups(function (groups) {
            var response = {};
            if (groups != null) {
                response.ok = true;
                response.customResponse = "admin_loadedInitData_groups";
                response.groups = groups;
                callback.call(self, response);
            } else {
                response.ok = false;
                //why send this?
                response.groups = groups;
                console.log("get groups: not ok");
                callback.call(self, response);
            }
        });
    }
    ,

    admin_getRoles: function (user, callback) {

        var self = this;

        workbenchConnection.getAllRoles(function (roles) {
            var response = {};

            if (roles != null) {
                response.ok = true;
                response.customResponse = "admin_loadedInitData_roles";
                response.roles = roles;
                callback.call(self, response);
            } else {
                response.ok = false;
                //why send this?
                response.roles = [];
                callback.call(self, response);
            }
        });
    }
    ,

    admin_getUserInfo: function (user, data, callback) {

        var self = this;
        getFullUserDetails(data.userId, function (result) {
            var response = {};

            if (result) {
                response.ok = true;
                response.customResponse = "admin_userInfosLoaded";
                response.result = result;
                callback.call(self, response);
            }
            else {
                response.ok = false;
                response.userDetails = result;
                callback.call(self, response);
            }

        });

    }
    ,
    admin_getUserEmail: function (user, data, callback) {

        var self = this;

        getBasicUserDetails(data, function (result) {
            var response = {};

            console.log(result);

            if (result) {
                response.ok = true;
                response.customResponse = "admin_userBasicInfoLoaded";
                response.result = result;
                callback.call(self, response);
            }
            else {
                response.ok = false;
                response.userDetails = result;
                response.customResponse = "admin_userBasicInfoLoaded";
                callback.call(self, response);
            }

        });

    }
    ,

    admin_createUser: function (user, data, callback) {

        var self = this;
        createNewUser(data, function (result) {
            var response = {};

            if (result.success) {
                response.ok = true;
                response.customResponse = "admin_userCreated";
                response.result = result;
                callback.call(self, response);
            } else {
                response.ok = false;
                response.customResponse = "admin_userCreated";
                response.result = result;
                callback.call(self, response);
            }

        });
    }
    ,
    admin_modifyUser: function (user, data, callback) {

        var self = this;
        updateUserEmailAndPassword(data, function (result) {
            var response = {};

            if (result.success) {
                response.ok = true;
                response.customResponse = "admin_userModified";
                response.result = result;
                callback.call(self, response);
            } else {
                response.ok = false;
                response.customResponse = "admin_userModified";
                response.result = result;
                callback.call(self, response);
            }

        });
    }
    ,
    admin_createGroup: function (user, data, callback) {

        var self = this;
        createNewGroup(data, function (result) {
            var response = {};

            if (result) {
                response.ok = true;
                response.customResponse = "admin_groupCreated";
                response.result = result;
                callback.call(self, response);
            }
            else {
                response.ok = true;
                response.customResponse = "admin_groupCreated";
                response.result = result;
                callback.call(self, response);
            }

        });
    }
    ,
    admin_deleteUser: function (user, data, callback) {
        var self = this;
        deleteUser(data, function (result) {
            var response = {};

            if (result) {
                response.ok = true;
                response.customResponse = "admin_userDeleted";
                response.result = result;
                callback.call(self, response);
            }
            else {
                response.ok = false;
                response.customResponse = "admin_userDeleted";
                response.result = result;
                callback.call(self, response);
            }

        });
    }
    ,
    admin_deleteGroups: function (user, data, callback) {
        var self = this;
        deleteGroups(data, function (result) {

            var response = {};

            if (result) {
                response.ok = true;
                response.customResponse = "admin_groupsDeleted";
                response.result = result;
                callback.call(self, response);
            }
            else {
                response.ok = false;
                response.customResponse = "admin_groupsDeleted";
                response.result = result;
                callback.call(self, response);
            }

        });
    }
    ,
    admin_saveUserDetails: function (user, data, callback) {
        var self = this;
        saveUserDetails(data, function (result) {
            var response = {};

            if (result) {
                response.ok = true;
                response.customResponse = "admin_userDetailsSaved";
                response.result = result;
                callback.call(self, response);
            }
            else {
                response.ok = false;
                response.customResponse = "admin_userDetailsSaved";
                response.result = result;
                callback.call(self, response);
            }

        });
    }
    ,

    authAdmin: function (user, callback) {
        var self = this;
        checkAdmin(user, function (result) {
            callback.call(self, result);
        });
    },

    getUserRoles: function (user, callback) {

        workbenchConnection.getUserRoles(user, function (roles) {
            callback(roles);
        });
    }
    ,

    getUserGroups: function (user, callback) {
        workbenchConnection.getUserGroups(user, function (groups) {
            console.log('get user groups ' + JSON.stringify(groups));
            callback(groups);
        });
    }
    ,

    getSaveGroups: function (user, saveId, callback) {

        workbenchConnection.getSaveGroups(saveId, function (groups) {
            callback(groups);
        });
    }
    ,

    getGroupNames: function (user, ids, callback) {
        workbenchConnection.getGroupNames(ids, function (names) {
            callback(names);
        });
    }
    ,
    // can be removed?
    //getRoleNames: function (user, ids, callback) {
    //    var names = [];
    //
    //    var max = ids.length;
    //    var counter = 0;
    //
    //    for (var i = 0; i < max; i++) {
    //        var template = new TS.Tuple([
    //            TS.createActualField('string', ids[i]),
    //            TS.createActualField('integer', 24),
    //            TS.createFormalField('string')
    //        ]);
    //        userSpace.read(template, function (tuple) {
    //            if (tuple) {
    //                names.push(tuple.getField(2).getValue());
    //            }
    //            counter++;
    //            if (counter >= max) {
    //                callback(names);
    //            }
    //        });
    //    }
    //
    //}
    //,

    admin_getWorkflows: function (user, params, callback) {

        var workflows = [];
        var users = {};

        workbenchConnection.getAllSaves(function (saves) {
            if (saves) {
                handleWorkflows(saves, 0, function () {
                    callback(workflows);
                });
            } else {
                callback(workflows); // equals callback([]);
            }
        });

        function handleWorkflows(savedWorkflows, index, callback) {
            if (index >= savedWorkflows.length) {
                callback();
            } else {
                var savedWorkflow = savedWorkflows[index];
                index++;
                var user = savedWorkflow.creator;
                var username = user;
                var wf = {
                    id: savedWorkflow.saveid,
                    name: savedWorkflow.name,
                    description: savedWorkflow.description,
                    public: savedWorkflow.sharing,
                    date: savedWorkflow.date
                };
                if (users[user]) {
                    username = users[user];
                    wf['user'] = username;
                    filterWorkflow(wf, function () {
                        handleWorkflows(savedWorkflows, index, callback);
                    });
                } else {
                    workbenchConnection.getBasicUserDetails(user, function(username, usermail){
                        if (username) {
                            users[user] = username;
                        }
                        wf['user'] = username;
                        filterWorkflow(wf, function () {
                            handleWorkflows(savedWorkflows, index, callback);
                        });
                    });
                }
            }

            function filterWorkflow(wf, callback) {
                if (params.selection == "all") {
                    workflows.push(wf);
                } else if (params.selection == "explicit") {
                    if (wf.name != "autosave") {
                        workflows.push(wf);
                    }
                } else if (params.selection == "implicit") {
                    if (wf.name == "autosave") {
                        workflows.push(wf);
                    }
                }
                callback();
            }
        }
    }
    ,

    admin_deleteWorkflows: function (user, deleteIds, callback) {

        for (var k = 0; k < deleteIds.length; k++) {
            workbenchConnection.internalDeleteSaveById(deleteIds[k], function (deletedRuns) {
                var lastId = deletedRuns[(deletedRuns.length - 1)];
                for (var l = 0; l < deletedRuns.length; l++) {
                    var runId = deletedRuns[l];
                    workbenchConnection.internalDeleteRunById(runId, function(deletedRunId){
                        deleteResults(deletedRunId, function (deletedRId) {
                            if (deletedRId == lastId) {
                                // important: it is not safe to assume that at this point also all
                                // other saves have been deleted!
                                callback(deleteIds);
                            }
                        });
                    });
                }
            });
        }

    },

    getModuleRecommendations: function(user, workflowObject, callback) {

        // Dies sollte aus der Datenbank kommen.
        var recommendations =  [
            {
                filterId: "centrality",
                value: {value1: 'Betweenness'},
                config: {
                    position: [100, 100]
                }
            },
            {
                filterId: "centrality",
                value: {value1: 'Closeness'},
                config: {
                    position: [100, 100]
                }
            }
        ]

        callback.call(self, recommendations);
    }

}
;

var getFullUserDetails = function (userId, callback) {

    workbenchConnection.getFullUserDetails(userId, function (userDetails) {
        callback(userDetails);
    });

};

var getBasicUserDetails = function (userId, callback) {

    workbenchConnection.getBasicUserDetails(userId, function (userName, userEmail) {

        if (userName && userEmail)
            callback({userName: userName, userEmail: userEmail});
    });
};

var updateUserEmailAndPassword = function (data, callback) {

    workbenchConnection.getFullUser(data.userId, function (username, email) {
        if (email === data.userMail) {
            workbenchConnection.updateUser(data.userId, username, crypto.createHash('md5').update(data.userPassword).digest('hex'), data.userMail, function (res) {
                callback({
                    success: true,
                    error: null,
                    userid: data.userId,
                    username: username,
                    usermail: data.userMail
                });
            });
        } else {
            workbenchConnection.checkIfEmailExists(data.userMail, function (exits) {
                if (!exits) {
                    workbenchConnection.updateUser(data.userId, username, crypto.createHash('md5').update(data.userPassword).digest('hex'), data.userMail, function (res) {
                        callback({
                            success: true,
                            error: null,
                            userid: data.userId,
                            username: username,
                            usermail: data.userMail
                        });

                    });
                } else {
                    callback({success: false, error: "mail", userid: null, username: null, usermail: null});
                }
            })
        }
    });
};

var createNewUser = function (data, callback) {

    workbenchConnection.checkIfUserExists(data.userName, data.userEmail, function (err) {

        if (!err) {
            var userId = uuid.v4();
            var newUser = {
                userid: userId,
                flag: 21,
                username: data.userName,
                pw: crypto.createHash('md5').update(data.userPassword).digest('hex'),
                email: data.userMail
            };
            workbenchConnection.write('user', newUser, function () {
                var role = {
                    uid: uuid.v4(),
                    flag: 25,
                    userid: userId,
                    roleid: 1
                };
                workbenchConnection.write('role', role, function () {
                    callback({
                        success: true,
                        error: null,
                        userid: userId,
                        username: data.userName,
                        usermail: data.userMail
                    });
                });
            });
        } else {
            callback({success: false, error: err, userid: null, username: null, usermail: null});
        }

    });
};

var createNewGroup = function (data, callback) {

    workbenchConnection.readGroupByName(data.groupName, function (res) {
        if (res.length == 0) {
            var group = {
                groupid: uuid.v4(),
                flag: 22,
                groupname: data.groupName
            };

            workbenchConnection.write('group', group, function () {
                callback(true);
            });
        } else {
            callback(false);
        }

    });
};

var deleteUser = function (data, callback) {

    workbenchConnection.removeUser(data.userId, function () {
        callback(true);
    });
};

var deleteGroups = function (data, callback) {

    async.forEachSeries(data, function (groupId, callback) {

        workbenchConnection.removeGroup(groupId, function () {
            callback();
        });

    }, function (err) {
        callback(true);
    });

};

var saveUserDetails = function (data, callback) {

    workbenchConnection.saveUserDetails(data.userId, data.groups, data.roles, function (res) {
        callback(res);
    });


};

var commonValue = function (inArray1, inArray2) {
    if (inArray1 == null || inArray2 == null || inArray1 == undefined || inArray2 == undefined) {
        console.log("Array.commonValue: param = null or undefined");
        return false;
    }
    if (typeof(inArray1) != "object" || typeof(inArray2) != "object") {
        console.log("Array.commonValue(inArray): param should be an Array");
        return false;
    }

    for (var x = 0; x < inArray1.length; x++) {
        for (var j = 0; j < inArray2.length; j++) {
            if (inArray1[x] == inArray2[j]) {
                return true;
            }
        }
    }
    return false;
};

var trimPublicSetByVisibleUserShares = function (user, resultList, callback) {

    var results = [];
    var counter = 0;
    var max = resultList.length;

    var userGrps;

    //get usergroups
    sf.getUserGroups(user, function (g) {
        if (g) {
            userGrps = g;
            //check all tuples
            for (var i = 0; i < max; i++) {
                var saveId = resultList[i].workflowid;
                getGroupsForSave(resultList[i], saveId, function (t, grps) {
                    if (grps) {
                        if (commonValue(grps, userGrps)) {
                            results.push(t);
                        }
                    }
                    counter++;
                    if (counter >= max) {
                        callback(results);
                    }
                });
            }
        } else {
            callback(resultList);
        }
    });
};

var getGroupsForSave = function (param, saveId, callback) {

    var groups = [];

    workbenchConnection.getGroupsForSave(saveId, function (res) {
        if (res.length > 0) {
            groups = res;
            callback(param, groups);
        }
        else
            callback(param, groups);
    });
};

var getGroupsForRun = function (param, runId, callback) {

    workbenchConnection.getGroupsForRun(runId, function (groups) {
        callback(param, groups);
    });
};

var filterRunMessagesByUserGroups = function (user, runs, callback) {
    var results = [];
    var counter = 0;
    var max = runs.length;

    var userGrps;

    //get usergroups
    sf.getUserGroups(user, function (g) {
        if (g) {
            userGrps = g;
            //check all tuples
            for (var i = 0; i < max; i++) {
                var runId = runs[i].runid;
                //check if user is owner
                if (user == runs[i].userid) {
                    results.push(runs[i]);
                    checkIfReady();
                } else {
                    //check if user is in a group, which the run is visible for
                    getGroupsForRun(runs[i], runId, function (r, grps) {
                        if (grps) {
                            if (commonValue(grps, userGrps)) {
                                results.push(r);
                            }
                        }
                        checkIfReady();
                    });
                }
            }
        } else {
            callback(tuples);
        }
    });

    function checkIfReady() {
        counter++;
        if (counter >= max) {
            callback(results);
        }
    }
};

var checkAdmin = function (userId, callback) {

    workbenchConnection.checkAdmin(userId, function (res) {
        if (res)
            callback(true);
        else
            callback(false);
    });
};

var deleteResults = function (runId, callback) {
    var filepath = path.join(process.cwd(), 'results', runId);
    if (config.resultdir) {
        if (config.resultdir.match(/\S/)) {
            filepath = path.join(config.resultdir, runId);
        }
    }
    fsextra.remove(filepath, function (err) {
        if (err) {
            console.error(err);
        }
        callback(runId);
    });
};

function initConnection() {
    if (messageConnection == null) {
        if (config.messageConnection == 'mqtt')
            messageConnection = require('./mqttMessageConnection.js');
        else
            messageConnection = require('./postgresMessageConnection.js');
    }

    if (dataConnection == null) {
        if (config.dataConnection == 'ftp')
            dataConnection = require('./ftpDataConnection');
        else
            dataConnection = require('./postgresDataConnection');
    }

    if (workbenchConnection == null) {
        if (config.workbenchConnection == 'postgresql')
            workbenchConnection = require('./postgresWorkbenchConnection');
        else
            workbenchConnection = require('./sqlspacesWorkbenchConnection');
    }

}

for(var attributeName in pavs){
    sf[attributeName] = pavs[attributeName];
}



module.exports = sf;