SC = {

    connected: false,

    socket: io.connect(),

    callbacks: {},

    notifyCallbacks: {},

	cameFromLoginDialog: false,

    prepare: function () {

        var self = this;

        var socket = SC.socket;

        socket.on('response', function (response) {
            var cbObject = SC.callbacks[response.reqid];
//			console.log("response:");
//			console.log(response);
            if(cbObject)
            {
                cbObject.callback.call(cbObject.scope, response.data);
                delete(SC.callbacks[response.reqid]);
            }else
            {
                console.log("response without request, have to debug where that comes from");
            }
        });

        socket.on('notification', function (notification) {
            if (SC.notifyCallbacks[notification.id]) {
                var notifyObject = SC.notifyCallbacks[notification.id];
                notifyObject.callback.call(notifyObject.scope, notification.data);
            }
        });


		socket.on('connect', function()
		{
			console.log("socket.io connected. Waiting for user...");
//			prepareWorkbench('testname');
		});

		socket.on('user', function(resp){
			console.log("socket.io user received " + resp.user.username);
//			console.log(resp.user);

			// hier sollte der Admin Status gechecked werden und der workbench uebergeben
			// (nicht mit diesem komischen admin button hack .... tsss ;) )

			prepareWorkbench(resp.user);
		});

		socket.on('error', function(reason)
		{
			console.log("SOCKET ERROR: " + reason);
		});

    },

    sendRequest: function (command, callback) {
        var reqid = calculateWorkflowID();
        var cbObject = { scope: this, callback: callback };
        SC.callbacks[reqid] = cbObject;
		console.log("yep sending now " + reqid + " cmd " + command);
        SC.socket.emit('request', { id: reqid, command: command });
    },

    sendDataRequest: function (command, data, callback) {
        var reqid = calculateWorkflowID();
        var cbObject = { scope: this, callback: callback };
        SC.callbacks[reqid] = cbObject;
        SC.socket.emit('request', { id: reqid, command: command, data: data });
    },

    sendDataNotificationRequest: function (command, data, notification, callback) {
        var reqid = calculateWorkflowID();
        var cbObject = { scope: this, callback: callback };
        SC.callbacks[reqid] = cbObject;
        SC.notifyCallbacks[notification.id] = { scope: this, callback: notification.callback, id: notification.id };

		console.log("sendDataNotificationRequest: " + reqid + ": " + command);
		console.log(data);
        SC.socket.emit('request', { id: reqid, command: command, data: data, notification: true });
    },

    getFilterDescriptions: function (callback) {
        SC.sendRequest('getFilterDescriptions', callback);
    }

};
