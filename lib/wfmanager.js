/**
 * Table of contents:
 * 1. dependencies 				- script requirements
 * 2. initialization 			- configurable params / properties and start up
 * 3. workflow execution 		- methods for workflowexecution
 * 4. results 					- methods for resultchecking
 * 5. agents					- methods for agentmonitoring
 * 6. logging					- methods concerning logging (email notification, console, logfile, etc.)
 * 7. helpers					- more general methods not fitting in one category
 * 8. console gui				- a console based gui and some actions for direct script usage
 * 9. tuplespace connection		- methods for establishing and querying a nodeworkbench tuplespace 
 * 10. web						- methods wrapping execution etc. via web based access
 */


/////////////////////////////////////
//////// 1. dependencies ////////////
/////////////////////////////////////

var Cfg = require('../config.js');	//sql spaces config
var TS = require('sqlspaces');		//sql spaces
var Mailer = require("nodemailer"); //mail
var FS = require("fs");				//filesystem
var Crypto = require('crypto'); 	//checksum
var RL = require('readline');		//interface for console
var Table = require('cli-table');  	//table for console if
var Moment = require('moment');		//time handling
var UUID = require('node-uuid');	//id generator
var Executor = require("./workflowexecutor.js"); //executing workflows
var Express = require('express');	//RESTful webservice
var Http = require('http');			//http protocol

/////////////////////////////////////
/////// 2. initalization ////////////
/////////////////////////////////////

//agent monitoring
var ifAgentCheck = false;
var agentCheckRate = Moment.duration(30, "seconds").asMilliseconds(); 		//(should be > 2 secs)
var minRepetitionTime = Moment.duration(30, "seconds").asMilliseconds(); 	//if a repeating wf execution is called this is min time between 2 runs

//logging
var ifLogFile = true; 			//if there schould be a logfile
var ifMailNotification = true;	//if an mail notification should be sent


//logging -> mail
var smtpOptions = {
	service: "Mailservice.com",
	host: "127.0.0.1",
	port: 587,
	secureConnection: false,
    auth: {
        user: "user",
        pass: "pw"
    }
}
var mailOptions = {
    from: "sender@Mailservice.com", 			// sender address
    to: "receiver@foo.bar", 					// list of receivers
    subject: "System Change Notification", 		// Subject line
    text: "", 									// plaintext body
    html: "" 									// html body
}

// Webservice
var ifWebservice = false;
var portnumber = 5555; // the portnumber on which the program is listening


// program start
function start(config){
	
	//////////////////
	/**
	 * config params are:
	 * 
	 * ifAgentcheck: bool
	 * agentCheckRate: number
	 * minRepititionTime: number
	 * ifLogFile: bool
	 * ifMailNotification: bool
	 * mailOptions: {
	 * 		from: string,
	 * 		to: string,
	 * 		subject: string
	 * }
	 * smtpOptions: {
	 * 		service: string,
	 * 		host: string,
	 * 		port: number,
	 * 		auth: {
	 *			user: string,
	 *			pass string
	 *		}
	 * }
	 * ifWebService: bool
	 * portnumber: number
	 *
	 */
	
	wfm.setAgentMonitoring(config,function(){});
	wfm.setAgentCheckRate(config,function(){});
	wfm.setMinRepititionTime(config,function(){});
	wfm.setLogFile(config,function(){});
	wfm.setMailNotification(config,function(){});
	wfm.setMailOptions(config,function(){});
	wfm.setWebservice(config,function(){});
	wfm.setPortNumber(config,function(){});
	
	//////////////////
	
	//startTS(function(){
		if(ifAgentCheck){
			startAgentMonitoring();		
		}
		if(ifWebservice){
			startWebservice(); 	// not needed for local usage
		}
        //initFromTS();
	//});
	
}

//maybe diffent console params for script startup?
//process.argv.forEach(function (val, index, array) {
//	  console.log(index + ': ' + val);
//});

function initFromTS() {
    var templateTupel = new TS.Tuple([
        TS.fString,
        41,
        TS.fString
    ]);
    // as this is called directly in the callback of a checkTS, there is no need to check again here
    ts.readAll(templateTupel, function(tuples){
        if (tuples) {
            for (var i = 0; i < tuples.length; i++) {

                var params = JSON.parse(tuples[i].getField(2).getValue());

                var exeDate = Moment(params.firststart);

                var start;
                if(exeDate.isBefore(Moment(getNow()))){
                    start = Moment.duration(0);
                }else{
                    start = Moment.duration(exeDate.subtract(Moment(getNow())));
                }

                var runParams = {
                    id : params.id,
                    name: params.name,
                    description: params.description,
                    wiring: params.wiring,
                    start: start.asMilliseconds(),
                    repeat: params.repeat,
                    test: params.test,
                    firststart : params.firststart
                };

                wfs.push(new Running(runParams));

            }
        }
    });
}

/////////////////////////////////////
///// 3. workflow execution /////////
/////////////////////////////////////
/**
 * wfs holds all executions and removeRunning deletes finished/canceled runs
 */
var wfs = [];
function addRunning(running) {
    wfs.push(running);
    var params = {
        id : running.getId(),
        name : running.getName(),
        description : running.getDescription(),
        wiring : running.getWiring(),
        firststart : running.getFirstStart(),
        repeat : running.getRepeatMS(),
        test: running.getTest()
    };
    if (params.repeat >= 0) {
        // a negative value for repeat means it should not be repeated at all
        // in that case no need to store it persistently

        var autoexecTuple = new TS.Tuple([
            params.id,
            41,
            JSON.stringify(params)
        ]);

        checkTS(function(){
            ts.write(autoexecTuple);
        });

    }
}
function removeRunning(id){
	for(var i = 0; i < wfs.length; i++){
		if(wfs[i].getId()==id){
			wfs.splice(i,1);
			break;
		}
	}
    var deleteTemplate = new TS.Tuple([
        id,
        41,
        TS.fString
    ]);
    checkTS(function(){
        ts.delete(deleteTemplate);
    });
}
function getRunning(id){
	for(var i = 0; i < wfs.length; i++){
		if(wfs[i].getId()==id){
			return wfs[i];
		}
		return null;
	}
}

/**
 * "threads" to start, stop and watch started executions of workflow 
 * stored in wfs (s.a.)
 * 
 * params via object -> {firstParam: "value"}
 * @param name - "threads" name
 * @param description - description of the workflow
 * @param wiring - the wf to execute
 * @param start - the start in ms
 * @param repeat - the interval in ms(optional)
 * @param test {Boolean} - if its a test run (extended check) or a normal execution 
 */
function Running(params){
	
	var self = this;

    var id;
    if (!params.id) {
        id = ID();
    } else {
        id = params.id;
    }
	this.getId = function(){ return id; };
	
	var name;
	if (!params.name){
		name = "running_"+id;
	}else{
		name = params.name;
	}
	this.getName = function(){ return name; };

    var description;
    if (!params.description){
        description = "";
    }else{
        description = params.description;
    }
    this.getDescription = function(){ return description; };
	
	var wiring;
	if(!params.wiring){
		wiring = null;
	}else{
		try {
			wiring = JSON.parse(params.wiring);			
		}catch(e){
			wiring = null;
		}
	}
    this.getWiring = function() { return JSON.stringify(wiring); };
	
	this.callback;
	if(params.callback){
		callback = params.callback();
	}else{
		callback = function(){console.log("cb")};
	}
	
	var test;
	if (!params.test){
		test = false;
	}else{
		test = params.test;
	}
    this.getTest = function() { return test; };
	
	var start;
	if(!params.start){
		// start = Moment(getNow());
        start = 0; // when to start in ms
	}else{
		start = params.start;
	}
    this.getStart = function() { return start; };

    var firstStart;
    if (!params.firststart) {
        firstStart = Moment().unix() + Math.floor(start / 1000);
    } else {
        firstStart = params.firststart;
    }
    this.getFirstStart = function() { return firstStart; };

    var repeat;
	if(!params.repeat){
		repeat = null;
	}else{
		repeat = params.repeat;
		if (repeat < minRepetitionTime){
			repeat = minRepetitionTime; //make sure no repetitions under min		
		}
	}
	
	// time -> external use
	this.startIn = function(){
		if(!calledLast){
			return Moment.duration( firstCalled.subtract(Moment(getNow())) ).humanize();
		}else{
            var tmp = new Moment(calledLast);
            tmp = tmp.add(repeat);
            tmp = tmp.subtract(Moment(getNow()));
			var duration = Moment.duration(tmp);
			return duration.humanize();
		}
	}
	this.getRepeat = function(){
		if(repeat!=null){
			return Moment.duration(repeat).humanize();
		}
		return "no";
	}
    this.getRepeatMS = function() {
        if (repeat != null) {
            return repeat;
        } else {
            return -1;
        }
    }

	//time -> internal use
	
	var firstCalled = Moment( getNow() ).add( Moment.duration(start) );
	var calledLast = null;
	
	var intervalExe = null; 	//stores interval Timer - repeated exe
	var exe = null;
	if (id && name && wiring){
		exe = setTimeout(	//stores timeout Timer - first exe
				function(){ execute() }, 
				start
		); 		
	}else{
		stop();
	}
	
	// execution 
	var exeparams = {
			id: id,
			name: name,
			wiring: wiring,
			test: test,
			callback: callback
	}
	
	function execute(){
		
		calledLast = Moment(getNow());
		log("triggered execution of \"" + name + "\" ("+id+")...", "WORKFLOWEXECUTION");

		//first run..
		if( repeat != null && intervalExe == null){
			if(test){
				executeWF(exeparams);
			}
			intervalExe = setInterval(
					function(){ execute() }, 
					repeat
			);
		}
		
		// make a extended test on further runs
//		if(repeat != null && !test){
//			exeparams.test = true;
//			executeWF(exeparams);
//		}else{
//			executeWF(exeparams);
//		}
        // REF why should we check if it is not asked for?
        executeWF(exeparams);
		
		exe = null;
		
		//if only executed once remove after execute
		if(repeat == null){
			removeRunning(id);
		}
	}
	
	
	this.stop = function(){
		stop();
	}
	function stop(){
		if(exe){
			clearTimeout(exe);
		}
		if(intervalExe){
			clearInterval(intervalExe);
		}
		removeRunning(id);
		log("stopped execution of \"" + name + "\" ("+id+")... wrong parameters?", "WORKFLOWEXECUTION");
	}
	
}
/**
 * execute workflow and handle errors/success
 * params -> {param1:value}
 * @param wiring
 * @param id
 * @param name 
 * @param extendedCheck 
 */
function executeWF(params){
	
	var callback = params.callback;
	var name = params.name;
	var wiring = params.wiring;
	var id = params.id;
	var extendedResultCheck = false;
	if(params.test == true){
		extendedResultCheck = true;
	}
	
	var callback = {
		onSuccess: function(params){
			log("...execution \"" + params.name + "\" ("+params.id+") finished... run-instance id was: " + params.runid, "WORKFLOWEXECUTION");		
			if (extendedResultCheck){
				checkResult(params.runid, params.id, true);				
			}else{
				checkResult(params.runid, params.id);		
			}
			//XXX callback aus params callback einbinden
//			callback();
			
		}, 
		onReady: function(params){
			log("execution details of \"" + params.name + "\" ("+params.id+") were wrote into TS... run-instance id is: " + params.runid, "WORKFLOWEXECUTION");
		}, 
		onFailure: function(params){
			log("failed to execute \"" + params.name + "\" ("+params.id+")... maybe there is a agent missing or a non reachable repository (as direct uploader has) exists in your workflow... run-instance id was: " + params.runid, "WORKFLOWEXECUTION ERROR");		
		}
	}
	
	try{
		Executor.exe(params, callback);
	}catch(e){
		log("Error in Executor..." + e, "WORKFLOWEXECUTION ERROR");
		removeRunning(params.id);
	}

}

/////////////////////////////////////
///////// 4. results ////////////////
/////////////////////////////////////

//{id: {filename: checksum}}
var checksums = {};

function checkResult(runinstanceid, runningId, withChecksum){

    // REF was originally true - but why?
	var extendedCheck = false;
	if(withChecksum){
		extendedCheck = true;
	}
	
	var path = Cfg.resultdir;

	if(path.charAt(path.length) != '/'){
		path += "/";
	}
	path += runinstanceid + "/";
	try{
		// results/runid/
		var runResultsDirs = FS.readdirSync(path);
		// results/runid/*agents		
		for(var i = 0; i < runResultsDirs.length; i++){
			checkDir(path + runResultsDirs[i] + "/");
		}
		log("file/s for runinstance: "+runinstanceid+" checked sucessfully...","RESULTCHECK SUCCESS");	
	}catch(e){
		log("failed for runinstance: " + runinstanceid + ". error while verifying results... " + e,"RESULTCHECK ERROR");		
		removeRunning(runningId);
	}
	
	function checkDir(dir){
		
		var files = FS.readdirSync(dir);
		
		// results/runid/agent/file.bla
		for(var i = 0; i < files.length; i++){
			
			var filepath = dir + files[i];
			log("check: "+filepath+"...","RESULTCHECK");
			
			//exclude index and zip file from extended check
			var skip = false;
			if(		files[i].indexOf("index.html") != -1 |
					files[i].indexOf("_result.zip") != -1 )
			{
				skip = true;
			}
			
			//check file
			//extended check with checksum comparison in case of testing wfs
			if (extendedCheck && !skip){
				//compare with existing checksum
				var hash = Crypto.createHash('sha1');
				var file = FS.readFileSync(filepath);
				hash.update(file);
				var newChecksum = hash.digest('hex');
				var fileOK = compareChecksum(files[i], newChecksum);
				if(fileOK){
					log(("ok, result files checksum: " + newChecksum),"RESULTCHECK");					
				}else{
					throw new Error(("failed, result files checksum: " + newChecksum + " seems not to be identical with earlier results"));
				}
			}else{
				//simple check in case of only executing a workflow
				var error = null;
				try {
					var file = FS.openSync(filepath, 'r');					
					FS.close(file);
				}catch (e){
					error = e;
				}
				if (!error){
					log(("ok, result file exists"), "RESULTCHECK");					
				}else{
					throw new Error(("failed: " + error), "RESULTCHECK ERROR");
				}
			}
			
		}
	}
	
	function compareChecksum(filename, newChecksum){

		if (!checksums[runningId]){
			checksums[runningId] = {};
		}
		
		if (!checksums[runningId][filename]){
			checksums[runningId][filename] = newChecksum;
			return true; //first run...
		}else{
			if(checksums[runningId][filename] == newChecksum){
				checksums[runningId][filename] = newChecksum;
				return true;//checksum is equal to stored one
			}else{
				checksums[runningId][filename] = newChecksum;
				return false;//checksum is NOT equal to stored one
			}
		}
	}
	
}


/////////////////////////////////////
////////// 5. agents ////////////////
/////////////////////////////////////

//recurring agent test
var tmpOnlineAgents = null;//holds the values of the last check
var agentCheckTimer = null;
var notifyEmpty = false;

//check for missing/new agents and handle changes
function checkAgents(callback){
	
	//get the agent tuples from tuplespace
	getOnlineAgents(function(agentTuples){
		
		var time = new Date();
		
		if(agentTuples){
			
			var currentlyOnlineAgents = [];
			//get the agents names
			for (var i = 0; i < agentTuples.length; i++){
				var agentName = JSON.parse(agentTuples[i].getField(1).getValue()).name;
				currentlyOnlineAgents.push(agentName);
			}
			//then check if there are some missing values either in current or past agent list
			var missing = missingValues(tmpOnlineAgents, currentlyOnlineAgents);
			
			//no change since last check
			if(!missing.isTrue){
				log("ok", "AGENTCHECK");
			}
			//something happend since last check
			else{
				log("change...", "AGENTCHECK");

                var mailMsg = '[' + getNow() + ']' + ' Workbench Agent Check:\n';

				//an running agent (last check) gone OFFLINE (not in currentlyOnlineAgents, but in tmpOnlineAgents)
				if (missing.array1.length>0){
//					log("\n\n--- agents gone: " + missing.array1.toString() + " ---\n","AGENTCHECK ERROR");
                    log({msg: "\n\n--- agents gone: " + missing.array1.toString() + " ---\n", mail: false}, "AGENTCHECK ERROR");
                    mailMsg += '\n--- agents gone: ---\n' + missing.array1.join('\n') + '\n--------------------\n';
				}
				//a NEW agent found (not in tmpOnlineAgents, but in currentlyOnlineAgents)
				if (missing.array2.length>0){
//					log("\n\n+++ new agents: " + missing.array2.toString() + " +++\n","AGENTCHECK");
                    log({msg: "\n\n+++ new agents: " + missing.array2.toString() + " +++\n", mail: false}, "AGENTCHECK");
                    mailMsg += '\n--- new agents:  ---\n' + missing.array2.join('\n') + '\n--------------------\n';
				}

                notifyAdmin(mailMsg);
			}
			
			tmpOnlineAgents = currentlyOnlineAgents;
			
		} else{
			
			if (tmpOnlineAgents != null){
				//there were agents, but all are gone offline
//				log("no agents found: maybe your java agent executor crashed","AGENTCHECK ERROR");
                log({msg: "no agents found: maybe your java agent executor crashed", mail: false}, "AGENTCHECK ERROR");
				tmpOnlineAgents = null;
                var mailMsg = '[' + getNow() + ']' + ' Workbench Agent Check:\n\nAll agents gone!';
                notifyAdmin(mailMsg);
			} else if (notifyEmpty) {
				//first check no tuples found
//				log("no agents found... start them via Executor", "AGENTCHECK");
                log({msg: "no agents found... start them via Executor", mail: false}, "AGENTCHECK");
                var mailMsg = '[' + getNow() + ']' + ' Workbench Agent Check:\n\nNo agents found during initial check - maybe you want to start them!';
                notifyAdmin(mailMsg);
			}
			
		}
		
		if(callback != null){
			callback();
		}

        if (notifyEmpty) {
            notifyEmpty = false; // after first check, this should be false
        }
		
	});
	
}
//init check
function startAgentMonitoring(){
	console.log("starting agent monitoring...");

    // the moment we switch monitoring on, we should notify even we don't find anything
    notifyEmpty = true;
	
	//execute once and start checking in defined interval
	checkAgents(function(){
		agentCheckTimer = setInterval(
				function(){
					checkAgents(); //<- setInterval needs an anonymous function
				}, 
				agentCheckRate
		);
		console.log("...done");	
	});	
	ifAgentCheck = true;
}

//stop check
function stopAgentMonitoring(){
	if(agentCheckTimer != null){
		clearInterval(agentCheckTimer);
		agentCheckTimer = null;
	}
	ifAgentCheck = false;
}

// tuplespace call
function getOnlineAgents(callback){
	
	checkTS(function(){
		//agent tuple template
		var agentTemplate = new TS.Tuple([
		                                  TS.createActualField('string', 'AgentDescription'),
		                                  TS.createFormalField('string')
		                                  ]);
		//get all agent tuples
		try{
			ts.readAll(
					agentTemplate, 
					function(agentTuples){
						callback(agentTuples);
					}
			);				
		}catch(e){
			console.log("...failed: " + e);
			callback();
		}
		
	});
	
}	

/////////////////////////////////////
///////// 6. logging ////////////////
/////////////////////////////////////

var msgBuffer = [];
//custom logging 
function log(msg, tag){

    var mail = false;
    var errorMails = true;

    if (!(typeof msg == "string")) {
        if (msg.mail === true) {
            mail = true;
        } else if (msg.mail === false) {
            errorMails = false;
        }
        msg = msg.msg;
    }
	
	//build new msg string
	//mag = "\n" + msg;
	
	if (tag){
		var time = new Date();
		msg = "[" + getNow() + "]" + "[" + tag + "]: " + msg;
	}

	// in case of workflow execution Interface, stop logging at same time
	if (logPause){
		msgBuffer.push(msg);
	}else{
		if (msgBuffer && msgBuffer.length > 0){
			while (msgBuffer.length > 0){
				log(msgBuffer[0]);
				msgBuffer.shift();
			}
			log(msg);
		}else{
			log(msg);
		}
	}
	
	//append msg to loggers (console/disk/mail)
	function log(msg){
		//console output
		if(msg.indexOf("###")!=-1){
			console.log(msg.magenta);
		}
		else if(msg.indexOf("ERROR")!=-1){
			console.log(msg.red);
			if (msg.indexOf("MAIL") == -1 && errorMails){
				notifyAdmin(msg);				
			}
		}
		else if(msg.indexOf("SUCCESS")!=-1){
			console.log(msg.green);
		}
		else{
			console.log(msg);			
		}
		//file output
		if(ifLogFile){
			try{
				msg+="\n"; //somehow 2 line cmds needed to make one
				FS.appendFile('log.txt', msg, function (err) {
					if (err) throw err;
				});			
			}
			catch(err){
				ifLogFile=false;
				log("\n\ncould not write log file: \n" + err + "\n\n", "FILE ERROR");
			}
		}
        // mail output
        if(mail){
            notifyAdmin(msg);
        }
	}
	
}


//notify admin (i.e. agent offline)
function notifyAdmin(msg){
	if(ifMailNotification){
		try{
			var x = "notifying admin/s (" + mailOptions.to + ")...";
			log(x,"MAIL");

			var smtpTransport = Mailer.createTransport("SMTP", smtpOptions);

			mailOptions.text = msg;
			msg = msg.replace("\n","<br />");
			mailOptions.html =  "<p>"+msg+"</p>";

			// send mail with defined transport object
			smtpTransport.sendMail(mailOptions, function(error, response){
				if(error){
					log(error, "MAIL ERROR");
				}else{
					log("...sent: \"" + response.message +"\"","MAIL");
				}

				smtpTransport.close();
			});
		}catch(e){
			log("...could not send: check your mail settings","MAIL ERROR");
		}
	}
}

/////////////////////////////////////
////////// 7. helpers ///////////////
/////////////////////////////////////

/**
 * comparison of 2 Arrays: returns missing values in relation to each other 
 * @param {Array} inArray1
 * @param {Array} inArray2
 * @returns {Object} result = {array1: [missingValues], array2: [missingValues]} 
 */
function missingValues(inArray1, inArray2){
	//params must not be null
	var missing = {
			array1:[],
			array2:[],
			isTrue:false
	};
	
	if (inArray1 != null && inArray2 !=null){
		//if they have same length: return
		if (inArray1.length == inArray2.length){
			return missing;
		}
		//else find the values
		else{
			
			missing.isTrue = true;
			missing.array1 = checkArray(inArray1, inArray2);
			missing.array2 = checkArray(inArray2, inArray1);
			
			function checkArray(array1,array2){
				var notIncluded = [];
				for (var x = 0; x < array1.length; x++)
				{
					//element is not included
					if(array2.indexOf(array1[x]) == -1){
						notIncluded.push(array1[x]);
					}
				}
				return notIncluded;
			}
			return missing;
		}
	}
	else{
		return missing;
	}
}

//used for custom timestamp
function getNow() {
	
	function normalizeNumber(number) {
		if (number < 10) {
			return "0" + number;
		} else {
			return "" + number;
		}
	}
	
	var now = Moment();
	var dateInfo = "";
	dateInfo += normalizeNumber(now.year()) + "-";
	dateInfo += normalizeNumber(now.month()+1) + "-";
	dateInfo += normalizeNumber(now.date()) + " ";
	dateInfo += normalizeNumber(now.hours()) + ":";
	dateInfo += normalizeNumber(now.minutes());
	
	return dateInfo;
}

//Date -> Moment
function parseDate(inDate) {
	return Moment(inDate);
}

function ID(){
	return UUID.v4();
}

function tryCallback(callback){
	if(callback!=null){
		callback();				
	}
}

/////////////////////////////////////
//////// 8. console gui /////////////
/////////////////////////////////////

//console comands
var logPause = false;
var rl = RL.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Eventlistener for console commands
rl.on('line', function (cmd) {
	switch (cmd){
		case "start":{
			start();
			break;
		}
		case "exe":{
			exeDialog();
			break;
		}
		case "test":{
			testDialog();
			break;
		}
		case "startWebservice":{
			startWebservice();
			break;
		}
		case "stopWebservice":{
			stopWebservice();
			break;
		}
		case "startAgentMonitoring":{
			startAgentMonitoring();
			break;
		}
		case "stopAgentMonitoring":{
			stopAgentMonitoring();
			break;
		}
		case "show":{
			showRunning();
			break;
		}
		case "?":{
			showCommands();
			break;
		}
		case "help":{
			showCommands();
			break;
		}
		default:{
			console.log("");
			console.log("type \"?\" to see valid commands");	
			console.log("");
			break;
		}
	}
});

function showCommands(){
	console.log("");
	console.log("###### possible commands ######");
	console.log("");
	console.log("\"start\" - start program")
	console.log("");
	console.log("\"exe\" - execute workflow (multiple times)");
	console.log("\"test\" - multiple execution of a workflow with testing the equality of their result");
	console.log("\"show\" - show started executions");
	console.log("");
	console.log("\"startWebservice\" - starts the webservice");
	console.log("\"stopWebservice\" - stops the webservice");
	console.log("\"startAgentMonitoring\" - starts the TS monitoring");
	console.log("\"stopAgentMonitoring\" - stops the TS monitoring");
	console.log("");
	console.log("###############################");
	console.log("");
}

/**
 * User interaction for viewing running execution and possibly stopping them
 * called via "show"
 */
function showRunning(){
	
	logPause = true;
	console.log("");
	console.log("### manage runnings ###".magenta);
	console.log("");
	
	if(wfs && wfs.length>0){
		buildIF();
	}else{
		console.log("...no running workflows found.".red);
		quit();
	}
	
	function buildIF(){
		
		var table = new Table({
			head: ['index', 'name', 'id', 'executed in', 'repeated']
		, colWidths: [10, 15, 15, 15, 15]
		});
		
		for (var i = 0; i < wfs.length; i++){
			table.push(new Array(
					i+1,
					wfs[i].getName(), 	//name
					wfs[i].getId(), 	//id
					wfs[i].startIn(),	//next exe
					wfs[i].getRepeat()  //repeat
			));
		}
		console.log(table.toString());
		console.log("");
		
		//SELECT running
		rl.question('Kill a Running Execution by typing in its index or press enter to leave: ', function(answer) {
			try{
				var kill = wfs[answer-1];
				console.log("ok".green);
				kill.stop();
				console.log("");
				console.log(("...workflow " + kill.getName() + "(" + kill.getId() +")" + " stopped").bold);
				quit();	
			}catch(e){
				console.log("");
				console.log(("\"" + answer + "\" is not a valid index.").red);
				quit();
			}
		});
	}
	
	function quit(){
		console.log("");
		console.log("...quitted");
		console.log("");
		console.log("### monitoring ###".magenta);
		console.log("");
		logPause = false;
	}
	
}


function testDialog(){
	logPause = true;
	
	console.log("");
	console.log("### workflow testing ###".magenta);
	console.log("");
	
	getSavedWfTuples(function(tuples){
		if (tuples){
			buildIF(tuples);
		}else{
			console.log("...no saved tuples found.".red);
			quit();
		}		
	});
	
	function buildIF(tuples){
		
//		tuples = tuples.reverse(); //newest first
		
		var table = new Table({
			head: ['index', 'name', 'description', 'date']
		, colWidths: [10, 20, 20, 20]
		});
		
		for (var i = 0; i < tuples.length; i++){
			table.push(new Array(
					i+1,
					tuples[i].getField(2).getValue(), //name
					tuples[i].getField(3).getValue(), //descr
					tuples[i].getField(7).getValue()  //date
			));
		}
		console.log(table.toString());
		console.log("");
		
		//SELECT WF
		rl.question('Select a workflow by typing in its index: ', function(answer) {
			try{
				var tuple = tuples[answer-1];
				console.log("ok".green);
				console.log("");
				//SELECT START TIME
				var wfname = tuple.getField(2).getValue();
				console.log(("When do you wish to test workflow \"" + wfname + "\"?").italic);
				rl.question("Please enter a date (i.e. \"YYYY-MM-DD HH:mm\"): ", function(answer) {
					if(Moment(answer).isValid()){
						console.log("ok".green);
						console.log("");
						var exeDate = Moment(answer);
						var start;
						if(exeDate.isBefore(Moment(getNow()))){
							start = Moment.duration(0);
						}else{
							start = Moment.duration(exeDate.subtract(Moment(getNow())));							
						}
						console.log(("How often do you wish to repeat the test \"" + wfname + "\"?").italic);
						rl.question("Please enter an interval  (i.e. \"7 days\", \"1 weeks\", \"12 hours\"): ", function(answer) {
							try{
								splitted = answer.split(" ");
								console.log("");
								if(!splitted[0] || !splitted[1] || splitted[2]){
									throw new Error();
								}else{
									var rep = Moment.duration(Number(splitted[0]), splitted[1]);
									var params = {
										name: wfname,
                                        description: tuple.getField(3).getValue(),
										wiring: tuple.getField(4).getValue(),
										start: start.asMilliseconds(),
										repeat: rep.asMilliseconds(),
										test: true
									};
//									wfs.push(new Running(params));
                                    addRunning(new Running(params));
									console.log(("workflow will be tested in " + start.humanize() + "... and every " + answer + " since then...").bold);	
									quit();											
								}
							}catch(e){
								console.log(("\"" + answer + "\" is not a valid duration, consider duration format i.e. \"1 weeks\" and make sure there is a space between number and timespan...").red);
								quit();
							}
						});
					}
					else{
						console.log(("\"" + answer + "\" is not a valid date, consider date format i.e. 2012-11-09 14:00...").red);
						quit();
					}
				});
//				rl.write(getNow());
			}
			catch(e){
				console.log(("\"" + answer + "\" is not a valid id...").red);
				quit();
			}
		});		
	}
	
	function quit(){
		console.log("");
		console.log("...quitted");
		console.log("");
		console.log("### monitoring ###".magenta);
		console.log("");
		logPause = false;
	}
}

/**
 * create table with wirings
 */
function exeDialog(){
	logPause = true;
	
	console.log("");
	console.log("### workflow execution ###".magenta);
	console.log("");
	
	getSavedWfTuples(function(tuples){
		if (tuples){
			buildIF(tuples);
		}else{
			console.log("...no saved tuples found.".red);
			quit();
		}		
	});
	
	function buildIF(tuples){
		
//		tuples = tuples.reverse(); //newest first
		
		var table = new Table({
			head: ['index', 'name', 'description', 'date']
		, colWidths: [10, 20, 20, 20]
		});
		
		for (var i = 0; i < tuples.length; i++){
			table.push(new Array(
					i+1,
					tuples[i].getField(2).getValue(), //name
					tuples[i].getField(3).getValue(), //descr
					tuples[i].getField(7).getValue()  //date
			));
		}
		console.log(table.toString());
		console.log("");
		
		//SELECT WF
		rl.question('Select a workflow by typing in its index: ', function(answer) {
			try{
				var tuple = tuples[answer-1];
				console.log("ok".green);
				console.log("");
				//SELECT START TIME
				var wfname = tuple.getField(2).getValue();
				console.log(("When do you wish to execute workflow \"" + wfname + "\"?").italic);
				rl.question("Please enter a date (i.e. \"YYYY-MM-DD HH:mm\"): ", function(answer) {
					if(Moment(answer).isValid()){
						console.log("ok".green);
						console.log("");
						var exeDate = Moment(answer);
						var start;
						if(exeDate.isBefore(Moment(getNow()))){
							start = Moment.duration(0);
						}else{
							start = Moment.duration(exeDate.subtract(Moment(getNow())));							
						}
						//SELECT REPITITION
						console.log("Do you want to repeat the execution?".italic);
						rl.question("type in \"y\" oder press enter to skip: ", function(answer) {
							if (answer == "y"){
								console.log("ok".green);
								console.log("");
								rl.question("Please enter an interval  (i.e. \"7 days\", \"1 weeks\", \"12 hours\"): ", function(answer) {
									try{
										splitted = answer.split(" ");
										console.log("");
										if(!splitted[0] || !splitted[1] || splitted[2]){
											throw new Error();
										}else{
											var rep = Moment.duration(Number(splitted[0]), splitted[1]);
											var params = {
													name: wfname,
                                                    description: tuple.getField(3).getValue(),
													wiring: tuple.getField(4).getValue(),
													start: start.asMilliseconds(),
													repeat: rep.asMilliseconds()
											};
//											wfs.push(new Running(params));
                                            addRunning(new Running(params));
											console.log(("workflow will be executed in " + start.humanize() + "... and every " + answer + " since then...").bold);	
											quit();											
										}
									}catch(e){
										console.log(("\"" + answer + "\" is not a valid duration, consider duration format i.e. \"1 weeks\" and make sure there is a space between number and timespan...").red);
										quit();
									}
								});
							}else{
								console.log("");
								var params = {
										name: wfname,
										wiring: tuple.getField(4).getValue(),
										start: start.asMilliseconds()
									};
//								wfs.push(new Running(params));
                                addRunning(new Running(params));
								console.log(("workflow will be exexcuted in " + start.humanize() + "...").bold);	
								quit();
							}
						});
					}
					else{
						console.log(("\"" + answer + "\" is not a valid date, consider date format i.e. 2012-11-09 14:00...").red);
						quit();
					}
				});
//				rl.write(getNow());
			}
			catch(e){
				console.log(("\"" + answer + "\" is not a valid id...").red);
				quit();
			}
		});		
	}
	
	function quit(){
		console.log("");
		console.log("...quitted");
		console.log("");
		console.log("### monitoring ###".magenta);
		console.log("");
		logPause = false;
	}
	
}

/////////////////////////////////////
///////// 9. tuplespace /////////////
/////////////////////////////////////

var ts = null;
function checkTS(callback){
	if(ts == null){
		//create connection
		var host = Cfg.workbenchConnectionConfig.host;
		var port = Cfg.workbenchConnectionConfig.port;
		var connectOptions = {host: host, port: port};
		ts = new TS.TupleSpace(connectOptions, function(){
			tryCallback(callback);
		});	
	}else{
		tryCallback(callback);
	}
}

function startTS(callback){
	//connect to SQL-Spaces (once)
	console.log("");
	console.log("### initialize workflowmanager ###".magenta);
	console.log("");
	console.log("establishing SQL-Spaces connection...");
	
	//countdown for connection
	var connectionTimer;
	function countdown(maxTime, errorMessage){
		//count
		var sec = 0;
		connectionTimer = setInterval(function(){
			if(sec > maxTime){
				clearInterval(connectionTimer);
				console.log(errorMessage)
			}else{
				console.log( ( sec += 1 ).toString() );		
			}
		}, 1000);
	}
	function stopCountdown(){
		clearInterval(connectionTimer);
	}
	countdown(10, "connecting to sql-spaces takes to long: check your tuplespace configs");
	
	checkTS(function(){
		stopCountdown();
		console.log("...connected\n");
		tryCallback(callback);
	});
}

function stopTS(callback){
	if (ts!=null){
		ts.disconnect();
		ts = null;
		tryCallback(callback);
	}else{
		tryCallback(callback);
	}
}

/**
 * gets all save tuples from Tuplespace and returns a filtered collection in a callback
 * @param callback filtered tuple collection (saves)
 */
function getSavedWfTuples(callback){
	checkTS(function(){
		
		// create template for the public wiring tuples
		var publicTemplate = new TS.Tuple([
		   TS.fString, // save-id
		   3,
		   TS.fString, // short name
		   TS.fString, // description
		   TS.fString, // wiring
		   TS.fString, // user name
		   TS.fString, // sharing info
		   TS.fString  // save date
		   ]);
		
		ts.readAll(publicTemplate, function(tuples){
			if(tuples){
				var filtered = [];
				for(var i = 0; i < tuples.length; i++){
					if (tuples[i].getField(2).getValue() != "autosave"){
						filtered.push(tuples[i]);
					}
				}
				callback(filtered);
			}else{
				callback(null);			
			}
		});
		
	}); 
}

/////////////////////////////////////
/////////// 10. web /////////////////
/////////////////////////////////////

/**
 * function access via webservice
 */
var app = null;
var server = null;

function startWebservice(callback){
	if (app == null){
		app = Express();		
		app.configure(function () {
		  app.set('port', process.env.PORT || portnumber);
		  app.use(Express.bodyParser());
		  app.use(Express.methodOverride());
		});
		
		server = Http.createServer(app).listen(app.get('port'));
		
		initWebCommands(function(){
			tryCallback(callback);
		});

		log("webservice started on "+portnumber+"!","WEB");
		ifWebservice = true;
	}
}

function stopWebservice(callback){
	if ( app != null ) {
		try{
			server.close();
			server = null;
			app = null;
			log("webservice stopped!", "WEB")
			tryCallback(callback);
		}catch(e){
			log("couldnt close webservice, reason: "+e, "WEB");
			tryCallback(callback);
		}
		
		ifWebservice = false;		
	}
}

/**
 * function mapping and request processing
 */
function initWebCommands(callback){
	// on POST
	app.post('/execute', function (req, res) {
		
		log("new execution request incoming from client: "+getClientAddress(), "WEB");
		
		//wiring must be included, else send error
		if (req.body.wiring){
			
			if(checkPostRequest(req)){
				var name = "webexecution_" + ID();
				
				var callback = function(){
					var answer = "<h1>200</h1> triggered execution of: <br/><br/>"+req.body.wiring + "<br/>" +
					"<br/>for client: " + getClientAddress(req) + "<br/><br/>" +
					"...waiting for results...";
					res.send(200, answer);
					log("execution performed for "+getClientAddress(),"WEB");
				}
				
				//repitition? here if else
				new Running({ 
					name: name, 
					wiring: req.body.wiring, 
					callback: callback
				});
				
			}else{
				deny(req, res, "request check failed - check your wiring content and/or your credentials");
			}
			
		} else{
			deny(req, res, "no wiring found");
		}
	
	});
	// no GET
	app.get('*', function (req, res){
		deny(req, res, "this isn't possible");
	});
	
	tryCallback(callback);
	
}

function deny(req, res, msg){
	res.contentType('text/html');
	res.send(404, "<h1>404</h1><p>"+msg+"</p>")		
	log("request denied for " + getClientAddress(req) + " (reason: "+msg+")","WEB");
}

function checkPostRequest(req){
	if (!checkWiringString(req.body.wiring)){
		return false;
	}
	if(!checkAuthentification(req)){
		return false;
	}
	return true;
}

function checkWiringString(wiring){
	//TODO: remove code etc
	return true;
}

function checkAuthentification(req){
	//TODO: check permission to execute 
	return true;
}

function getClientAddress (req) {
   	var ip = null;
	try{
   		ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
   	}catch(e){
   		return "\"no IP adress found\"";
   	}
   	return ip;
};

/**
 * module for connection between admininterface and wfmanager/-executor
 */ 

module.exports = wfm = {
	
	start: function (config){
		
		start(config);
		
	},
		
	callbacks: {},
	
	exe: function(cmd, params, callback){
		var self = this;
		for (p in wfm){
			if (p == cmd){
				if (params != null){
					wfm[p].call(self, params, callback);					
				}else{
					wfm[p].call(self, callback);		
				}
				break;
			}
		}
	},	
	
	executeWf: function(params, callback){
		if(params.wiring != null && typeof params.wiring == "string"){
			new Running(params);
			callback(true);
		}else{
			callback(false);			
		}
	},

    sendTestMail: function(callback) {
        notifyAdmin('If you get this message, the mail settings of the workbench seem to be OK :-).');
        callback(true);
    },
	
	ifAgentMonitoring: function(callback){
		callback(ifAgentCheck);
	},
	
	setAgentMonitoring: function(params, callback){
		if (params.ifAgentCheck != null && typeof params.ifAgentCheck == "boolean"){
			ifAgentCheck = params.ifAgentCheck;
			callback(true);
		}else{
			callback(false);			
		}
	},
	
	startAgentMonitoring: function(callback){
		startAgentMonitoring();
		callback(true);
	},
	
	stopAgentMonitoring: function(callback){
		stopAgentMonitoring();
		callback(true);
	},
	
	setAgentCheckRate: function(params, callback){
		if (params.agentCheckRate != null && typeof params.agentCheckRate == "number"){
			agentCheckRate = params.agentCheckRate*1000;
			callback(true);
		}else{
			callback(false);			
		}
	},
	
	getAgentCheckRate: function(callback){
		callback(agentCheckRate/1000);
	},
	
	setMinRepititionTime: function(params, callback){
		if(params.minRepititionTime != null && typeof params.minRepititionTime == "number"){
			minRepititionTime = params.minRepititionTime*1000;
			callback(true);
		}else{
			callback(false);			
		}
	},
	
	getMinRepititionTime: function(callback){
		callback(minRepetitionTime/1000);
	},
	
	setLogFile: function(params, callback){
		if(params.ifLogFile != null && typeof params.ifLogFile == "boolean"){
			ifLogFile = params.ifLogFile;
			callback(true);
		}else{
			callback(false);
		}
	},
	
	ifLogFile: function(callback){
		callback(ifLogFile);
	},
	
	setMailNotification: function(params, callback){
		if(params.ifMailNotification != null && typeof params.ifMailNotification == "boolean"){
			ifMailNotification = params.ifMailNotification;
			callback(true);
		}else{
			callback(false);
		}
	},
	
	ifMailNotification: function(callback){
		callback(ifMailNotification);
	},

	setMailOptions: function(params, callback){
		if (params.from && typeof params.from == "string" 
			&& params.to != null && typeof params.from == "string" 
			&& params.subject != null && typeof params.from == "string" )
		{
			mailOptions.from = params.from;
			mailOptions.to = params.to;
			mailOptions.subject = params.subject;
			callback(true);
		}else{
			callback(false);
		}
	},
	
	getMailOptions: function(callback){
		callback(mailOptions);
	},
	
	setSmtpOptions: function(params, callback){
		if (params.service != null && typeof params.service == "string" 
			&& params.host != null && typeof params.host == "string" 
			&& params.port != null && typeof params.port == "number" 
			&& params.user != null && typeof params.user == "string"
			&& params.pass != null && typeof params.pass == "string")
		{
            var newSmtpOptions = {};
            if (params.service.trim().length > 0) {
                newSmtpOptions.service = params.service;
            } else {
                newSmtpOptions.host = params.host;
                newSmtpOptions.port = params.port;
            }
            newSmtpOptions.auth = { user: params.user, pass: params.pass };
            smtpOptions = newSmtpOptions;
//            console.log(">>>>> goto SMTP options update: " + JSON.stringify(smtpOptions));
//			smtpOptions.service = params.service;
//			smtpOptions.host = params.host;
//			smtpOptions.port = params.port;
//			smtpOptions.auth = { user: params.user, pass: params.pass };
			callback(true);
		}else{
			callback(false);
		}
	},
	
	getSmtpOptions: function(callback){
		callback(smtpOptions);
	},
	
	ifWebservice: function(callback){
		callback(ifWebservice);
	},
	
	setWebservice: function(params, callback){
		if (params.ifWebservice != null && typeof params.ifWebservice == "boolean"){
			ifWebservice = params.ifWebservice;
			callback(true);
		}else{
			callback(false);			
		}
	},
	
	startWebservice: function(callback){
		startWebservice();
		callback(true);
	},
	
	stopWebservice: function(callback){
		stopWebservice();
		callback(true);
	},
	
	setPortNumber: function(params, callback){
		if(params.portnumber != null && typeof params.portnumber == "number"){
			portnumber = params.portnumber;
			callback(true);
		}else{
			callback(false);			
		}
	},
	
	getPortNumber: function(callback){
		callback(portnumber);
	},

    getNow: function() {
        return getNow();
    },

    getRunning: function(callback) {
        var runningWfs = [];
        for (var i = 0; i < wfs.length; i++) {
            runningWfs.push({
                id: i,
                name: wfs[i].getName(),
                description: wfs[i].getDescription(),
                start: wfs[i].startIn(),
                repeat: wfs[i].getRepeat()
            });
        }
        callback(runningWfs);
    },

    stopRunning: function(params, callback) {
        wfs[params.id].stop();
        callback(true);
    },

    getAvailable: function(callback) {
        getSavedWfTuples(function(tuples){
            var savedWfs = [];
            for (var i = 0; i < tuples.length; i++) {
                var saveId = tuples[i].getField(0).getValue();
                var wfName = tuples[i].getField(2).getValue();
                var wfDesc = tuples[i].getField(3).getValue();
                var wfUser = tuples[i].getField(5).getValue();
                var wfDate = tuples[i].getField(7).getValue();
                var wfShowDate = wfDate.substr(0,4) + '-' + wfDate.substr(4,2) + '-' + wfDate.substr(6,2) + ' ' + wfDate.substr(8,2) + ':' + wfDate.substr(10,2);
                var wfWiring = tuples[i].getField(4).getValue();
                savedWfs.push({id: saveId, name: wfName, description: wfDesc, creator: wfUser, date: wfShowDate, wiring: wfWiring});
            }
            callback(savedWfs);
        });
    },

    startRunning: function(params, callback) {

        var exeDate = Moment(params.execution);
        var start;
        if(exeDate.isBefore(Moment(getNow()))){
            start = Moment.duration(0);
        }else{
            start = Moment.duration(exeDate.subtract(Moment(getNow())));
        }

        var rep = Moment.duration(Number(params.interval.number), params.interval.unit);

        var runParams = {
            name: params.name,
            description: params.description,
            wiring: params.wiring,
            start: start.asMilliseconds(),
            repeat: rep.asMilliseconds(),
            test: params.test
        };

//        wfs.push(new Running(runParams));
        addRunning(new Running(runParams));
        callback(true);
    }
	
}

