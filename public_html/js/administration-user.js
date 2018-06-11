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
    ///////////// 2. User Options //////////////////    
    ////////////////////////////////////////////////
	
	
    var optsSelect = {lines: 9, length: 5, width: 3, radius: 3, top: 4, left: 3};
    var optsNames = {lines: 9, length: 5, width: 3, radius: 2, left: 3}

    $('#btn_removeUserFromGroup').click(function () {
        removeUserFromGroups();
    });
    $('#btn_removeUserRole').click(function () {
        removeUserRole();
    });


    $('#createUserDialog_btn_close').click(function () {
        if ($('#createUserDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
            //socket.emit('administrationViewLoaded');
            refreshData();
            $('#createUserDialog_result_pos').hide();
            $('#createUserDialog_result_neg').hide();
            $('#createUserDialog_result_neg_mail').hide();
            $('#createUserDialog_check_cred').hide();
            $('#createUserDialog_btn_create').show().addClass('btn-primary');
            $('#createUserDialog_btn_close').removeClass('btn-primary');
            $('#cu_submitForm').get(0).reset();
        }
    });
    $('#modifyUserDialog_btn_close').click(function () {
        if ($('#modifyUserDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
            //socket.emit('administrationViewLoaded');
            //refreshData();
            socket.emit('request', {command: "admin_getUserInfo", data: {userId: $('#menu_select_users').val()}});
            $('#modifyUserDialog_result_pos').hide();
            $('#modifyUserDialog_result_neg').hide();
            $('#modifyUserDialog_check_cred').hide();
            $('#modifyUserDialog_btn_create').show().addClass('btn-primary');
            $('#modifyUserDialog_btn_close').removeClass('btn-primary');
            $('#mu_submitForm').get(0).reset();
        }
    });

    $('#createUserDiag').on('hide', function () {
        if ($('#createUserDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
           // socket.emit('administrationViewLoaded');
            refreshData();
            $('#createUserDialog_result_pos').show();
            $('#createUserDialog_result_neg').hide();
            $('#createUserDialog_result_neg_mail').hide();
            $('#createUserDialog_check_cred').hide();
            $('#createUserDialog_btn_create').hide();
            $('#createUserDialog_btn_close').addClass('btn-primary');
            $('#cu_submitForm').get(0).reset();
        }
    });
    $('#modifyUserDiag').on('hide', function () {
        if ($('#modifyUserDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
            //socket.emit('administrationViewLoaded');
            //refreshData();
            socket.emit('request', {command: "admin_getUserInfo", data: {userId: $('#menu_select_users').val()}});
            $('#modifyUserDialog_result_pos').hide();
            $('#modifyUserDialog_result_neg').hide();
            $('#modifyUserDialog_check_cred').hide();
            $('#modifyUserDialog_btn_create').show().addClass('btn-primary');
            $('#modifyUserDialog_btn_close').removeClass('btn-primary');
            $('#mu_submitForm').get(0).reset();
        }
    });

    $('#createGroupDiag').on('hide', function () {
        if ($('#createGroupDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
            //socket.emit('administrationViewLoaded');
            refreshData();
            $('#createGroupDialog_result_pos').show();
            $('#createGroupDialog_result_neg').hide();
            $('#createGroupDialog_check_cred').hide();
            $('#createGroupDialog_btn_create').hide();
            $('#createGroupDialog_btn_close').addClass('btn-primary');
            $('#createGroup_submitForm').get(0).reset();
        }
    });

    $('#deleteUserDiag').on('hide', function () {
        if ($('#deleteUserDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
           // socket.emit('administrationViewLoaded');
            refreshData();
            $('#deleteUserDialog_check_delete').show();
            $('#deleteUserDialog_btn_delete').show();
            $('#deleteUserDialog_btn_close').removeClass('btn-primary')
            $('#deleteUserDialog_btn_delete').addClass('btn-primary')
            $('#deleteUserDialog_deleted').show();
        }
    });
    $('#deleteGroupDiag').on('hide', function () {
        if ($('#deleteGroupDialog_btn_close').attr('class').indexOf('btn-primary') > 0) {
            //socket.emit('administrationViewLoaded');
            refreshData();
            $('#deleteGroupDialog_check_delete').show();
            $('#deleteGroupDialog_btn_delete').show();
            $('#deleteGroupDialog_btn_close').removeClass('btn-primary')
            $('#deleteGroupDialog_btn_delete').addClass('btn-primary')
            $('#deleteGroupDialog_deleted').show();
        }
    });


    $('#btn_addUser').click(function (e) {
        console.log('clicked add user');
        $('#createUserDialog_result_pos').hide();
        $('#createUserDialog_result_neg').hide();
        $('#createUserDialog_result_neg_mail').hide();
        $('#createUserDialog_check_cred').hide();
        $('#createUserDiag').modal('show');
    });

    $('#btn_modifyUser').click(function (e) {
        $('#modifyUserDialog_result_pos').hide();
        $('#modifyUserDialog_result_neg').hide();
        $('#modifyUserDialog_check_cred').hide();
        var userId = $('#menu_select_users').val();
        socket.emit('request', {command: "admin_getUserEmail", data : userId});
    });

    $('#createUserDialog_btn_create').click(function (e) {
        var userName = $('#cu_inputName').val();
        var userMail = $('#cu_inputEmail').val();
        var userPw = $('#cu_inputPassword').val();
        if (userName && userMail && userPw) {
            var check = {userName: userName, userMail: userMail, userPassword: userPw};
            socket.emit('request', {command: "admin_createUser", data: check});
        } else {
            $('#createUserDialog_check_cred').show();

        }
    });

    $('#modifyUserDialog_btn_create').click(function (e) {
    	
        var userMail = $('#mu_inputEmail').val();
        var userPw = $('#mu_inputPassword').val();
        // userPw =CryptoJS.MD5(userPw).toString(CryptoJS.enc.Hex);
        if (userMail && userPw) {
            var data = {userId: $('#menu_select_users option:selected').val(),userMail: userMail, userPassword: userPw};
            socket.emit('request', {command: "admin_modifyUser", data: data});
        }
        else {
            $('#modifyUserDialog_check_cred').show();
        }
    });

    $('#btn_addGroup').click(function (e) {
        $('#createGroupDialog_result_pos').hide();
        $('#createGroupDialog_result_neg').hide();
        $('#createGroupDialog_check_cred').hide();
        $('#createGroupDialog_btn_create').show();
        $('#createGroupDiag').modal('show');
    });
    $('#createGroupDialog_btn_create').click(function (e) {
        var groupName = $('#createGroup_inputName').val();
        if (groupName) {
            var check = {groupName: groupName};
            socket.emit('request', {command: "admin_createGroup", data: check});
        }
        else {
            $('#createGroupDialog_check_cred').show();
        }
    });

    $('#btn_saveUserDetails').click(function (e) {
        saveUserDetails();
    });
    $('#btn_createUserDialog_btn_addUserToGroups').click(function (e) {
        addToGroups();
    });
    $('#btn_addUserRole').click(function (e) {
        addRoles();
    });
    $('#btn_deleteUser').click(function (e) {
        $('#delete_userName').text($('#menu_select_users option:selected').text());
        $('#deleteUserDialog_deleted').hide();
        $('#deleteUserDiag').modal('show');
    });
    $('#deleteUserDialog_btn_delete').click(function (e) {
        deleteUser();
    });

    $('#btn_deleteGroups').click(function (e) {
        var selected = [];
        $('#delete_groupName').empty();
        $('#menu_select_groups option:selected').each(function () {
            $('#delete_groupName').append($(this).text() + ' ');
            selected.push($(this).val());
        });
        if (selected.length > 0) {
            $('#deleteGroupDialog_deleted').hide();
            $('#deleteGroupDiag').modal('show');
        }
    });
    $('#deleteGroupDialog_btn_delete').click(function (e) {
        deleteGroups();
    });
    $('#menu_select_users').change(function () {
        setButtonStates(false);
        setSpinnersAndBoxes(true, false);
        socket.emit('request', {command: "admin_getGroups"});
        socket.emit('request', {command: "admin_getRoles"});
        socket.emit('request', {command: "admin_getUserInfo", data: {userId: $('#menu_select_users').val()}});
    });


    function refreshData() {
        setButtonStates(false);
        setSpinnersAndBoxes(true, true);
        socket.emit('request', {command: "admin_getUsers"});
        socket.emit('request', {command: "admin_getGroups"});
        socket.emit('request', {command: "admin_getRoles"});
    }

    function setSpinnersAndBoxes(enable, user) {
        if (enable) {
            $('#userDetails_select_roles').empty();
            $('#userDetails_select_groups').empty();
            if (user) {
                $('#menu_select_users').empty();
                $('#spinUser').spin(optsSelect);
            }
            $('#menu_select_groups').empty();
            $('#userName').html("<br>");
            $('#userEmail').html("<br>");


            $('#spinGroups').spin(optsSelect);
            $('#userName').spin(optsNames);
            $('#userEmail').spin(optsNames);
            $('#spinRoles').spin(optsSelect);
            $('#spinRoles2').spin(optsSelect);
            $('#spinGroups2').spin(optsSelect);
        }
        else {
            $('#spinUser').spin(false);
            $('#spinGroups').spin(false);
            $('#userName').spin(false);
            $('#userEmail').spin(false);
            $('#spinRoles').spin(false);
            $('#spinRoles2').spin(false);
            $('#spinGroups2').spin(false);
        }

    }

    function setButtonStates(enable) {
        if (!enable) {
            $('#btn_addUser').attr('disabled', 'disabled');
            $('#btn_deleteUser').attr('disabled', 'disabled');
            $('#btn_createUserDialog_btn_addUserToGroups').attr('disabled', 'disabled');
            $('#btn_addGroup').attr('disabled', 'disabled');
            $('#btn_deleteGroups').attr('disabled', 'disabled');
            $('#btn_removeUserFromGroup').attr('disabled', 'disabled');
            $('#btn_saveUserDetails').attr('disabled', 'disabled');
        }
        else {
            $('#btn_addUser').removeAttr('disabled', 'disabled');
            $('#btn_deleteUser').removeAttr('disabled', 'disabled');
            $('#btn_createUserDialog_btn_addUserToGroups').removeAttr('disabled', 'disabled');
            $('#btn_addGroup').removeAttr('disabled', 'disabled');
            $('#btn_deleteGroups').removeAttr('disabled', 'disabled');
            $('#btn_removeUserFromGroup').removeAttr('disabled', 'disabled');
            $('#btn_saveUserDetails').removeAttr('disabled', 'disabled');
        }
    }

    refreshData();

    function fillMenuSelectForms(data) {
        if (data.users) {
            $('#menu_select_users').empty();
            if ($('#menu_select_users').prop) {
                var options = $('#menu_select_users').prop('options');
            }
            else {
                var options = $('#menu_select_users').attr('options');
            }

            $.each(data.users, function (i, value) {
                options[options.length] = new Option(value, i);
            });


            socket.emit('request', {command: "admin_getUserInfo", data: {userId: $('#menu_select_users').val()}});
        }
        else if (data.groups != null && data.groups) {
            $('#menu_select_groups').empty();
            if ($('#menu_select_groups').prop) {
                var options = $('#menu_select_groups').prop('options');
            }
            else {
                var options = $('#menu_select_groups').attr('options');
            }
            $.each(data.groups, function (i, value) {
                options[options.length] = new Option(value, i);
            });


        }
        else {

            $('#menu_select_roles').empty();
            if ($('#menu_select_roles').prop) {
                var options = $('#menu_select_roles').prop('options');
            }
            else {
                var options = $('#menu_select_roles').attr('options');
            }
            $.each(data.roles, function (i, value) {
                options[options.length] = new Option(value, i);
            });
        }

    }

    function fillUserDetails(data) {
        $('#userDetails_select_roles').empty();
        $('#userDetails_select_groups').empty();
        $('#userName').text(data.result.userName);
        $('#userEmail').text(data.result.userEmail);
        if ($('#userDetails_select_roles').prop) {
            var options = $('#userDetails_select_roles').prop('options');
        }
        else {
            var options = $('#userDetails_select_roles').attr('options');
        }
        $.each(data.result.userRoles, function (i, value) {
            options[options.length] = new Option(value, i);
        });
        if (data.result.userGroups) {
            if ($('#userDetails_select_groups').prop) {
                var options = $('#userDetails_select_groups').prop('options');
            }
            else {
                var options = $('#userDetails_select_groups').attr('options');
            }
            $.each(data.result.userGroups, function (i, value) {
                options[options.length] = new Option(value, i);
            });
        }

    }

    function removeUserFromGroups() {
        $('#userDetails_select_groups option:selected').each(function () {
            $("#userDetails_select_groups option[value=" + $(this).val() + "]").remove();
        });
    }

    function removeUserRole() {
        if ($('#userDetails_select_roles option').size() > $('#userDetails_select_roles option:selected').size()) {
            $('#userDetails_select_roles option:selected').each(function () {
                $("#userDetails_select_roles option[value=" + $(this).val() + "]").remove();
            });
        }
    }

    function saveUserDetails() {
        var userDetails = {};
        var userGroups = [];
        var userRoles = [];
        $('#userDetails_select_groups option').each(function () {
            userGroups.push($(this).val());
        });
        $('#userDetails_select_roles option').each(function () {
            userRoles.push($(this).val());
        });
        var userRole = $('#userDetails_select_roles option:selected').val();
        userDetails['roles'] = userRoles;
        userDetails['groups'] = userGroups;
        userDetails['userId'] = $('#menu_select_users').val();
        setButtonStates(false);
        setSpinnersAndBoxes(true);
        socket.emit('request', {command: "admin_saveUserDetails", data: userDetails});
    }

    function userCreated(result) {
        if (!result.data.ok) {
            if (result.data.result.error === 'mail') {
                // the mail address is already in use
                $('#createUserDialog_result_neg').hide();
                $('#createUserDialog_result_neg_mail').show();
            } else {
                // the user name is already in use
                $('#createUserDialog_result_neg').show();
                $('#createUserDialog_result_neg_mail').hide();
            }
            $('#createUserDialog_result_pos').hide();
            $('#createUserDialog_check_cred').hide();
        } else {
            refreshData();
            $('#createUserDialog_result_neg').hide();
            $('#createUserDialog_result_pos').show();
            $('#createUserDialog_check_cred').hide();
            $('#createUserDialog_btn_create').hide();
            $('#createUserDialog_btn_close').addClass('btn-primary');

        }
    }
    function userModified(result) {
        if (!result.data.ok) {
            $('#modifyUserDialog_result_neg').show();
            $('#modifyUserDialog_result_pos').hide();
            $('#modifyUserDialog_check_cred').hide();
        } else {
            refreshData();
            $('#modifyUserDialog_result_neg').hide();
            $('#modifyUserDialog_result_pos').show();
            $('#modifyUserDialog_check_cred').hide();
            $('#modifyUserDialog_btn_create').hide();
            $('#modifyUserDialog_btn_close').addClass('btn-primary');

        }
    }

    function groupCreated(result) {
        if (!result.data.result) {
            $('#createGroupDialog_result_neg').show();
            $('#createGroupDialog_result_pos').hide();
            $('#createGroupDialog_check_cred').hide();

        }
        else {
            refreshData();
            $('#createGroupDialog_result_pos').show();
            $('#createGroupDialog_result_neg').hide();
            $('#createGroupDialog_check_cred').hide();
            $('#createGroupDialog_btn_create').hide();
            $('#createGroupDialog_btn_close').addClass('btn-primary');

        }
    }

    function addToGroups() {
        $('#menu_select_groups option:selected').each(function () {
            var isInSelect = false;
            var valToCompare = $(this).val();
            $('#userDetails_select_groups option').each(function () {
                if ($(this).val() == valToCompare) {
                    isInSelect = true;
                    return false;
                }
            });
            if (!isInSelect) {
                if ($('#userDetails_select_groups').prop) {
                    var options = $('#userDetails_select_groups').prop('options');
                }
                else {
                    var options = $('#userDetails_select_groups').attr('options');
                }
                options[options.length] = new Option($(this).text(), $(this).val());
            }
        });
    }

    function addRoles() {
        $('#menu_select_roles option:selected').each(function () {
            var isInSelect = false;
            var valToCompare = $(this).val();
            $('#userDetails_select_roles option').each(function () {
                if ($(this).val() == valToCompare) {
                    isInSelect = true;
                    return false;
                }
            });
            if (!isInSelect) {
                if ($('#userDetails_select_roles').prop) {
                    var options = $('#userDetails_select_roles').prop('options');
                }
                else {
                    var options = $('#userDetails_select_roles').attr('options');
                }
                options[options.length] = new Option($(this).text(), $(this).val());
            }
        });
    }

    function deleteUser() {

        var userId = $('#menu_select_users option:selected').val();
        socket.emit('request', {command: "admin_deleteUser", data: {userId: userId}});
    }

    function userDeleted(result) {
        if (result.data.result) {
            refreshData();
            $('#deleteUserDialog_check_delete').hide();
            $('#deleteUserDialog_btn_delete').hide();
            $('#deleteUserDialog_btn_close').addClass('btn-primary')
            $('#deleteUserDialog_deleted').show();
        }
    }

    function deleteGroups() {
        var selected = [];
        $('#menu_select_groups option:selected').each(function () {
            selected.push($(this).val());
        });
        socket.emit('request', {command: "admin_deleteGroups", data: selected});
    }

    function groupsDeleted(result) {
        if (result.data.result) {
            refreshData();
            $('#deleteGroupDialog_check_delete').hide();
            $('#deleteGroupDialog_btn_delete').hide();
            $('#deleteGroupDialog_btn_close').addClass('btn-primary')
            $('#deleteGroupDialog_deleted').show();
        }
    }
    
}//end startadministration()