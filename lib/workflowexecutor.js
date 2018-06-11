var TS = require('sqlspaces');
var Cfg = require('../config.js');	//sql spaces config

//var wf = {"modules":[{"name":"Data Repository","value":{"value1":"testcase_cit_new.gml"},"config":{"position":[34,18],"xtype":"WireIt.SISOBContainer"}},{"name":"Result Downloader","value":{},"config":{"position":[28,345],"xtype":"WireIt.SISOBContainer"}},{"name":"Format Transformation","value":{"value01":"Pajek","value02":"SISOB Graph Format"},"config":{"position":[67,172],"xtype":"WireIt.SISOBContainer"}}],"wires":[{"xtype":"WireIt.BezierArrowWire","src":{"moduleId":0,"terminal":"out_1"},"tgt":{"moduleId":2,"terminal":"in_1"}},{"xtype":"WireIt.BezierArrowWire","src":{"moduleId":2,"terminal":"out_1"},"tgt":{"moduleId":1,"terminal":"in_1"}}],"properties":{"name":"","description":""}};
var host = Cfg.workbenchConnectionConfig.host;
var port = Cfg.workbenchConnectionConfig.port;
var connectOptions = {host: host, port: port};

module.exports = Executor = {


		ts: null,
		
		exe: function(params, cb){

			params.saveid = calculateWorkflowID();
			params.username = 'wfexecutor';
			
			if(Executor.ts == null){
				Executor.ts = new TS.TupleSpace(connectOptions, function(){});
			}

			params.runid = calculateWorkflowID();
			
		    function calculateWorkflowID() {
		        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		            return v.toString(16);
		        });
		    };

		    executeWiring(params);		    	
		    
		    ///////
		    function executeWiring(params) {

		    	var wiring = params.wiring;
		    	 if(wiring == null ){
		    		 wiring = [];
		    	 }

		    	 var runID = params.runid;
		    	 
		        var self = this;

		         var calculateDate = function() {

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

		         var calculatedDate = calculateDate();

		        // create a JSON object from the JSON string for using
		        // it for creating the necessary commands to the backend
		        // var jsonWorkflow = JSON.parse(wiring);
		        var jsonWorkflow = wiring;

		        // array for holding the created tuples
//		        var commandTuples = new Array(jsonWorkflow.modules.length);

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
		            var values = JSON.stringify(module.value);

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
		                var files = module.value.files;
		                var text = module.value.text;
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

		        execute(
		            //1
		            wfDescription,
		            //2
		            {
		                id: runID,
		                callback: function (data) {
		                    if (data.type == 'agent') {
//		                        console.log("Got agent callback: " + data);
		                    } else if (data.type == 'run') {
//		                        console.log("Got run callback: " + data);
		                    }
		                }
		            },
		            //3
		            function () {
		                for (var du in dataUploaders) {
		                    //self.handleDataUpload(dataUploaders[du]["files"], dataUploaders[du]["instanceid"], dataUploaders[du]["text"], runID);
//		                    throw new Error("Can\'t handle direct upload from here!")
		                    cb.onFailure();
//		                	console.log('Can\'t handle direct upload from here!');
		                }
		            }
		        );

		    };

		    function execute(wf, notification, callback){
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
		            1,
		            "run_"+wf.runid,
		            ""
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
		                //wf.filters[i].oldvalues
						wf.filters[i].newvalues
		            ]);
		            commandTuples.push(commandTuple);
		        }

		        // write all tuples into the spaces, thus starting the analysis
		        var startExecution = function () {
		        	
		        	// first the run tuple
		        	Executor.ts.write(runTuple);
		        	
		        	// next all command tuples
		        	for (var i = 0; i < commandTuples.length; i++) {
		        		Executor.ts.write(commandTuples[i]);
		        	}
		        	
		        	// notify that work is done
		        	cb.onReady(params);

		        };

		        // create template tuples for event registration
		        var runTemplateTuple = new TS.Tuple([wf.runid, 7, TS.fString, TS.fString, TS.fString, TS.fInteger, TS.fString, TS.fString]);
		        var agentTemplateTuple = new TS.Tuple([wf.runid, 2, TS.fInteger, TS.fString, TS.fString, TS.fString, TS.fString]);


		        var registerCallbacks = function () {
		            // wf registrieren
		        	Executor.ts.eventRegister(

		                'update',

		                runTemplateTuple,

		                function (event) {
		                    var seq = event.seq;
		                    var tuple = event.after.tuple;
		          
		                    var runStatus = tuple.getField(5).getValue();
		                    
		                    if (runStatus == 3){
		                    	cb.onSuccess(params);
		                    }
		                    if (runStatus == 5){
		                    	cb.onFailure(params);
		                    }

		                },

		                startExecution()
		               	
		            );
		        };

		        registerCallbacks();
		    };

		}
}
