/**
 * 
 * ADMIN GUI
 * 
 * Table of Contents:
 * 1. socket 		- connection stuff
 * 2. user options	- gui functions for editing of user in Tuplespace
 * 3. wfm option	- gui functions for editing of workflow manager options
 * 
 * 
 */



////////////////////////////////////////////////
////////////// 1. socket ///////////////////////    
////////////////////////////////////////////////

var socket = io.connect();

function initSocket(){
	
	socket.on('logout_ack', function (data) {
		window.open('/', '_self');
    });

	socket.on('response', function (response) {
        var cbObject = callbacks[response.reqid];
        cbObject.callback.call(cbObject.scope, response.data);
        delete(callbacks[response.reqid]);
    });
}

var callbacks = {};

function sendRequest (command, data, callback) {
	var reqid = new Date().getTime() * Math.random(); //Math random, because time alone can be too slow.. 
	var cbObject = { scope: this, callback: callback };
	callbacks[reqid] = cbObject;
	socket.emit('request', { id: reqid, command: command, data: data });
}

function req(command, params, callback){
	var data = params;
	if (data = null){
		data = {};
	}
	sendRequest(command, data, callback);
}

function wfm_req(command, params, callback){
	var data =  { cmd:command, params:params };
	sendRequest("wfm_exe", data, callback);
}


function startAdministration() {
	
	initSocket(); //init socket events

	req("if_wfm", null, function(response){
		if (response == true){
			initWfmOptions();
		}
	});
	

	//---x---//
	
	socket.on('admin_loadedInitData_users', function (config) {
        $('#spinUser').spin(false);
        fillMenuSelectForms(config.data);
    });

    socket.on('admin_loadedInitData_groups', function (config) {
        $('#spinGroups').spin(false);
        fillMenuSelectForms(config.data);
    });
    socket.on('admin_loadedInitData_roles', function (config) {
        $('#spinRoles2').spin(false);
        fillMenuSelectForms(config.data);
    });
    socket.on('admin_userInfosLoaded', function (infos) {
        setSpinnersAndBoxes(false, null);
        setButtonStates(true);
        fillUserDetails(infos.data);
    });
    socket.on('admin_userBasicInfoLoaded', function (infos) {
       if(infos!=null&&infos.data!=null&&infos.data.result){
        $('#mu_userName').val(infos.data.result.userName);
        $('#mu_inputEmail').val(infos.data.result.userEmail);
        $('#modifyUserDiag'). modal('show');
       }
    });
    socket.on('admin_userCreated', function (result) {
        userCreated(result);
    });
    socket.on('admin_userModified', function (result) {
        userModified(result);
    });
    socket.on('admin_userDeleted', function (result) {
        userDeleted(result);
    });
    socket.on('admin_groupsDeleted', function (result) {
        groupsDeleted(result);
    });
    socket.on('admin_groupCreated', function (result) {
        groupCreated(result);
    });
    socket.on('admin_userDetailsSaved', function (result) {

        if (result.data.ok) {
            setButtonStates(false);
            setSpinnersAndBoxes(true, false);
            socket.emit('request', {command: "admin_getGroups"});
            socket.emit('request', {command: "admin_getUserInfo", data: {userId: $('#menu_select_users').val()}});
        }
        else {
            //TODO
        }
    });
	
	//---x---//
	
    ////////////////////////////////////////////////
    ////////////// WFM Options /////////////////////    
    ////////////////////////////////////////////////
        
    function initWfmOptions(){
    	
    $("#wfmOptions").show();
    
    /**
     * Agent Check
     */
    
    function startAgentMonitoring(){
    	wfm_req("startAgentMonitoring", null, function(response){
			showResponse( "wfm_input_ifAgentCheck", response );
		});
	}
    function stopAgentMonitoring(){
    	wfm_req("stopAgentMonitoring", null, function(response){
			showResponse("wfm_input_ifAgentCheck", response);
		});
	}
    
    function ifAgentMonitoring(){
    	wfm_req("ifAgentMonitoring", null, function(ok){
    		if (ok){
    			showAgentMonitoringParams(true);
    			$("#wfm_input_ifAgentCheck").prop("checked", true);
    		}else{
    			showAgentMonitoringParams(false);
    			$("#wfm_input_ifAgentCheck").prop("checked", false);
    		}
    	});
    }
   
    ifAgentMonitoring();//onload
    
    $('#wfm_input_ifAgentCheck').change(function () {
    	if($("#wfm_input_ifAgentCheck").prop('checked') == true){
    		startAgentMonitoring();
    		showAgentMonitoringParams(true);
    	}else{
    		stopAgentMonitoring();
    		showAgentMonitoringParams(false);
    	}
	});
    
    function showAgentMonitoringParams(bool){
    	if(bool){
    		$("#wfm_agentCheckParams").show();
    		getAgentCheckRate();
    		getMinRepInterval();
    	}else{
    		$("#wfm_agentCheckParams").hide();
    	}
    }
    
  
    
    //check rate
    
    function getAgentCheckRate(){
    	wfm_req("getAgentCheckRate", null, function(number){
			if(number){
				$("#wfm_input_changeAgentCheckRate").val(number);
			}
		});
    }   
    
    function setAgentCheckRate(){
    	var value = Number($("#wfm_input_changeAgentCheckRate").val());
		wfm_req("setAgentCheckRate",{agentCheckRate: value}, function(response){
			showResponse("wfm_input_changeAgentCheckRate",response);
			getAgentCheckRate();
    	});
    }
    
    $("#wfm_btn_changeAgentCheckRate").click(function(){
    	setAgentCheckRate();
    });
    
    //min exe time
    
    function getMinRepInterval(){
    	wfm_req("getMinRepititionTime", null, function(number){
			if(number){
				$("#wfm_input_changeMinRepititionInterval").val(number);
			}
		});
    }
    
    function setMinRepInterval(){
    	var value = Number($("#wfm_input_changeMinRepititionInterval").val());
    	wfm_req("setMinRepititionTime",{minRepititionTime: value}, function(response){
			showResponse("wfm_input_changeMinRepititionInterval",response);
			getMinRepInterval();
		});
    }
    
    $("#wfm_btn_changeMinRepititionInterval").click(function(){
    	setMinRepInterval();
    });
    
    /**
     * Logging
     */
    
    //logfile
    
    function ifLogfile(){
    	wfm_req("ifLogFile", null, function(ok){
    		if(ok){
    			$("#wfm_input_ifLogfile").prop("checked", true);
    		}else{
    			$("#wfm_input_ifLogfile").prop("checked", false);
    		}
    	});
    }
    
    ifLogfile();
    
    function setLogFile(bool){
    	wfm_req("setLogFile", {ifLogFile:bool},function(response){
    		ifLogfile();
    		showResponse("wfm_input_ifLogfile",response);
    	});
    }
    
    $('#wfm_input_ifLogfile').change(function () {
    	if($("#wfm_input_ifLogfile").prop('checked') == true){
    		setLogFile(true);
    	}else{
    		setLogFile(false);
    	}
	});
    
    //mail
    
    function ifMailNotification(){
    	wfm_req("ifMailNotification", null, function(ok){
    		if(ok){
    			$("#wfm_input_ifMail").prop("checked", true);
    			initMail();
    			$("#mailOpts").show();
    		}else{
    			$("#wfm_input_ifMail").prop("checked", false);
    			$("#mailOpts").hide();
    		}
    	});
    }
    
    ifMailNotification();
    
    function setMailNotification(bool){
    	wfm_req("setMailNotification", {ifMailNotification: bool}, function(response){
    		showResponse("wfm_input_ifMail",response);
    	})
    }
    
    $('#wfm_input_ifMail').change(function () {
    	if($("#wfm_input_ifMail").prop('checked') == true){
    		setMailNotification(true);
    		initMail();
    		$("#mailOpts").show();
    	}else{
    		setMailNotification(false);
    		$("#mailOpts").hide();
    	}
	});
    
    /**
     * mail options 
     */
    
    function initMail(){
    	getMailOpts();
    	getSMTPOpts();
    }
    
    function getMailOpts(){
    	wfm_req("getMailOptions", null, function(response){
    		if(response){
    			$("#wfm_input_mailSender").val(response.from);
    			$("#wfm_input_mailReceivers").val(response.to);
    			$("#wfm_input_mailSubject").val(response.subject);
    		}
    	});
    }
    
    function getSMTPOpts(){
    	wfm_req("getSmtpOptions", null, function(response){
    		if(response){
    			$("#wfm_input_smtpService").val(response.service);
    			$("#wfm_input_smtpHost").val(response.host);
    			$("#wfm_input_smtpPort").val(response.port);
    			$("#wfm_input_smtpUserName").val(response.auth.user);
    			$("#wfm_input_smtpUserPassword").val(response.auth.pass);
    		}
    	});
    }
   
    function setMailOpts(){
    	var params = {
    			from: $("#wfm_input_mailSender").val(),
    			to: $("#wfm_input_mailReceivers").val(),
    			subject: $("#wfm_input_mailSubject").val()
    	}
    	wfm_req("setMailOptions", params, function(response){
    		showResponse("wfm_btn_saveMailOpts",response);
    		getMailOpts();
    	});
    }
    
    $("#wfm_btn_saveMailOpts").click(function(){
    	setMailOpts();
    });
    
    function setSmtpOpts(){
    	var params = {
    			service: $("#wfm_input_smtpService").val(),
    			host: $("#wfm_input_smtpHost").val(),
    			port: Number($("#wfm_input_smtpPort").val()),
    			user: $("#wfm_input_smtpUserName").val(),
    			pass: $("#wfm_input_smtpUserPassword").val()
    	}
    	wfm_req("setSmtpOptions", params, function(response){
    		showResponse("wfm_btn_saveSmtpOpts",response);
    		getSMTPOpts();
    	});
    }

    $("#wfm_btn_saveSmtpOpts").click(function(){
    	setSmtpOpts();
    });

    function sendTestMail(){
        wfm_req("sendTestMail", null, function(response){
            showResponse("wfm_btn_sendTestMail",response);
        });
    }

    $("#wfm_btn_sendTestMail").click(function(){
        sendTestMail();
    });

    /**
     * Webservice
     */
    
    function ifWebservice(){
    	wfm_req("ifWebservice", null, function(response){
    		if(response == true){
    			$("#wfm_btn_exeWS").prop("disabled", false);
    			$("#wfm_webserviceOn").show();
    			$("#wfm_webserviceOff").hide();
    		}else{
    			$("#wfm_btn_exeWS").prop("disabled", true);
    			$("#wfm_webserviceOn").hide();
    			$("#wfm_webserviceOff").show();
    		}
    	});
    }
    
    ifWebservice();
    
    function startWebservice(){
    	wfm_req("startWebservice", null, function(response){
    		showResponse("wfm_webserviceOff",response);
    		ifWebservice();
    	});
    }
    
    $("#wfm_webserviceOff").click(function(){
    	startWebservice();
    });
    
    function stopWebservice(){
    	wfm_req("stopWebservice", null, function(response){
    		showResponse("wfm_webserviceOn",response);
    		ifWebservice();
    	});
    }
    
    $("#wfm_webserviceOn").click(function(){
    	stopWebservice();
    });

    function getPortNumber(){
    	wfm_req("getPortNumber", null, function(number){
    		if(number){
    			$("#wfm_input_webservicePortnumber").val(number);    			
    		}
        });
    }
    
    getPortNumber();
    
    function setPortNumber(){
    	var value = Number($("#wfm_input_webservicePortnumber").val());
    	wfm_req("setPortNumber", {portnumber: value}, function(response){
    		getPortNumber();
    		showResponse("wfm_btn_changeWebservicePortnumber",response);
    		stopWebservice();
    	});
    }
    
    $("#wfm_btn_changeWebservicePortnumber").click(function(){
    	setPortNumber();
    });
    
    /**
     * Execution
     */
    /*
    function executeWf(){
    	var wiring = $("#wfm_input_wiring").val();
		req("executeWf", {wiring: wiring}, function(response){
			if (response == true){
				$("#wfm_input_wiring").val("");
			}
			showResponse(response);
		});
    }
    
    $("#wfm_btn_exeSocket").click(function(){
    	executeWf();
    });*/
    
    
    function showResponse(value){
    	if(value == true){
    		$("#responseDialog").css("background", "green");
    		show();
    	}
    	if(value == false){
    		$("#responseDialog").css("background", "red");
    		show();
    	}
    	function show(){
    		$("#responseDialog").fadeIn(100,function(){
    			$("#responseDialog").fadeOut(400);
    		});
    	}
    }
    
    function showResponse(elementId, value){
    	var selector = "#" + elementId;
    	var el = $(selector).parent().parent();
    	if(value == true){
    		el.addClass("green");
    		blink();
    	}
    	if(value == false){
    		el.addClass("red");
    		blink();
    	}
    	function blink(){
    		el.hide();
			el.fadeIn(1000, function(){
				el.removeClass("green");
				el.removeClass("red");
			});
    	}
    }
    
    }//end init wfm
    
}//end startadministration()