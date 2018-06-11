// Auxiliary function

function calculateDate() {

    function normalizeNumber(number) {
        if (number < 10) {
            return "0" + number;
        } else {
            return "" + number;
        }
    }

    var now = new Date();
    var dateInfo = [];
    dateInfo.push(now.getUTCFullYear());
    dateInfo.push(normalizeNumber(now.getUTCMonth() + 1));
    dateInfo.push(normalizeNumber(now.getUTCDate()));
    dateInfo.push(normalizeNumber(now.getUTCHours()));
    dateInfo.push(normalizeNumber(now.getUTCMinutes()));
    dateInfo.push(normalizeNumber(now.getUTCSeconds()));
    var text = dateInfo.join("");
    return dateInfo.join("");
}

//add by popo
//Rmanage
/**
 * calculateRscriptID
 */
function calculateRscriptID() {
    return 'xxxxxxxx-xxxx-5xxx-zxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Connects the Editor to the SQLSpaces
 * based on the JsonRpc Adapter (using ajax)
 * @class WireIt.WiringEditor.adapters.NodeConnector
 * @static
 */

WireIt.WiringEditor.adapters.NodeConnector = {

    init: function () {
        // YAHOO.util.Connect.setDefaultPostHeader('application/json');
    },

    getLoadableWirings: function (callback) {
        var self = this;

        SC.sendRequest('getLoadableWirings', function (data) {
            callback.call(self, data);
        })

    },

/*******************************************************************************************************************/
//real Noceconnector
//Rmanage
//add by popo

    /**
     * read all available R-scripts
     *        if you want change strategy that the user could not modify the other shared R-scripts,
     *        just change the name of 'getLoadableRscripts' to 'getLoadableRscripts_own'
     *
     * @param callback
     *         callback function
     */
    getLoadableRscripts: function (callback) {
        var self = this;
        console.log("LoadableRScripts");
        SC.sendRequest('getLoadableRscripts', function (data) {
            console.log("Data sent back to browser");
            console.log(data);
            callback.call(self, data);
        })
    },

    /**
     * delete R-scripts
     *
     * @param reqData
     *         deletion parameter
     * @param callback
     *         callback function
     */
    deleteRscript: function (reqData, callback) {
        var self = this;

        SC.sendDataRequest('deleteRScript', reqData, function (data) {
            callback.call(self, data);
        })

    },

    /**
     * saving for a new R-script tuple
     *
     * @param parameters
     *         New R-script parameter
     * @param callback
     *         callback function
     */
    saveNewRscript: function (parameters, callbacks) {

        var isText = 1;// always as Text
        var fileSet = []; // R-script file set
        //support for multiple files
        for (var fc = 0; fc < parameters["uploads"].length; fc++) {

            var file = parameters["uploads"][fc];

            //The FileReader object is used to read data from files that are made accessible through the browser.
            var reader = new FileReader();

            //'onload' is fired only when all data has been successfully read.
            reader.onload = (function(thefile) {
                return function (e) {

                    var fileObj = {}

                    var fileName = thefile.name;
                    var ending = fileName.substring(fileName.lastIndexOf(".")+1);

                    fileObj.filename = fileName;
                    fileObj.filetype = ending;
                    fileObj.specialfiletype = "TEXT";
                    fileObj.filedata = e.target.result;

                    fileSet.push(fileObj);

                    if (fileSet.length == parameters["uploads"].length) {
                        //all files are uploaded, we are done

                        setTimeout(function() {

                            //prepare parameters send to socketio
                            var saveId = calculateRscriptID();
                            var date = calculateDate();
                            parameters['saveid'] = saveId;
                            parameters['date'] = date;
                            parameters['fileset'] = JSON.stringify(fileSet);

                            SC.sendDataRequest('saveNewRscript', parameters, function() {

                                callbacks.success.call(callbacks.scope,
                                    {
                                        "msg": "has been successfully saved in tuple space",
                                        "name": parameters['name']
                                    });
                            });
                        }, 1000);
                    }
                }
            })(file);
            reader.readAsText(file);
        }
    },

    /**
     * saving for a existing R-script tuple
     *
     * @param parameters
     *         R-script parameter
     * @param callback
     *         callback function
     */
    saveExistingRscript: function (parameters, callbacks) {

        var self = this;

        var isText = 1;// always as Text
        var fileSet = []; // R-script file set

        if(parameters["uploads"].length < 1)
        {
            //R-script code is not changed

            //the date is changed to show the R-script is modified
            parameters['date'] = calculateDate();

            SC.sendDataRequest('saveExistingRscript', parameters, function (data) {
                if(data.ok)
                    callbacks.success.call(callbacks.scope,
                        {
                            "msg": "has been successfully saved in tuple space",
                            "name": parameters['name']
                        });
                else
                    callbacks.failure.call(callbacks.scope,
                        {
                            "msg": "R-script tuple is not found."
                        });
            });

        }
        else
        {
            //R-script code is changed, new uploading is needed
            //support for multiple files
            for (var fc = 0; fc < parameters["uploads"].length; fc++) {

                var file = parameters["uploads"][fc];

                //The FileReader object is used to read data from files that are made accessible through the browser.
                var reader = new FileReader();

                //'onload' is fired only when all data has been successfully read.
                reader.onload = (function(thefile) {
                    return function (e) {

                        var fileObj = {}
                        var fileName = thefile.name;
                        var ending = fileName.substring(fileName.lastIndexOf(".")+1);

                        fileObj.filename = fileName;
                        fileObj.filetype = ending;
                        fileObj.specialfiletype = "TEXT";
                        fileObj.filedata = e.target.result;

                        fileSet.push(fileObj);

                        if (fileSet.length == parameters["uploads"].length) {
                            //all files are uploaded, we are done

                            setTimeout(function() {

                                //prepare parameters send to socketio
                                parameters['fileset'] = JSON.stringify(fileSet);
                                //the date is changed to show the R-script is modified
                                parameters['date'] = calculateDate();

                                SC.sendDataRequest('saveExistingRscript', parameters, function (data) {
                                    if(data.ok)
                                        callbacks.success.call(callbacks.scope,
                                            {
                                                "msg": "has been successfully saved in tuple space",
                                                "name": parameters['name']
                                            });
                                    else
                                        callbacks.failure.call(callbacks.scope,
                                            {
                                                "msg": "R-script tuple is not found."
                                            });
                                });
                            }, 1000);
                        }
                    }
                })(file);
                reader.readAsText(file);
            }
        }
    },

//end of adding
/*******************************************************************************************************************/

    getUserGroups: function (callback) {
        var self = this;

        SC.sendRequest('getUserGroups', function (data) {
            callback.call(self, data);
        })

    },

    getGroupNames: function (reqData, callback) {
        var self = this;

        SC.sendDataRequest('getGroupNames', reqData, function (data) {
            callback.call(self, data);
        })

    },

    deleteSave: function (reqData, callback) {
        var self = this;

        SC.sendDataRequest('deleteSaveTuple', reqData, function (data) {
            callback.call(self, data);
        })

    },

    deleteRun: function (reqData, callback) {
        var self = this;

        SC.sendDataRequest('deleteRunTuple', reqData, function (data) {
            callback.call(self, data);
        })

    },

    getOwnedRuns: function (callback) {
        var self = this;

        SC.sendRequest('getOwnedRuns', function (data) {
            callback.call(self, data);
        });
    },

    getOwnedSaves: function (callback) {
        var self = this;

        SC.sendRequest('getOwnedSaves', function (data) {
            callback.call(self, data);
        });
    },


    getRunNamesForSave: function (saveId, callback) {
        var self = this;

        SC.sendDataRequest('getRunNamesForSave', saveId, function (data) {
            callback.call(self, data);
        });
    },


    /**
     * new save function that allows saving a module into
     * the sqlspaces
     */
    saveWiringExtended: function (val, parameters, callbacks) {

        /*
         * Steps:
         * - convert the wiring into some storable format
         * - create a tuple for storing the wiring
         * - write tuple to SQLSpaces
         *   - check for uniqueness of identifier
         *   - handle problems
         * - report back status of saving
         */

        // Make a copy of the object
        var wiring = {};
        YAHOO.lang.augmentObject(wiring, val);
        // Encode the working field as a JSON string
        wiring.working = YAHOO.lang.JSON.stringify(wiring.working);

        var saveId = calculateWorkflowID();

        // set flag for template or default storage
        var flag;
        if (parameters["template"]) {
            flag = 9;
        } else {
            flag = 3;
        }

        var date = calculateDate();

        parameters['saveid'] = saveId;
        parameters['date'] = date;
        parameters['flag'] = flag;
        parameters['wiring'] = wiring.working;

        SC.sendDataRequest('saveWiring', parameters, function () {
            callbacks.success.call(callbacks.scope, {saveid: saveId});
        });

    },

    getResults: function (runId, callbacks) {
        var self = this;

        SC.sendDataRequest('getResults', {runid: runId}, function (results) {
            console.log(results);
            callbacks.success.call(callbacks.scope, results);
        });
    },

    getErrorResults: function (runId, callbacks) {
        var self = this;

        SC.sendDataRequest('getErrorResults', {runid: runId}, function (errors) {
            callbacks.success.call(callbacks.scope, errors);
        });
    },

    executeWiring: function (runID, val, params, notifications, callbacks) {

        var self = this;

        var calculatedDate = calculateDate();

        // build a JSON string describing the current workflow (wiring)
        var wiring = {};
        YAHOO.lang.augmentObject(wiring, val);
        wiring.working = YAHOO.lang.JSON.stringify(wiring.working);

        // create a JSON object from the JSON string for using
        // it for creating the necessary commands to the backend
        var jsonWorkflow = YAHOO.lang.JSON.parse(wiring.working);

        // array for holding the created tuples
//        var commandTuples = new Array(jsonWorkflow.modules.length);

        var filters = new Array(jsonWorkflow.modules.length);

        var tree = [];

        var dataUploaders = [];

        var findChildrenForNode = function(module) {

            var successors = [];

            for (var wir in jsonWorkflow.wires) {

                var currentWire = jsonWorkflow.wires[wir];

                if (currentWire.src.moduleId == getModuleId(module)) {
                    var tarModule = jsonWorkflow.modules[currentWire.tgt.moduleId];
                    if (tarModule !== 'undefined') {
                        successors.push(tarModule);
                    }
                }
            }
            return successors;
        };

        var getModuleId = function(module) {
            return jsonWorkflow.modules.indexOf(module);
        };

        var buildName = function(module) {
            return String(module.config.position[0]) + String(module.config.position[1]) + module.name.substring(0, 1) + module.name.substring(module.name.length - 1);
        };

        var findAllSuccessors = function(module, result) {
            result.push(buildName(module));

            var children = findChildrenForNode(module);
            for (var i = 0; i < children.length; i++) {
                findAllSuccessors(children[i], result);
            }
        };

        // go through filters
        for (var m in jsonWorkflow.modules) {

            // current module
            var module = jsonWorkflow.modules[m];

            var node = {
                successors: []
            };

            // Agent ID
            var agentID = module.name;

            // unique agent instance id is created from x,y coordinates
            var agentInstanceID = String(module.config.position[0]) + String(module.config.position[1]) + agentID.substring(0, 1) + agentID.substring(agentID.length - 1);

            node.id = agentInstanceID;

            // create JSON string from parameter object
            var values = YAHOO.lang.JSON.stringify(module.value);

            var pipes = "";

            var successors = [];
            findAllSuccessors(module, successors);
            successors.shift();
            node.successors = successors;

            tree.push(node);

            // collect incoming pipes
            /* TODO:
             * Es ist eine sehr schlechte Lösung! Pipes werden zufällig geordnet. Es ist für einen Agenten nicht mehr
             * möglich festzustellen über welche Pipe welche Daten kommen.
             *
             * Vorrübergehende Lösung: Alphabetisch sortieren nach in pipes. Sollte in Zukunft geändert werden.

             for (var w in jsonWorkflow.wires) {

             var wire = jsonWorkflow.wires[w];

             if (wire.tgt.moduleId == m) {
             var srcModule = jsonWorkflow.modules[wire.src.moduleId];
             var srcID = String(srcModule.config.position[0]) + String(srcModule.config.position[1]) + srcModule.name.substring(0, 1) + srcModule.name.substring(srcModule.name.length - 1);
             var terminal = wire.src.terminal;

             pipes = pipes + srcID + "." + terminal + ",";
             }
             }

             if (pipes.length > 0) {
             pipes = pipes.substring(0, pipes.length - 1);
             }
             */

            var pipeList = [];
            var inList = [];
            for (var w in jsonWorkflow.wires) {

                var wire = jsonWorkflow.wires[w];

                if (wire.tgt.moduleId == m) {
                    var srcModule = jsonWorkflow.modules[wire.src.moduleId];
                    var srcID = String(srcModule.config.position[0]) + String(srcModule.config.position[1]) + srcModule.name.substring(0, 1) + srcModule.name.substring(srcModule.name.length - 1);

                    pipeList.push({in: wire.tgt.terminal, out: pipes + srcID + "." + wire.src.terminal});
                }
            }

            pipes = pipeList.sort(function(a, b){

                var ret = 1
                if (a.in < b.in) {
                    ret = -1;
                }
                return ret;
            }).map(function(wireObj) {
                return wireObj.out;
            }).join();

            // JSON values by default are the values as we get them
            var newValues = values;

            // legacy value collection...
            var oldValues = "";

            if (agentID == "Direct Uploader") {
                // for the direct uploader
                // values have to be handled differently
                // as we need the files object without serialization
                // and deserialization step in between
                var files = val.working.modules[m].value.files;
                var text = val.working.modules[m].value.text;
                // preparation of JSON value transmission
                newValues = {
                    files: [],
                    text: text
                };
                // preparation of values for the
                for (var f = 0; f < files.length; f++) {
                    oldValues = oldValues + files[f].name + ",";
                    newValues.files.push(files[f].name);
                }
                newValues = JSON.stringify(newValues);
                oldValues = oldValues + text;
                // preparation of file uploads
                dataUploaders.push({
                    "instanceid": agentInstanceID,
                    "files": files,
                    "text": text
                });
            } else {
                // here we just collect everything similar to
                // how it has been done before
                for (var v in module.value) {
                    oldValues = oldValues + module.value[v] + ",";
                }

                if (oldValues.length > 0) {
                    oldValues = oldValues.substring(0, oldValues.length - 1);
                }
            }

            var filter = {
                runid: runID,
                instanceid: agentInstanceID,
                agentid: agentID,
                pipes: pipes,
                oldvalues: oldValues,
                newvalues: newValues
            };

            filters[m] = filter;

        }

        var parameters = {
            runid: runID,
            saveid: params["saveid"],
            username: params["username"],
            date: calculatedDate,
            tree: tree,
            filters: filters
        };

        for (var du in dataUploaders) {
            //check if there are files selected...
            if (dataUploaders[du]["files"].length < 1) {
                //..if not: call failure and end process

                //indicate error in gui
                // - call failure (alert box)
                callbacks.failure.call(callbacks.scope,
                    {
                        "instanceid": dataUploaders[du]["instanceid"],
                        "runid": runID,
                        "status": 5,
                        "msg": "A datauploader seems to be empty."
                    });
                return;
            }
        }
        sendExeReq();

        function sendExeReq() {

            SC.sendDataNotificationRequest('executeWiring', parameters, {
                    id: runID,
                    callback: function (data) {
                        if (data.type == 'agent') {
                            notifications.agent.call(notifications.scope, data);
                        } else if (data.type == 'run') {
                            notifications.run.call(notifications.scope, data);
                        }
                    }
                },
                function () {
                    for (var du in dataUploaders) {
                        //indicate "working" status..
                        notifications.agent.call(notifications.scope, {
                            "instanceid": dataUploaders[du]["instanceid"],
                            "runid": runID,
                            "status": 2
                        });
                        //start upload..
                        self.handleDataUpload(dataUploaders[du]["files"], dataUploaders[du]["instanceid"], dataUploaders[du]["text"], runID);
                    }
                    callbacks.success.call(callbacks.scope, {"runid": runID});
                });

        }

    },

    handleDataUpload: function (files, agentInstanceId, isText, runId) {
        // var files = filter[2];
        var fileSet = []; // print to JSON later
        for (var fc = 0; fc < files.length; fc++) {
            var f = files[fc];
            // var destinationpipe = filter[1]+filter[0].substring(0,1) + filter[0].substring(filter[0].length-1) + ".out_1";
            var destinationpipe = agentInstanceId + ".out_1";
            var reader = new FileReader();
            reader.onload = (function (thefile) {
                return function (e) {
                    var fileObj = {}

                    var fileName = thefile.name;
                    var ending = fileName.substring(fileName.lastIndexOf(".") + 1);
                    fileObj.filename = fileName;
                    fileObj.filetype = ending;
                    if (isText) {
                        fileObj.specialfiletype = "TEXT";
                        fileObj.filedata = e.target.result;
                    } else {
                        fileObj.specialfiletype = "BASE64";
                        fileObj.filedata = e.target.result.replace(/^[^,]*,/, "");
                    }

                    /*
                     var splitName = thefile.name.split(".");
                     fileObj.filename = splitName[0];
                     fileObj.filetype = splitName[1];
                     if (thefile.type == "" || thefile.type.search(/^text/) > -1) {
                     fileObj.specialfiletype = "";
                     fileObj.filedata = e.target.result;
                     }
                     else {
                     fileObj.specialfiletype = "BASE64";
                     fileObj.filedata = e.target.result.replace(/^[^,]*,/,"");
                     console.log(fileObj.filedata);
                     }
                     */

                    fileSet.push(fileObj);
                    if (fileSet.length == files.length) {
                        // last callback, we are done
                        var parameters = {
                            runid: runId,
                            pipe: destinationpipe,
                            instanceid: agentInstanceId,
                            fileset: JSON.stringify(fileSet)
                        };
                        setTimeout(function () {
                            SC.sendDataRequest('handleDataUpload', parameters, function () {
                            });
                        }, 8000);
                    }
                }
            })(f);
            if (isText) {
                // if (f.type == "" || f.type.search(/^text/) > -1) {
                reader.readAsText(f);
            }
            else {
                reader.readAsDataURL(f);
            }
        }
    },

    getLoadableResults: function (callback) {

        var self = this;

        SC.sendRequest('getLoadableResults', function (data) {
            callback.call(self, data);
        })

    },

    renameRun: function (params, callback) {
        var self = this;

        SC.sendDataRequest('renameRunTuple', params, function (data) {
            callback.call(self, data);
        })
    },

    renameAutosave: function (params, callback) {
        var self = this;

        SC.sendDataRequest('renameAutosaveTuple', params, function (data) {
            callback.call(self, data);
        })
    },

    getResult: function (info, callback) {
        var self = this;
        SC.sendDataRequest('getResultInfo', info, function (data) {
            callback.call(self, data);
        });
    },

    deleteWiring: function (val, callbacks) {
        // TODO do we need / want this
    },

    listWirings: function (val, callbacks) {
        // TODO do we need / want this
    }
};
