//Real SocketJS used by Workbench
SC = {

    connected: false,

    socket: io.connect(),

    callbacks: {},

    notifyCallbacks: {},

    prepare: function () {

        var self = this;

        var socket = SC.socket;

        socket.on('user', function(data) {
            if (!SC.connected) {
                SC.connected = true;

                prepareWorkbench(data.user.id);

//                SC.sendRequest("authAdmin", function(response){
//                    //user is admin
//                    if(response){
//                        YAHOO.util.Event.onDOMReady(function () {
//                            //yui-renders the tools on domready, so force calling this aferwads via settimeout (else btn = null)
//                            var check = setInterval(function(){
//                                if (adminBtnReady){
//                                    var adminBtn = document.getElementById("WiringEditor-adminButton");
//                                    YAHOO.util.Event.addListener(adminBtn, "click", function(){
//                                        window.open("newAdministration/index.html", "_blank");
//                                    });
//                                    adminBtn.style.display = "";
//                                    clearInterval(check);
//                                }
//                            }, 10);
//                        });
//                    }
//                });

            }
        });

        socket.on('login', function (data) {
            SC.doLogin.call(self, true);
        });

        socket.on('login_ack', function (data) {
            dialog.hide();
            if (!SC.connected) {
                SC.connected = true;

                prepareWorkbench(data.user.id);

                SC.sendRequest("authAdmin", function(response){
                	//user is admin
                	if(response){
                		YAHOO.util.Event.onDOMReady(function () {
                			//yui-renders the tools on domready, so force calling this aferwads via settimeout (else btn = null)
                			var check = setInterval(function(){
                				if (adminBtnReady){
                					var adminBtn = document.getElementById("WiringEditor-adminButton");
                					YAHOO.util.Event.addListener(adminBtn, "click", function(){
                						window.open("newAdministration/index.html", "_blank");
                					});
                					adminBtn.style.display = "";
                					clearInterval(check);
                				}
            				}, 10);
                		});
                	}
                });

            }
        });
        
        socket.on('logout_ack', function (data) {
            // alert("Logged out");
            // window.location.reload();
            window.open('/', '_self');
        });
        
        socket.on('response', function (response) {
            var cbObject = SC.callbacks[response.reqid];
            cbObject.callback.call(cbObject.scope, response.data);
            delete(SC.callbacks[response.reqid]);
        });

        socket.on('notification', function (notification) {
            if (SC.notifyCallbacks[notification.id]) {
                var notifyObject = SC.notifyCallbacks[notification.id];
                notifyObject.callback.call(notifyObject.scope, notification.data);
            }
        });

    },

    sendRequest: function (command, callback) {
        console.log("sendRequest");
        console.log(command);
        var reqid = calculateWorkflowID();
        var cbObject = { scope: this, callback: callback };
        SC.callbacks[reqid] = cbObject;
        SC.socket.emit('request', { id: reqid, command: command });
    },

    sendDataRequest: function (command, data, callback) {
        console.log("sendDataRequest");
        console.log(command);
        var reqid = calculateWorkflowID();
        var cbObject = { scope: this, callback: callback };
        SC.callbacks[reqid] = cbObject;
        SC.socket.emit('request', { id: reqid, command: command, data: data });
    },

    sendDataNotificationRequest: function (command, data, notification, callback) {
        console.log("sendDataNotificationRequest");
        console.log(command);
        var reqid = calculateWorkflowID();
        var cbObject = { scope: this, callback: callback };
        SC.callbacks[reqid] = cbObject;
        SC.notifyCallbacks[notification.id] = { scope: this, callback: notification.callback, id: notification.id };
        SC.socket.emit('request', { id: reqid, command: command, data: data, notification: true });
    },

    doLogin: function (first) {

        function okHandler() {
        	document.getElementById("loginForm").submit();
//            var loginName = document.getElementById("loginNameInput").value;
//            var loginPass = document.getElementById("loginPassInput").value;
//            var hash = CryptoJS.MD5(loginPass).toString(CryptoJS.enc.Hex);
//
//            // Try logging in on server
//            SC.socket.emit('login', { 'name': loginName, 'pass': hash } );
        }

        var dialogButtons = [
            { text: "Ok", handler: okHandler },
            { text: "Cancel", handler: function() {
                this.cancel();
                // prepareCanceledWorkbench(); // TODO react on cancel
                // window.history.back();
                window.open('/', '_self');
            } }
        ];

        dialog.cfg.queueProperty("buttons", dialogButtons);
        dialog.setHeader("Login...");

        var body = [];
        body.push("<div id='loginPanelBody'>");
        if (first) {
            body.push("<p>Please enter your login information:</p>");
        } else {
            body.push("<p>Your login information could not be validated, please try again:</p>");
        }
        body.push("<form id=\"loginForm\" action=\"/login\" method=\"post\">");
        body.push("<p><label for='loginName'>Login:</label><br/><input type='text' name='username' id='loginNameInput' /></p>");
        body.push("<p><label for='loginPass'>Password:</label><br/><input type='password' name='password' id='loginPassInput' /></p>");
        body.push("</form>");
        body.push("<p><br />This demo version of the workbench can be accessed as user &quot;guest&quot; with the password &quot;guest&quot;. ");
        body.push("For more information please go back to the <a href='/'>overview page</a>.</p>");
        body.push("</div>");

        dialog.setBody(body.join(''));
        dialog.postmethod = "none";
        dialog.render(document.body);
        dialog.show();
        
        new YAHOO.util.KeyListener(["loginNameInput", "loginPassInput"], {keys: [13]}, {fn: function () {
            okHandler();
        }}).enable();

    },

    getFilterDescriptions: function (callback) {
        console.log("GetFilterDescription in socket.js");
        SC.sendRequest('getFilterDescriptions', callback);
    }

};
