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
	if (data == null){
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

    var availableWorkflows = [];
    var activeWorkflows = [];

    $('#btn_ae_refreshActive').click(function() {
        fillOverviewTable();
    });

    $('#btn_ae_refreshAvailable').click(function() {
        fillSelectionTable();
    });

    $('#btn_ae_stopExecution').click(function() {
        $('#ae_stop_noselection').removeClass('hidden');
    });

    $('#btn_ae_stop_noselection').click(function() {
        $('#ae_stop_noselection').addClass('hidden');
    });

    $('#btn_ae_startExecution').click(function() {
        $('#ae_start_noselection').removeClass('hidden');
    });

    $('#btn_ae_start_noselection').click(function() {
        $('#ae_start_noselection').addClass('hidden');
    });

    function fillOverviewTable() {

        var emptyTable = "<thead><tr><th>Name</th><th>Description</th><th>Next execution</th><th>Repetition Interval</th></tr></thead><tbody></tbody>";
        $('#ae_overview_table').html(emptyTable);
        $('#ae_overview_empty').addClass('hidden');
        $('#ae_overview_loading').removeClass('hidden');

        wfm_req('getRunning', null, function(data) {

            while (activeWorkflows.length > 0) {
                activeWorkflows.pop();
            }

            for (var i = 0; i < data.length; i++) {
                activeWorkflows.push(data[i]);
            }

            if (activeWorkflows.length == 0) {
                $('#ae_overview_empty').removeClass('hidden');
            }

            var html = "<thead><tr><th>Name</th><th>Description</th><th>Next execution</th><th>Repetition Interval</th></tr></thead><tbody>";

            for (var i = 0; i < data.length; i++) {
                var wfName = data[i].name;
                if (wfName.length > 25) {
                    wfName = wfName.substr(0, 20).concat('...');
                }
                var wfDesc = data[i].description;
                if (wfDesc.length > 85) {
                    wfDesc = wfDesc.substr(0, 80).concat('...');
                }
                html += "<tr id='overview_table_" + data[i].id + "'>";
                html += "<td>" + wfName + "</td>";
                html += "<td>" + wfDesc + "</td>";
                html += "<td>" + data[i].start + "</td>";
                html += "<td>" + data[i].repeat + "</td>";
                html += "</tr>";
            }

            html += "</tbody>";

            $('#ae_overview_table').html(html);
            $('#ae_overview_table').tablesorter();

            for (var i = 0; i < data.length; i++) {
                $('#overview_table_' + data[i].id).click(data[i], showWorkflowOverviewDetails);
            }

            if (activeWorkflows.length == 0) {
                $('#ae_overview_empty').removeClass('hidden');
            }

            $('#ae_overview_loading').addClass('hidden');

            clearOverviewSelection();
        });
    }

    function fillSelectionTable(data) {

        var emptyTable = "<thead><tr><th>Name</th><th>Description</th><th>Creation date</th><th>Creator</th></tr></thead><tbody></tbody>";
        $('#ae_selection_table').html(emptyTable);
        $('#ae_selection_empty').addClass('hidden');
        $('#ae_selection_loading').removeClass('hidden');

        wfm_req('getAvailable', null, function(data) {
            availableWorkflows = data;
            var html = "<thead><tr><th>Name</th><th>Description</th><th>Creation date</th><th>Creator</th></tr></thead><tbody>";

            for (var i = 0; i < data.length; i++) {
                var wfName = data[i].name;
                if (wfName.length > 25) {
                    wfName = wfName.substr(0, 20).concat('...');
                }
                var wfDesc = data[i].description;
                if (wfDesc.length > 85) {
                    wfDesc = wfDesc.substr(0, 80).concat('...');
                }
                html += "<tr id='add_table_"  + data[i].id + "'>";
                html += "<td>" + wfName + "</td>";
                html += "<td>" + wfDesc + "</td>";
                html += "<td>" + data[i].date + "</td>";
                html += "<td>" + data[i].creator + "</td>";
                html += "</tr>";
            }

            html += "</tbody>";

            $('#ae_add_table').html(html);
            $('#ae_add_table').tablesorter();

            for (var i = 0; i < data.length; i++) {
                $('#add_table_' + data[i].id).click(data[i], showWorkflowAddDetails);
            }

            if (data.length == 0) {
                $('#ae_selection_empty').removeClass('hidden');
            }

            $('#ae_selection_loading').addClass('hidden');

            clearAddSelection();
        });
    }

    function showWorkflowOverviewDetails(event) {
        // hide the "no workflow selected" warning (if it is visible)
        $('#ae_stop_noselection').addClass('hidden');
        // display information about the workflow
        $('#ae_display_wf_name').html(event.data.name);
        $('#ae_display_wf_description').html(event.data.description);
        $('#ae_display_wf_time').html(event.data.start);
        $('#ae_display_wf_interval').html(event.data.repeat);
        // remove old button handler for the stop button
        $('#btn_ae_stopExecution').unbind( "click" );
        // add new button handler for the stop button
        $('#btn_ae_stopExecution').click({id: event.data.id}, function(event) {
            var params = {id: event.data.id};
            clearOverviewSelection();
            wfm_req('stopRunning', params, function(data) {
//                console.log('received callback with ' + JSON.stringify(data));
                fillOverviewTable();
            });
        });
    }

    function showWorkflowAddDetails(event) {
        // hide the "no workflow selected" warning (if it is visible)
        $('#ae_start_noselection').addClass('hidden');
        // display information about the workflow
        $('#ae_add_wf_name').html(event.data.name);
        $('#ae_add_wf_description').html(event.data.description);
//        $('#ae_display_wf_time').html(event.data.execution);
//        $('#ae_display_wf_interval').html(event.data.interval);
        // remove old button handler for the stop button
        $('#btn_ae_startExecution').unbind( "click" );
        // add new button handler for the stop button
        $('#btn_ae_startExecution').click({id: event.data.id}, function(event) {
            var wiring = null;
            var name = "";
            var description = "";
            for (var i = 0; (wiring == null && i < availableWorkflows.length); i++) {
                if (availableWorkflows[i].id === event.data.id) {
                    wiring = availableWorkflows[i].wiring;
                    name = availableWorkflows[i].name;
                    description = availableWorkflows[i].description;
                }
            }
            var execution = $('#ae_add_wf_time').val();
            var interval = { number: $('#ae_add_wf_interval_selection').val(), unit: $('#ae_add_wf_interval').val() };
            var test = $('#ae_add_test').is(':checked');
            var params = {id: event.data.id, wiring: wiring, name: name, description: description, execution: execution, interval: interval, test: test};
            clearAddSelection();
            wfm_req('startRunning', params, function(data) {
//                console.log('received callback with ' + JSON.stringify(data));
                fillOverviewTable();
            });
        });
    }

    function clearOverviewSelection() {
        // display information about the workflow
        $('#ae_display_wf_name').html('');
        $('#ae_display_wf_description').html('');
        $('#ae_display_wf_time').html('');
        $('#ae_display_wf_interval').html('');
        // remove old button handler for the stop button
        $('#btn_ae_stopExecution').unbind( "click" );
        // add new button handler which tells you that nothing is selected
        $('#btn_ae_stopExecution').click(function() {
            $('#ae_stop_noselection').removeClass('hidden');
        });
    }

    function clearAddSelection() {
        // remove information about the workflow
        $('#ae_add_wf_name').html('');
        $('#ae_add_wf_description').html('');
        // remove old button handler for the stop button
        $('#btn_ae_startExecution').unbind( "click" );
        // add new button handler which tells you that nothing is selected
        $('#btn_ae_startExecution').click(function() {
            $('#ae_start_noselection').removeClass('hidden');
        });
    }

}//end startadministration()