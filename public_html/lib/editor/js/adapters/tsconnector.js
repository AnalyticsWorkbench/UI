//Node.js umgehen
//prepareWorkbench("user");
//new TS.TupleSpace(connectOptions, function () {alert("geht")});


//var connectOptions = {host: "localhost", port: 32525};
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
 * @class WireIt.WiringEditor.adapters.TSConnector
 * @static
 */

WireIt.WiringEditor.adapters.TSConnector = {

    callbacks: {},

    monitorTS: null,

    monitorIDs: {},


    init: function () {
        YAHOO.util.Connect.setDefaultPostHeader('application/json');
    },

    getLoadableWirings: function (callback) {
        var self = this;

        // create template for the wiring tuples
        var template = new TS.Tuple([
            TS.fString, // save-id
            3,
            TS.fString, // short name
            TS.fString, // description
            TS.fString, // wiring
            TS.fString, // user name
            "public",   // sharing info
            TS.fString  // save date
        ]);

        //alert(JSON.stringify(connectOptions));

        var ts = new TS.TupleSpace(connectOptions, function () {
            // read all tuples matching the template for public tuples
            //alert("!");
            ts.readAll(template, function (tuples) {
                var wirings = [];
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
                        wirings.push(wiring);
                    }
                }
                callback.call(self, wirings);
            });
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

        var self = this;

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
        }else{
            flag = 3;
        }

        var date = calculateDate();

        parameters['saveid'] = saveId;
        parameters['date'] = date;
        parameters['flag'] = flag;
        parameters['wiring'] = wiring.working;

        //create Tuple
        var wiringTuple = new TS.Tuple([
            parameters['saveid'], // workflowID
            parameters['flag'],  // Flag for wiring storage tuple
            parameters['shortname'], // short name for the workflow
            parameters['description'], // human readable description
            parameters['wiring'],
            "user",
            parameters['sharing'],
            parameters['date']
        ]);

        // create SQLSpaces connection
        var ts = new TS.TupleSpace(connectOptions, function () {
            // write tuple into the spaces
            ts.write(wiringTuple, function () {
                // close SQLSpaces server connection
                ts.disconnect();
                // tell the editor that saving was successful
                callbacks.success.call(callbacks.scope, {saveid: parameters['saveid']});
            });
        });

    },

    getResults: function(runId, callbacks) {
        var ts = new TS.TupleSpace(connectOptions, function () {
            var templateTuple = new TS.Tuple([
                runId,
                8,
                TS.fString,
                TS.fString,
                TS.fString,
                TS.fString
            ]);
            ts.readAll(templateTuple, function (resultTuples) {
                ts.disconnect();

                var results = [];
                if (resultTuples) {
                    for (var i = 0; i < resultTuples.length; i++) {
                        var result = {
                            runid: resultTuples[i].getField(0).getValue(),
                            instanceid: resultTuples[i].getField(2).getValue(),
                            resultinfo: resultTuples[i].getField(3).getValue()
                        };
                        results.push(result);

                    }
                }
                callbacks.success.call(callbacks.scope, results);
            });
        });

    },

    getErrorResults: function(runId, callbacks) {

        var ts = new TS.TupleSpace(connectOptions, function () {
            var templateTuple = new TS.Tuple([
                runId,
                5,
                TS.fString,
                TS.fString,
                TS.fString
            ]);
            ts.readAll(templateTuple, function (resultTuples) {
                ts.disconnect();

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

                callbacks.success.call(callbacks.scope, results);
            });
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

        var dataUploaders = [];

        // go through filters
        for (var m in jsonWorkflow.modules) {

            // current module
            var module = jsonWorkflow.modules[m];

            // Agent ID
            var agentID = module.name;

            // unique agent instance id is created from x,y coordinates
            var agentInstanceID = String(module.config.position[0]) + String(module.config.position[1]) + agentID.substring(0, 1) + agentID.substring(agentID.length - 1);

            // create JSON string from parameter object
            var values = YAHOO.lang.JSON.stringify(module.value);

            var pipes = "";

            // collect incoming pipes
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

            // legacy value collection...
            var oldValues = "";

            if (agentID == "Direct Uploader") {
                // for the direct uploader
                // values have to be handled differently
                // as we need the files object without serialization
                // and deserialization step in between
                var files = val.working.modules[m].value.files;
                var text = val.working.modules[m].value.text;
                // preparation of values for the
                for (var f = 0; f < files.length; f++) {
                    oldValues = oldValues + files[f].name + ",";
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
                newvalues: values
            };

            filters[m] = filter;

        }

        var wfDescription = {
            runid: runID,
            saveid: params["saveid"],
            username: params["username"],
            date: calculatedDate,
            filters: filters
        };

        this.execute(
            //1
            wfDescription,
            //2
            {
                id: runID,
                callback: function (data) {
                    if (data.type == 'agent') {
                        notifications.agent.call(notifications.scope, data);
                    } else if (data.type == 'run') {
                        notifications.run.call(notifications.scope, data);
                    }
                }
            },
            //3
            function () {
                for (var du in dataUploaders) {
                    self.handleDataUpload(dataUploaders[du]["files"], dataUploaders[du]["instanceid"], dataUploaders[du]["text"], runID);
                }
                callbacks.success.call(callbacks.scope, {"runid": runID});
            }
        );

    },

    execute: function(wf, notification, callback){

        //alert(wf.toSource());
        //alert(notification.toSource());
        //alert(callback.toSource());

        var self = this;

        // run tuple for describing the whole run
        var runTuple = new TS.Tuple([
            wf.runid,
            7,
            wf.saveid,
            wf.username,
            wf.date,
            1
        ]);

        // build command tuples for the single filters/agents
        var commandTuples = [];
        for (var i = 0; i < wf.filters.length; i++) {
            var commandTuple = new TS.Tuple([
                wf.runid,
                2,	// Flag for command tuples
                1,	// Status
                wf.filters[i].instanceid,
                wf.filters[i].agentid,
                wf.filters[i].pipes,
                wf.filters[i].oldvalues
            ]);
            commandTuples.push(commandTuple);
        }

        // write all tuples into the spaces, thus starting the analysis
        var startExecution = function () {
            var ts = new TS.TupleSpace(connectOptions, function () {

                // first the run tuple
                ts.write(runTuple);

                // next all command tuples
                for (var i = 0; i < commandTuples.length; i++) {
                    ts.write(commandTuples[i]);
                }

                // work done, disconnect
                ts.disconnect();

                // notify that work is done
                callback.call(self);
            });
        };

        // create template tuples for event registration
        var runTemplateTuple = new TS.Tuple([wf.runid, 7, TS.fString, TS.fString, TS.fString, TS.fInteger]);
        var agentTemplateTuple = new TS.Tuple([wf.runid, 2, TS.fInteger, TS.fString, TS.fString, TS.fString, TS.fString]);


        var registerCallbacks = function () {
            // wf registrieren
            WireIt.WiringEditor.adapters.TSConnector.monitorTS.eventRegister(

                'update',

                runTemplateTuple,

                function (event) {
                    var seq = event.seq;
                    var tuple = event.after.tuple;
                    var runId = tuple.getField(0).getValue();
                    var wfId = tuple.getField(2).getValue();
                    var wfUser = tuple.getField(3).getValue();
                    var wfTime = tuple.getField(4).getValue();
                    var runStatus = tuple.getField(5).getValue();

                    notification.callback({
                        type: 'run',
                        runid: runId,
                        wfid: wfId,
                        status: runStatus,
                        wfdate: wfTime
                    });

                },

                function (callbackId) {
                    //alert("cbId: "+callbackId)
                    /*/alert("wf: "+wf.runid)
                    WireIt.WiringEditor.adapters.TSConnector.monitorIDs[callbackId] = {
                        id: callbackId,
                        runid: wf.runid,
                        type: 'run'
                    };*/
                    // Agenten registrieren
                    WireIt.WiringEditor.adapters.TSConnector.monitorTS.eventRegister(

                        'update',

                        agentTemplateTuple,

                        function (event) {
                            var seq = event.seq;
                            var tuple = event.after.tuple;
                            var runId = tuple.getField(0).getValue();
                            var agentStatus = tuple.getField(2).getValue();
                            var instanceId = tuple.getField(3).getValue();
                            var agentId = tuple.getField(4).getValue();


                            notification.callback({
                                type: 'agent',
                                runid: runId,
                                agentid: agentId,
                                instanceid: instanceId,
                                status: agentStatus
                            });

                        },

                        function (callbackId) {
                            WireIt.WiringEditor.adapters.TSConnector.monitorIDs[callbackId] = {
                                id: callbackId,
                                runid: wf.runid,
                                type: 'agent'
                            };

                            //////////////////////////
                            startExecution();
                            //////////////////////////
                        }
                    );
                }
            );
        };

        if (!WireIt.WiringEditor.adapters.TSConnector.monitorTS) {
            WireIt.WiringEditor.adapters.TSConnector.monitorTS = new TS.TupleSpace(connectOptions, function () {
                registerCallbacks();
            });
        } else {
            registerCallbacks();
        }
    },

    handleDataUpload: function (files, agentInstanceId, isText, runId) {
        var fileSet = []; // print to JSON later
        for (var fc = 0; fc < files.length; fc++) {
            var f = files[fc];
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
                            var datatuple = new TS.Tuple([parameters.runid, 1, parameters.pipe, parameters.fileset, ""]);
                            var ts = TS.TupleSpace(connectOptions, function() {
                                // write data tuple
                                ts.write(datatuple, function() {
                                    // read command tuple
                                    var commandTemplate = new TS.Tuple([parameters.runid, 2, TS.fInteger, parameters.instanceid, TS.fString, TS.fString, TS.fString]);
                                    ts.read(commandTemplate, function(tuple) {
                                        // update command tuple
                                        if (tuple) {
                                            var tupleId = tuple.getTupleID();
                                            var updateTuple = new TS.Tuple([parameters.runid, 2, 3, parameters.instanceid, tuple.getField(4), tuple.getField(5), tuple.getField(6)]);
                                            ts.update(tupleId, updateTuple, function() {
                                                ts.disconnect();
                                            });
                                        }
                                    });
                                });
                            });
                        }, 4000);
                    }
                }
            })(f);
            if (isText) {
                reader.readAsText(f);
            }
            else {
                reader.readAsDataURL(f);
            }
        }
    },

    getLoadableResults: function (callback) {

        var self = this;

        // create template for successfully finished runs
        var template = new TS.Tuple([
            TS.fString, // run-id
            7,          // flag for run tuple
            TS.fString, // save-id
            TS.fString,       // user
            TS.fString, // date string
            3           // flag for successfully done
        ]);

        // create SQLSpaces connection
        var ts = new TS.TupleSpace(connectOptions, function () {
            // read all tuples matching the template
            ts.readAll(template, function (tuples) {

                var runs = [];
                if (tuples) {
                    for (var i = 0; i < tuples.length; i++) {
                        var run = {
                            runid: tuples[i].getField(0).getValue(),
                            saveid: tuples[i].getField(2).getValue(),
                            user: tuples[i].getField(3).getValue(),
                            rundate: tuples[i].getField(4).getValue()
                        };
                        runs.push(run);
                    }
                }
                callback.call(self, runs);

            });
        });

    },

    getResult: function (info, callback) {

        var self = this;

        // template for the result tuples
        var resultTemplate = new TS.Tuple([
            info.runid,   // id of the run of which we want results
            8,                  // flag for result tuple
            TS.fString,         // instance id
            TS.fString          // result link
        ]);

        // template for the workflow save tuple
        var workflowTemplate = new TS.Tuple([
            info.saveid,  // id of the saved workflow belonging to the results
            3,                  // flag for save tuples
            TS.fString,         // shortname of the saved wf
            TS.fString,         // long description of the saved wf
            TS.fString,         // wiring
            TS.fString,         // user who saved the wf
            TS.fString,         // sharing info ("public" or "user")
            TS.fString          // save date
        ]);

        var ts = new TS.TupleSpace(connectOptions, function () {
            // variable for the data to transfer
            var resultinfo = {
                runid: info.runid,
                saveid: info.saveid,
                user: info.user,
                rundate: info.rundate
            };

            // read the saved workflow
            ts.read(workflowTemplate, function (wfTuple) {
                if (wfTuple) {
                    resultinfo.wfname = wfTuple.getField(2).getValue();
                    resultinfo.wfdescription = wfTuple.getField(3).getValue();
                    resultinfo.wfwiring = wfTuple.getField(4).getValue();
                }
                ts.readAll(resultTemplate, function (tuples) {
                    var resultlinks = [];
                    if (tuples) {
                        for (var i = 0; i < tuples.length; i++) {
                            resultlinks.push(tuples[i].getField(3).getValue());
                        }
                    }
                    resultinfo.resultlinks = resultlinks;
                    callback.call(self, resultinfo);
                });
            });
        });
    },

    deleteWiring: function (val, callbacks) {
        // TODO do we need / want this
    },

    listWirings: function (val, callbacks) {
        // TODO do we need / want this
    }
};
