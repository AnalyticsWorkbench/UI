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

/**
 * Connects the Editor to the SQLSpaces
 * based on the JsonRpc Adapter (using ajax)
 * @class WireIt.WiringEditor.adapters.NodeConnector
 * @static
 */
console.log("beginning of other nodeconnector");

WireIt.adapters.NodeConnector = {

    init: function () {
        // YAHOO.util.Connect.setDefaultPostHeader('application/json');
    },

    getLoadableWirings: function (callback) {
        var self = this;

        SC.sendRequest('getLoadableWirings', function (data) {
            callback.call(self, data);
        })

    },

    getUserGroups: function (callback) {
        var self = this;
        console.log("is this called?");
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
    
    getOwnedRuns: function (callback){
    	var self = this;

        SC.sendRequest('getOwnedRuns', function (data) {
            callback.call(self, data);
        });
    },
    
    getOwnedSaves: function (callback){
    	var self = this;

        SC.sendRequest('getOwnedSaves', function (data) {
            callback.call(self, data);
        });
    },
    
    
    getRunNamesForSave: function (saveId, callback){
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
        if(parameters["template"]){
            flag = 9;
        } else {
            flag = 3;
        }

        var date = calculateDate();

        parameters['saveid'] = saveId;
        parameters['date'] = date;
        parameters['flag'] = flag;
        parameters['wiring'] = wiring.working;

		console.log("saveWiring");
		console.log(parameters);

        SC.sendDataRequest('saveWiring', parameters, function() {
            callbacks.success.call(callbacks.scope, {saveid: saveId});
        });

    },

    getResults: function(runId, callbacks) {
        var self = this;

        SC.sendDataRequest('getResults', {runid: runId}, function(results) {
            callbacks.success.call(callbacks.scope, results);
        });
    },

    getErrorResults: function(runId, callbacks) {
        var self = this;

        SC.sendDataRequest('getErrorResults', {runid: runId}, function(errors) {
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

		console.log("Wiring: " + wiring.working);
        
        // create a JSON object from the JSON string for using
        // it for creating the necessary commands to the backend
        var jsonWorkflow = YAHOO.lang.JSON.parse(wiring.working);

        // array for holding the created tuples
//        var commandTuples = new Array(jsonWorkflow.modules.length);

        var filters = new Array(jsonWorkflow.modules.length);

        var dataUploaders = [];

        var tree = [];


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

            // find successors for node and push it to tree

            for (var wir in jsonWorkflow.wires) {

                var currentWire = jsonWorkflow[wir];

                if (currentWire.src.moduleId = m) {
                    var tarModule = jsonWorkflow.modules[currentWire.tgt.moduleId];
                    node.successors.push(tarModule);
                }
            }

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
                oldValues = oldValues + text;
                // preparation of file uploads
                dataUploaders.push({
                    "instanceid" : agentInstanceID,
                    "files" : files,
                    "text" : text
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

        SC.sendDataNotificationRequest('executeWiring', parameters, {
            id: runID,
            callback: function (data) {
                if (data.type == 'agent') {
                    notifications.agent.call(notifications.scope, data);
                } else if (data.type == 'run') {
                    notifications.run.call(notifications.scope, data);
                }
            }
        }, function () {
            for (var du in dataUploaders) {
                self.handleDataUpload(dataUploaders[du]["files"], dataUploaders[du]["instanceid"], dataUploaders[du]["text"], runID);
            }
            callbacks.success.call(callbacks.scope, {"runid": runID});
        });

    },

    handleDataUpload: function (files, agentInstanceId, isText, runId) {
        // var files = filter[2];
        var fileSet = []; // print to JSON later
        for (var fc = 0; fc < files.length; fc++) {
            var f = files[fc];
            console.log('yihaa');
            // var destinationpipe = filter[1]+filter[0].substring(0,1) + filter[0].substring(filter[0].length-1) + ".out_1";
            var destinationpipe = agentInstanceId + ".out_1";
            var reader = new FileReader();
            reader.onload = (function(thefile) {
                return function (e) {
                    var fileObj = {}

                    var fileName = thefile.name;
                    var ending = fileName.substring(fileName.lastIndexOf(".")+1);
                    fileObj.filename = fileName;
                    fileObj.filetype = ending;
                    if (isText) {
                        fileObj.specialfiletype = "TEXT";
                        fileObj.filedata = e.target.result;
                    } else {
                        fileObj.specialfiletype = "BASE64";
                        fileObj.filedata = e.target.result.replace(/^[^,]*,/,"");
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
                        setTimeout(function() {
                            SC.sendDataRequest('handleDataUpload', parameters, function () {});
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
