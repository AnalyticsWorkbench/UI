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

function startAdministration() {
	
	initSocket(); //init socket events

    var explicitWorkflows = [];
    var implicitWorkflows = [];

    var explicitSelectAll = false;
    var implicitSelectAll = false;

    $('#btn_sw_refreshExplicit').click(function() {
        fillTable('explicit');
    });

    $('#btn_sw_refreshImplicit').click(function() {
        fillTable('implicit');
    });

    $('#sw_explicit_btn_select').click(function(){
        toggleSelection('explicit');
    });

    $('#sw_explicit_btn_delete').click(function(){
        deleteSelected('explicit');
    });

    $('#sw_implicit_btn_select').click(function(){
        toggleSelection('implicit');
    });

    $('#sw_implicit_btn_delete').click(function(){
        deleteSelected('implicit');
    });

    function fillTable(table) {

        var tableStart = "<thead><tr><th>Select</th><th>Name</th><th>Description</th><th>Creation date</th><th>Creator</th><th>Edit</th><th>Delete</th></tr></thead><tbody>";
        var tableEnd = "</tbody>";

        var loadingElement;
        var emptyElement;
        var tableElement;

        var params = { selection: 'none' };
        var localTable = [];
        if (table == 'explicit') {
            loadingElement = $('#sw_explicit_loading');
            emptyElement = $('#sw_explicit_empty');
            tableElement = $('#sw_explicit_table');

            params['selection'] = 'explicit';
            localTable = explicitWorkflows;
        } else if (table == 'implicit') {
            emptyElement = $('#sw_implicit_empty');
            loadingElement = $('#sw_implicit_loading');
            tableElement = $('#sw_implicit_table');

            params['selection'] = 'implicit';
            localTable = implicitWorkflows;
        }

        tableElement.html(tableStart + tableEnd);
        emptyElement.addClass('hidden');
        loadingElement.removeClass('hidden');

        req('admin_getWorkflows', params, function(data){

            while(localTable.length > 0) {
                localTable.pop();
            }

            for (var i = 0; i < data.length; i++) {
                localTable.push(data[i]);
            }

            var html = tableStart;

            for (var i = 0; i < data.length; i++) {
                var value = {
                    id: data[i].id,
                    name: data[i].name,
                    user: data[i].user
                };
                var wfName = data[i].name;
                if (wfName.length > 25) {
                    wfName = wfName.substr(0, 20).concat('...');
                }
                var wfDesc = data[i].description;
                if (wfDesc.length > 85) {
                    wfDesc = wfDesc.substr(0, 80).concat('...');
                }
                html += "<tr id='sw_" + table + "_table_" + data[i].id + "'>";
                html += "<td><input type='checkbox' id='sw_checkbox_" + data[i].id + "' value='" + data[i].id + "'></td>";
//                html += "<td><input type='checkbox' value='" + data[i].id + "'></td>";
                html += "<td>" + wfName + "</td>";
                html += "<td>" + wfDesc + "</td>";
                html += "<td>" + formatDate(data[i].date) + "</td>";
                html += "<td>" + data[i].user + "</td>";
                html += "<td><a id='sw_edit_" + data[i].id + "'><span class='glyphicon glyphicon-edit'></span></a></td>";
                html += "<td><a id='sw_delete_" + data[i].id + "'><span class='glyphicon glyphicon-trash'></span></a></td>";
                html += "</tr>";
            }

            html += tableEnd;

            tableElement.html(html);
            tableElement.tablesorter();

            for (var i = 0; i < data.length; i++) {
//                $('#overview_table_' + data[i].id).click(data[i], showWorkflowOverviewDetails);
//                $('#sw_checkbox_' + data[i].id).click(data[i], selectWf);
//                $('#sw_checkbox_' + data[i].id).val(data[i]);
                $('#sw_edit_' + data[i].id).click(data[i], editWf);
                $('#sw_delete_' + data[i].id).click({deleteWfs: [data[i]], table: table}, deleteWfs);
            }

            if (localTable.length == 0) {
                emptyElement.removeClass('hidden');
            }

            loadingElement.addClass('hidden');

        });
    }

    function selectWf(event) {
        console.log("select workflow " + event.data.id);
    }

    function editWf(event) {
//        console.log("edit workflow " + event.data.id);
        $('#sw_modal_edit').modal('show');
    }

    function deleteWfs(event) {
        var ids = [];
        var html = "";
        // collect ids for deletion
        var deleteWfs = event.data.deleteWfs;
        for (var i = 0; i < deleteWfs.length; i++) {
            ids.push(deleteWfs[i].id);
        }
        // build dialog
        if (deleteWfs.length > 5) {
            html += '<p>Do you really want to delete the ' + deleteWfs.length + ' selected workflows?</p>'
        } else {
            if (deleteWfs.length > 1) {
                html += '<p>Do you really want to delete the following workflows?</p>';
            } else {
                html += '<p>Do you really want to delete the following workflow?</p>';
            }
            html += '<ul>';
            for (var i = 0; i < deleteWfs.length; i++) {
                html += '<li>"' + deleteWfs[i].name + '" by ' + deleteWfs[i].user + '</li>';
            }
            html += '</ul>';
        }

        $('#sw_modal_delete_workflows').html(html);
        $('#sw_modal_delete_btn').unbind("click");
        $('#sw_modal_delete_btn').click({ids: ids, table: event.data.table}, deleteWfsFromServer);
        $('#sw_modal_delete').modal('show');

        function deleteWfsFromServer(event) {
            $('#sw_modal_delete').modal('hide');
            req('admin_deleteWorkflows', event.data.ids, function(){
                fillTable(event.data.table);
            });
        }
    }

    function deleteSelected(table) {
        var selectedWfs = [];
        var checked;
        var wfTable = [];
        if (table == 'explicit') {
            wfTable = explicitWorkflows;
            checked = $('#sw_explicit_table').find('input:checked');
        } else if (table == 'implicit') {
            wfTable = implicitWorkflows;
            checked = $('#sw_implicit_table').find('input:checked');
        }
        checked.each(function(i, checkbox){
            for (var i = 0; i < wfTable.length; i++) {
                var currentWf = wfTable[i];
                if (currentWf.id == $(checkbox).val()) {
                    selectedWfs.push(currentWf);
                }
            }
        });

        deleteWfs({data: { deleteWfs: selectedWfs, table: table }});
    }

    function toggleSelection(table) {
        var tableElement;
        var newState;
        if (table == 'explicit') {
            tableElement = $('#sw_explicit_table');
            newState = !explicitSelectAll;
            explicitSelectAll = newState;
        } else {
            tableElement = $('#sw_implicit_table');
            newState = !implicitSelectAll;
            implicitSelectAll = newState;
        }
        tableElement.find(':checkbox').each(function(i, checkbox){
            $(checkbox).prop('checked',newState);
        });
    }

    function formatDate(date) {
        var year = date.substr(0, 4);
        var month = date.substr(4,2);
        var day = date.substr(6,2);
        var hour = date.substr(8,2);
        var minute = date.substr(10,2);
        var second = date.substr(12,2);
        return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
    }

    // initially fill the tables
    fillTable('explicit');
    fillTable('implicit');

}//end startAdministration()