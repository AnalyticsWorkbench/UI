//  TupleSpaces JavaScript Library
//  Version 0.1.4
//  Authors Malte Wessel, Adam Giemza
//  Copyright Collide 2012
//  TupleSpaces-JS is licensed under the LGPL.
//  More details and documentation on
//  http://sqlspaces.collide.info/
//  http://projects.collide.info/projects/sqlspaces-js/

(function () {

	/**
	 * Save a reference to the global object.
	 */
	var root = this;

	/**
	 * @namespace
	 * Creates the TS Object in which all needed methods and
	 * objects are stored that can be accessed from outside
	*/
	TS = root.TS = {};

	/**
	 * Set TS.DEBUG = false to avoid console messages
	 */
	TS.debug = false;

	/**
	 * @namespace
	 * A bundle of utility functions used in the TS environment
	 */
	TS.Utils = {

		/**
		 * Returns a random uuid
		 */
		getUniqueId: function() {
			var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''),
				uuid = [],
				rnd = 0,
				r;
			for (var i = 0; i < 36; i++) {
				if (i == 8 || i == 13 ||  i == 18 || i == 23) {
					uuid[i] = '-';
				} else if (i == 14) {
					uuid[i] = '4';
				} else {
					if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
					r = rnd & 0xf;
					rnd = rnd >> 4;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
				}
			}
			return uuid.join('');
		},

		/**
		 * Extends an object with another
		 * @param {Object} obj Object to be extended
		 * @param {Object} obj2 Object to extend with
		 * @return {Object} The extended object
		 */
		extend: function(obj, obj2) {
			for (var prop in obj2) {
	        	if (obj2[prop] !== void 0) obj[prop] = obj2[prop];
			}
			return obj;
		},

		/**
		 * Fills a number with leading zeros
		 * @param {Number} number Number to be filled
		 * @param {Number} length The max length of the number
		 * @return {String} The filled number as string
		 */
		leadingZero: function (number, length) {
			var str = '' + number;
    		while (str.length < length) str = '0' + str;
    		return str;
		},

		/**
		 * Formats a timestamp to the german date/time format (DD.MM.YYYY HH:SS:MM)
		 * @param {Number} timestamp
		 * @return {String} The formated date
		 */
		formatTimestamp: function(timestamp) {
			if(timestamp > 0) {
 			var d = new Date(parseInt(timestamp)),
 				day = TS.Utils.leadingZero(d.getDate(), 2),
 				month = TS.Utils.leadingZero(d.getMonth() + 1, 2),
 				year = d.getFullYear(),
 				hours = TS.Utils.leadingZero(d.getHours(), 2),
 				minutes = TS.Utils.leadingZero(d.getMinutes(), 2),
 				seconds = TS.Utils.leadingZero(d.getSeconds(), 2);
		    return day + '.' + month + '.' + year + ' ' + hours + ':' + minutes + ':' + seconds;
 			} else {
 				return '-';
 			}
 		},

		/**
		 * Log messages in the console
		 * @param {String} msg Message to be logged
		 */
		log: function(msg) {
			if(TS.debug && console) {
				console.log(msg)
			}
		},

		is: function(type, value) {
			if(type == 'string') {
				return typeof value == 'string';

			} else if(type == 'boolean') {
				return (value == 'true' || value == 'false');

			} else if(type == 'byte') {
				var val = parseInt(value);
				return !isNaN(val) && (val >= -128) && (val <= 127);

			} else if(type == 'short') {
				var val = parseInt(value);
				return !isNaN(val) && (val >= -32768) && (val <= 32767);

			} else if(type == 'integer') {
				var val = parseInt(value);
				return !isNaN(val) && (val >= -2147483648) && (val <= 2147483647);

			} else if(type == 'long') {
				var val = parseInt(value);
				return !isNaN(val) && (val >= -9223372036854775808) && (val <= 9223372036854775807);

			} else if(type == 'float' || type == 'double') {
				var val = parseFloat(value);
				return !isNaN(val);

			} else {
				return false;
            }
        }
	}

	/**
	 * Creates a new class with a constructor, private and public methods
	 * Inspired by http://aboutcode.net/2011/10/04/efficient-encapsulation-of-javascript-objects.html
	 * @param {Object} obj
	 * @param {Function} obj.constructor Constructor method
	 * @param {Object} obj.private Private methods
	 * @param {Object} obj.public Public methods
	 * @function
	 */
	TS.Class = (function() {

		/**
		 * Creates a proxying function that will call the real object.
		 */
		function createProxyFunction(functionName) {
		    return function() {
		        // 'this' in here is the proxy object.
		        var realObject = this.__realObject__,
		            realFunction = realObject[functionName];
		        // Call the real function on the real object, passing any arguments we received.
		        return realFunction.apply(realObject, arguments);
		    };
		};

		/**
		 * Creates a function that will create Proxy objects.
		 */
		function createProxyClass(publicFunctions) {
		    var ProxyClass;

		    // This is this Proxy object constructor.
		    ProxyClass = function (realObject) {
		        // Choose a reasonably obscure name for the real object property.
		        // It should avoid any conflict with the public function names.
		        // Also any code being naughty by using this property is quickly spotted!
		        this.__realObject__ = realObject;
		    };
		    return ProxyClass;
		}

		/**
		 * Builds the proxy class prototype
		 */
		function buildProxyClassPrototype(proxyClass, publicFunctions) {
		    var functionName, func;
		    // Create a proxy function for each of the public functions.
		    for (functionName in publicFunctions) {
		        func = publicFunctions[functionName];
		        // We only want functions that are defined directly on the publicFunctions object.
		        if (publicFunctions.hasOwnProperty(functionName) &&
		            typeof func === "function") {
		            proxyClass.prototype[functionName] = createProxyFunction(functionName);
		        }
		    }
		}

		/**
		 * Copys functions from source to the prototype of destination
		 */
		function copyToPrototype(source, destination) {
		    var prototype = destination.prototype,
		        property;
		    for (property in source) {
		        if (source.hasOwnProperty(property)) {
		            prototype[property] = source[property];
		        }
		    }
		};

		function createRealClass(constructor, publics, privates, proxyClass) {
		    var RealClass = function(arguments) {
		        var proxy;

		        if (typeof constructor === "function") {
		            // Call the constructor function to perform any initialization of the object.
		            constructor.apply(this, arguments);
		        }
		        proxy = new proxyClass(this);
		        // Maintain the illusion that the proxy object is a real object.
		        // Assign the constructor property in case anyone uses it to create another instance.
		        proxy.constructor = RealClass;
		        // Returning the proxy object means creating a new instance of Class
		        // results in a proxy object, instead of the real object.
		        // Callers can then only interact with the proxy.
		        return proxy;
		    };
		    // The RealClass has both public and private functions.
		    copyToPrototype(publics || {}, RealClass);
		    copyToPrototype(privates || {}, RealClass);

		    var constructorFunction = function ctor() {
		        return new RealClass(arguments);
		    };
		    proxyClass.prototype = constructorFunction.prototype;
		    return constructorFunction;
		}

		// Return the TS.Class function.
		return function (options) {
		    // 'public' and 'private' are reserved keywords, so the option properties must be
		    // accessed using strings instead of options.public, for example.
		    var proxyClass = createProxyClass(),
		        realClass = createRealClass(
		            options["constructor"],
		            options["public"],
		            options["private"],
		            proxyClass
		        );
		    buildProxyClassPrototype(proxyClass, options["public"]);
		    return realClass;
		};
	}());

	/**
     * Creates a new TS.Connector
     * @class The Connector class is responsible for the communication between the javascript client and the tuplespace web socket.
     * @param options Options for the connector
	 * @param {String} options.host The host to the web socket
	 * @param {String} options.port The port used for the web socket
	 * @param {String} options.endpoint The endpoint
	 * @param {Boolean} options.json If the json parameter is true, every incoming and outgoing message will be
	 *	parsed into JSON and gets an unique id to identify its response in the queue. If this parameter is false
	 *	every message will be processed as string and gets no unique id. In this case the response to a message is
	 *	always the directly next response from the server.
	 * @param {Boolean} options.through If the through parameter is true, the responses from the server are
	 *	passed directly to the onCallback method, stored in the options object
     */
	TS.Connector = TS.Class(/** @lends TS.Connector */{
		 /**
		  * @constructs
		  */
		'constructor': function(options) {

			/**
     		 * Stores the location of the web socket
     		 * @private
     		 */
			this.location = 'ws://' +
				(options.host || 'localhost') + ':' +
				(options.port || '8080') + '/' +
				(options.endpoint || 'ws-json');

			/**
     		 * Stores the ready state
     		 * @private
     		 */
			this.ready = false;

			/**
     		 * Stores the web socket object
     		 * @private
     		 */
			this.ws;

			/**
     		 * Stores the references of the callbacks awaiting an response from the server.
     		 * The callbacks have their unique server ids as index
     		 * @private
     		 */
			this.queue = [];

			/**
			 * If the json parameter is true, every incoming and outgoing message will be
			 *	parsed into JSON and gets an unique id to identify its response in the queue. If this parameter is false
			 *	every message will be processed as string and gets no unique id. In this case the response to a message is
			 *	always the directly next response from the server.
			 * @private
			 */
			this.json = (typeof options.json == 'undefined') ? true : options.json;

			/**
			 * Stores the queueId
			 * only used if json = false;
			 * @private
			 */
			this.queueId = 0;

			/**
			 * If the through parameter is true, the responses from the server are passed directly to
			 *	the onCallback method, stored in the options object
			 * @private
			 */
			this.through = (typeof options.through == 'undefined') ? false : options.through;

			/**
			 * Stores the onCallback functions
			 */
			this.onCallback = options.onCallback;
			this.onErrorCallback = options.onError;

			// Check if the onCallback method is available in case of through = true
			if(this.through) {
				if(typeof options.onCallback !== 'undefined') this.onCallback = options.onCallback;
				else throw new Error('No onCallback method');
			}

			// Connect to the given location
			this.connect(
				this.location
			);
		},
		'private': {
			/**
			 * Calls the callback when the web socket is connected
			 * @param {Function} callback The Method to be called when the web socket is connected
			 * @private
			 */
			tryWebsocket: function(callback) {
				var self = this, interval, iterations = 0;

				if(this.ready == true) {
					callback.call();
				} else {
					interval = setInterval(function() {
						iterations++;
						TS.Utils.log('Wait for websocket ' + self.location + ' (' + iterations + ')');
						if(self.ready == true) {
							clearInterval(interval);
							callback.call();
						} else if (iterations == 10) {
							clearInterval(interval);
							TS.Utils.log('Websocket wasn\'t able to react after 10 tries');
						}
					}, 500);
				}
			},

			/**
			 * Connect to a location
			 * @param {String} location The location of the web socket
			 * @private
			 */
			connect: function(location) {
				var self = this;

				TS.Utils.log('Connecting to ' + self.location);

				// Firefox websocket
				if (typeof WebSocket == 'undefined') this.ws = new MozWebSocket(self.location);
				else this.ws = new WebSocket(self.location);

				this.ws.onopen = function() {
					self.onOpen();
				}

				this.ws.onmessage = function(msg) {
					// If the through parameter is true, the responses from the server are
					// passed directly to the onCallback method
					if(self.through == true) self.onCallback(msg);
					else self.onMessage(msg);
				}

				this.ws.onclose = function(msg) {
					self.onClose(msg);
				}

				this.ws.onerror = function(e) {
					self.onError(e);
				}
			},

			/**
			 * Called when the web socket was opened
			 * @private
			 */
			onOpen: function() {
				TS.Utils.log('Connection established to ' + this.location);
				this.ready = true;
			},

			/**
			 * Called when a message arrives. Handles the responses from the server
			 * @param {String} msg Message from the web socket
			 * @private
			 */
			onMessage: function(msg) {
				var message;
				TS.Utils.log('Incomming Message on ' + this.location + ' \n' + msg.data);
				if(this.json == true) {

					message = JSON.parse(msg.data);

					// Handle response messages
					if(message.response) {
						if(typeof this.queue[message.response.id] !== 'undefined') {
							var id = message.response.id;

							var cb = this.queue[id];
							delete this.queue[id];

							// Call callback in queue and delete
							cb.call(this, message);

						} else {
							TS.Utils.log('Could not assign response to an request in queue \n' + msg);
						}
					} else if(message.callback) {
						if(typeof this.onCallback == 'function') this.onCallback.call(this, message.callback);
					}
				} else {
					// Call callback in queue and delete
					this.queue[self.queueId].call(this, message);
					delete this.queue[self.queueId];
				}
			},

			/**
			 * Called when the web socket was closed
			 * @param {String} msg
			 * @private
			 */
			onClose: function(msg) {
				TS.Utils.log('Websocket ' + this.location + ' was closed \n' + msg);
				this.ready = false;
				if(typeof this.onErrorCallback == 'function') this.onErrorCallback.call(this, msg);
			},

			/**
			 * Called when an error occurs
			 * @param {Error} error
			 * @private
			 */
			onError: function(error) {
				TS.Utils.log('Websocket ' + this.location + ' error \n' + error);
				if(typeof this.onErrorCallback == 'function') this.onErrorCallback.call(this, error);
			}
		},

		'public': {
			/**
			 * Sends a message to the server
			 * @param {String} message The message to be sent
			 * @param {Function} callback The method to be called when the response arrives
			 * @public
			 */
			send: function(message, callback, requestId) {
				var self = this;

				this.tryWebsocket(function() {
					var request = {}, method, msg, uniqueId = requestId || TS.Utils.getUniqueId();

					if(self.json == true) {
						// Get the method
						for (var prop in message) {
							method = prop; break;
						}

						// Prevent close event
						if(method == 'disconnect') {
							self.onClose = function () {};
							self.onError = function() {};
						}

						// Create request
						request[method] = {id: uniqueId}

						// Extend request with arguments
						TS.Utils.extend(request[method], message[method]);

						// Add request to queue
						self.queue[uniqueId] = callback;

						// Send message via websocket
						msg = JSON.stringify(request);

					} else {
						// Add request to queue
						self.queue[self.queueId++] = callback;
						msg = message;
					}
					self.ws.send(msg);
					TS.Utils.log('Send message \n' + msg);
				});
			},

			disconnect: function() {
				this.onClose = function () {};
				this.onError = function () {};
				this.ws.close();
			}
		}
	});

	/**
     * Creates a new TS.Field
     * @class Fields are building units of Tuples. Each field has a type and can contain a value.
     * @param {String} fieldtype Actual/formal
     * @param {String} type The data type of the field
     * @param {String} value The value of the field
     * @param {Number} upperBound
     * @param {Number} lowerBound
     */
	TS.Field = TS.Class(/** @lends TS.Field */{
	    'constructor': function(fieldtype, type, value, upperBound, lowerBound) {
			this.fieldtype = fieldtype;
			this.type = type;
			this.value = value;
			this.upperBound = upperBound;
			this.lowerBound = lowerBound;
	    },

	    'public': {
	    	/**
	    	 * Get the field's value
	    	 * @public
	    	 */
	        getValue: function() {
	    		return this.value;
	    	},

	    	/**
	    	 * Set the field's value
	    	 * @public
	    	 */
	    	setValue: function(value) {
	    		this.value = value;
	    	},

			/**
	    	 * Get the field's data type
	    	 * @public
	    	 */
	    	getType: function() {
	    		return this.type;
	    	},

	    	/**
	    	 * Get the field's field type
	    	 * @public
	    	 */
	    	getFieldtype: function() {
	    		return this.fieldtype;
	    	},
			/**
	    	 * Get the field's lowerbound
	    	 * @public
	    	 */
	    	getLowerbound: function() {
	    		return this.lowerBound;
	    	},

	    	/**
	    	 * Set the field's lowerbound
	    	 * @public
	    	 */
	    	setLowerbound: function(lowerBound) {
	    		this.lowerBound = lowerBound;
	    	},

			/**
	    	 * Get the field's upperbound
	    	 * @public
	    	 */
	    	getUpperbound: function() {
	    		return this.upperBound;
	    	},

	    	/**
	    	 * Set the field's upperbound
	    	 * @public
	    	 */
	    	setUpperbound: function(upperBound) {
	    		this.upperBound = upperBound;
	    	},

	    	/**
	    	 * Returns a JSON representation of the field
	    	 * @returns {JSON} The JSON representation of the field
	    	 * @public
	    	 */
	    	toJSON: function() {
	    		return {
	    			'class': 'field',
	    			'fieldtype': this.fieldtype,
	    			'type': this.type,
	    			'textcontent': this.value,
                    'upper-bound' : this.upperBound,
                    'lower-bound' : this.lowerBound
                }
	    	},

	    	/**
	    	 * Sets the properties of the field with an JSON object
	    	 * @param {Object} data
	    	 * @public
	    	 */
	    	fromJSON: function(data) {
	    		this.fieldtype = data.fieldtype || null;
				this.type = data.type || null;

                if(this.fieldtype === 'actual') {
                    if(this.type === 'integer') {
                        this.value = parseInt(data.textcontent);
                    } else if (this.type === 'float' || this.type === 'double') {
                        this.value = parseFloat(data.textcontent);
                    } else if (this.type === 'boolean') {
                        this.value = data.textcontent.toLowerCase() === 'true';
                    } else {
                        this.value = data.textcontent;
                    }
                }
                this.upperBound = data.upperBound || null;
                this.lowerBound = data.lowerBound || null;
	    	}
	    }
	});

	/**
	 * Creates a new formal TS.Field
	 * @param {String} type Data type of the field
	 * @returns {TS.Field} The new TS.Field
	 */
	TS.createFormalField = function(type) {
		if(typeof type !== 'undefined')  {
			return new TS.Field('formal', type);
		}
		return false;
	}

	/**
	 * Creates a new actual TS.Field
	 * @param {String} type The data type of the field
	 * @param {String} value The value of the field
	 * @returns {TS.Field} The new TS.Field
	 */
	TS.createActualField = function(type, value) {
		if(typeof type !== 'undefined')  {
			return new TS.Field('actual', type, value);
		}
		return false;
	}

	/**
	 * Creates a new wildcard Instance of TS.Field.
	 * @returns {TS.Field} The new TS.Field
	 */
	TS.createWildcardField = function() {
		return new TS.Field('wildcard');
	}

	/**
	 * A singleton formal integer field.
	 */
	TS.fInteger = TS.createFormalField('integer');

	/**
	 * A singleton formal string field.
	 */
	TS.fString = TS.createFormalField('string');

	/**
	 * A singleton formal char field.
	 */
	TS.fChar = TS.createFormalField('char');

	/**
	 * A singleton formal float field.
	 */
	TS.fFloat = TS.createFormalField('float');

	/**
     * Creates a new TS.Tuple
     * @param {Array} fields The fields of the tuple
     * @param {Number} id The id of the tuple
     * @param {Number} creationTimestamp The creation timestamp
     * @param {Number} lastModificationTimestamp The timestamp of the last modification
     * @param {Number} expiration The expiration of the tuple
     * @param {Number} major The major
     * @param {Number} version The version
     * @param {String} username The username
     * @class
     */
	TS.Tuple = TS.Class(/** @lends TS.Tuple */{
		'constructor': function(fields, id, creationTimestamp, lastModificationTimestamp, expiration, major, minor, version, username) {
            var tmpFields = fields || [];
            this.fields = [];

            for (var i = 0; i < tmpFields.length; i++) {
                var f = fields[i];
                if (f instanceof TS.Field) {
                    this.fields.push(f);
                } else {
                    this.fields.push(this.createFieldFromValue(f));
                }
            }

			this.id = id;
			this.creationTimestamp = creationTimestamp;
			this.lastModificationTimestamp = lastModificationTimestamp;
			this.expiration = expiration;
			this.major = major;
			this.minor = minor;
			this.version = version;
			this.username = username;
		},

        'private': {
            /**
             * Wrapps a value according to its type into a field
             * @param f the value to wrapped into a field
             * @private
             */
            createFieldFromValue: function(f) {
                if (typeof f === 'number') {
                    if (f % 1 === 0) {
                        if (f > 2147483647 || f < -2147483648) {
                            throw new Error('Integer value must be between -2147483648 and 2147483647. Your value "' + f + '" is outside the range of Java Integer. Instantiate a float field explicitly!');
                        }
                        return new TS.Field('actual', 'integer', f);
                    } else if (f % 1 !==0) {
                        return new TS.Field('actual', 'double', f);
                    }
                } else if (typeof f === 'string') {
                    return new TS.Field('actual', 'string', f);
                } else if (typeof f === 'boolean') {
                    return new TS.Field('actual', 'boolean', f);
                } else {
                    throw new Error('Fields array contains a non mappable field value: ' + f + '\n' + JSON.stringify(f))
                }
            }
        },

		'public': {

			/**
			 * Adds a new Field to the tuple
			 * @param {TS.Field} field The field to be added
			 * @public
			 */
			addField: function(field) {
				if(field instanceof TS.Field) {
					this.fields.push(field);
					return field;
				} else {
                    var wrappedField = this.createFieldFromValue(f);
                    this.fields.push(wrappedField);
                    return wrappedField;
				}
			},

			/**
			 * Returns all fields of the tuple
			 * @return {Array} The array of TS.Fields
			 * @public
			 */
			getFields: function() {
				return this.fields;
			},

			/**
			 * Returns the field with a given index
			 * @param {Number} idx Index of the field
			 * @return {TS.Field} The TS.Field
			 * @public
			 */
			getField: function(idx) {
				return this.fields[idx];
			},

			/**
			 * Returns the count of fields
			 * @return {Number} The count of fields
			 * @public
			 */
			getFieldCount: function() {
				return this.fields.length;
			},

			/**
			 * Returns the tuple id
			 * @return {Number} The tuple id
			 * @public
			 */
			getTupleID: function() {
				return this.id;
			},

			/**
			 * Returns the creationTimestamp
			 * @return {Number} The creationTimestamp
			 * @public
			 */
			getCreationTimestamp: function() {
				return this.creationTimestamp;
			},

			/**
			 * Returns the expiration
			 * @return {Number} The expiration
			 * @public
			 */
			getExpiration: function() {
				return this.expiration;
			},

			/**
			 * Returns the lastModificationTimestamp
			 * @return {Number} The lastModificationTimestamp
			 * @public
			 */
			getLastModificationTimestamp: function() {
				return this.lastModificationTimestamp;
			},

			/**
			 * Returns the tuple with formal fields
			 * @returns {TS.Tuple} The tuple template
			 * @public
			 */
			getTemplate: function() {
				var fields = [];
				for(var i = 0, il = this.fields.length; i < il; i++) {
					fields.push(
						new TS.Field('formal', this.fields[i].getType(), null)
					);
				}
				return new TS.Tuple(fields);
			},

			getSignature: function() {
				var signature = '';
				for(var i = 0, il = this.fields.length; i < il; i++) {
					signature += this.fields[i].getType()
				}
				return signature;
			},

			/**
			 * Sets the tuple id
			 * @param {Number} id The tuple id
			 * @public
			 */
			setTupleID: function(id) {
				this.id = id;
			},

			/**
			 * Sets the creationTimestamp
			 * @param {Number} creationTimestamp The tuple creationTimestamp
			 * @public
			 */
			setCreationTimestamp: function(creationTimestamp) {
				this.creationTimestamp = creationTimestamp;
			},

			/**
			 * Sets the expiration
			 * @param {Number} expiration The tuple expiration
			 * @public
			 */
			setExpiration: function(expiration) {
				this.expiration = expiration;
			},

			/**
			 * Sets the lastModificationTimestamp
			 * @param {Number} lastModificationTimestamp The tuple lastModificationTimestamp
			 * @public
			 */
			setLastModificationTimestamp: function(lastModificationTimestamp) {
				this.lastModificationTimestamp = lastModificationTimestamp;
			},

			/**
	    	 * Returns a JSON representation of the tuple
	    	 * @returns {JSON} The JSON representation of the tuple
	    	 * @public
	    	 */
			toJSON: function() {
				var fields = [];

				for(var i = 0, il = this.fields.length; i < il; i++) {
					fields.push(
						this.fields[i].toJSON()
					);
				}

				return {
					'class': 'tuple',
					'id': this.id,
					'creationTimestamp': this.creationTimestamp,
					'lastModificationTimestamp': this.lastModificationTimestamp,
                    'expiration': this.expiration,
					'major': this.major,
					'minor': this.minor,
					'version': this.version,
					'space': this.space,
					'username': this.username,
					'fields': fields
				}
			},

			/**
	    	 * Sets the properties of the tuple with an JSON object
	    	 * @param {Object} data
	    	 * @public
	    	 */
			fromJSON: function(data) {
				this.id = data.id || null;
				this.creationTimestamp = data.creationTimestamp || null;
				this.lastModificationTimestamp = data.lastModificationTimestamp || null;
				this.expiration = data.expiration || null;
				this.major = data.major || null;
				this.minor = data.minor || null;
				this.version = data.version || null;
				this.username = data.username || null;

				if(data.fields && data.fields.length) {
					for(var i = 0, il = data.fields.length; i < il; i++) {
						var field = new TS.Field();
						field.fromJSON(data.fields[i])
						this.addField(field);
					}
				}
			}
		}
	});

	/**
     * Creates a new TS.Version
     * @param {Number} version The version
     * @param {Number} major The major
     * @param {Number} minor The minor
     * @param {Number} branch The branch of the version
     * @param {String} name The name of the version
     * @param {Number} group The group id
     * @param {Number} lockedByUser The id of the user who locked the version
     * @param {Boolean} shared
     * @class
     */
	TS.Version = TS.Class(/** @lends TS.Version */{
		'constructor': function(version, major, minor, branch, name, group, lockedByUser, shared) {
			this.version = version;
			this.major = major;
			this.minor  = minor;
			this.branch = branch;
			this.name = name;
			this.group = group;
			this.lockedByUser = lockedByUser;
			this.shared = shared;
		},

		'public': {
			/**
			 * Returns the version
			 * @returns {Number} The version
			 * @public
			 */
			getVersion: function() {
	    		return this.version;
	    	},

	    	/**
			 * Returns the major
			 * @returns {Number} The major
			 * @public
			 */
	    	getMajor: function() {
	    		return this.major;
	    	},

	    	/**
			 * Returns the minor
			 * @returns {Number} The minor
			 * @public
			 */
	    	getMinor: function() {
	    		return this.minor;
	    	},

	    	/**
			 * Returns the branch
			 * @returns {Number} The branch
			 * @public
			 */
	    	getBranch: function() {
	    		return this.branch;
	    	},

	    	/**
			 * Returns the name
			 * @returns {String} The name
			 * @public
			 */
	    	getName: function() {
	    		return this.name;
	    	},

	    	/**
			 * Returns the group
			 * @returns {Number} The group
			 * @public
			 */
	    	getGroup: function() {
	    		return this.group;
	    	},

	    	/**
	    	 * Returns a JSON representation of the version
	    	 * @returns {JSON} The JSON representation of the version
	    	 * @public
	    	 */
	    	toJSON: function() {
	    		return {
	    			'class': 'version',
	    			'version': this.version,
					'major': this.major,
					'minor': this.minor,
					'branch': this.branch,
					'name': this.name,
					'group': this.group,
					'lockedByUser': this.lockedByUser,
					'shared': this.shared
	    		}
	    	},

	    	/**
	    	 * Sets the properties of the version with an JSON object
	    	 * @param {Object} data
	    	 * @public
	    	 */
	    	fromJSON: function(data) {
	    		this.version = data.version || null;
				this.major = data.major || null;
				this.minor  = data.minor || null;
				this.branch = data.branch || null;
				this.name = data.name || null;
				this.group = data.group || null;
				this.lockedByUser = data.lockedByUser || null;
				this.shared = data.shared || null;
	    	}
		}

	})

	/**
     * Creates a new TS.Space
     * @param {String} name The name of the space
     * @param {Number} id The id of the space
     * @param {TS.Version} version the version of the space
     * @class
     */
	TS.Space = TS.Class(/** @lends TS.Space */{

		'constructor': function(name, id, version) {
			this.name = name;
			this.id = id;
			this.version = version;
		},

		'public': {

			/**
			 * Returns the name
			 * @returns {String} The name
			 * @public
			 */
			getName: function() {
	    		return this.name;
	    	},

	    	/**
			 * Returns the id
			 * @returns {Number} The id
			 * @public
			 */
	    	getID: function() {
	    		return this.id;
	    	},

	    	/**
			 * Returns the version
			 * @returns {TS.Version} The version
			 * @public
			 */
	    	getVersion: function() {
	    		return this.version;
	    	},

	    	/**
	    	 * Returns a JSON representation of the space
	    	 * @returns {JSON} The JSON representation of the space
	    	 * @public
	    	 */
	    	toJSON: function() {
	    		return {
	    			'class': 'space',
	    			'id': this.fieldtype,
	    			'name': this.name,
	    			'version': this.version
	    		}
	    	},

	    	/**
	    	 * Sets the properties of the space with an JSON object
	    	 * @param {Object} data
	    	 * @public
	    	 */
	    	fromJSON: function(data) {
	    		this.id = data.id || null;
				this.name = data.name || null;
				var version = new TS.Version();
				version.fromJSON(data.version || {});
	    	}
		}
	});

	/**
     * Creates a new TS.TupleSpace
     * @param options
     * @param {String} options.host The host of the web socket server
     * @param {String} options.port The port of the web socket server
     * @param {String} options.endpoint The endpoint of the web socket server
     * @param {String} options.user The username to connect with
     * @param {String} options.password The password to connect with
     * @param {String} options.space The space
     * @param {Object} options.connector The connector object (TS.Connector by default)
     * @param {Function} options.onCallback Called if a message was sent to the client without a request
     * @class
     */
	TS.TupleSpace = TS.Class(/** @lends TS.TupleSpace */{

		'constructor': function(options, readyCallback) {
			var self = this;
			options = options || {};

			this.space = null;
			this.connected = false;
			this.callbacks = [];

			// Setup messenger, if no connector object was passed create a TS.Connector
			this.connector = options.connector || new TS.Connector({
				host: options.host || 'localhost',
				port: options.port || 8080,
				endpoint: options.endpoint || 'ws-json',
				onCallback: function(data) {
					// This method will be called if a message was sent
					// to the client without a request (e.g. for server callbacks)
					self.handleCallback(data);
				},
				onError: function(msg) {
					if(typeof options.onError == 'function') options.onError.call(this, msg);
				}
			});

			// Connect to tuplespace
			this.connect(
				options.user || 'sqlspaces',
				options.password || 'sqlspaces',
				options.space || 'defaultspace',
				// Called when the connected
				function() {
					if(typeof readyCallback == 'function') readyCallback.call(this);
				}
			);
		},

		'private': {

			/**
	    	 * Handles the callback
	    	 * @private
	    	 */
			handleCallback: function(data) {
				var id = data.seq;
				if(typeof this.callbacks[id] !== 'undefined') {

					if(typeof data.after.tuple !== 'undefined') {
						var tuple = new TS.Tuple();
						tuple.fromJSON(data.after.tuple);
						data.after.tuple = tuple;
					}

					if(typeof data.before.tuple !== 'undefined') {
						var tuple = new TS.Tuple();
						tuple.fromJSON(data.before.tuple);
						data.before.tuple = tuple;
					}

					this.callbacks[id].call(this, data);
				}
			},

			/**
	    	 * Connect to the tuple space
	    	 * @param {String} user The username to connect with
			 * @param {String} password The password to connect with
			 * @param {String} space The space
	    	 * @private
	    	 */
			connect: function(user, password, space, callback) {
				var self = this;

				this.send({
					connect: {
						'spaces': {'space': {'textcontent': space}},
						'user': {'textcontent': user},
						'password': {'textcontent': password}
					}
				}, function(data) {
					// Check if a tuple array was passed
					if(data.response && typeof data.response.tuples.length) {
						var tuple = new TS.Tuple();

						// Create a new tuple from the response
					    tuple.fromJSON(data.response.tuples[0]);

					    // Create space from tuple
					    self.space = new TS.Space(
					    	tuple.getField(0).getValue(), // name
					    	tuple.getField(1).getValue(), // id
					    	new TS.Version(
					    		tuple.getField(2).getValue(),	// version
								tuple.getField(3).getValue(),	// major
								tuple.getField(4).getValue(),	// minor
								tuple.getField(5).getValue(),	// branch
								tuple.getField(6).getValue(),	// name
								tuple.getField(7).getValue(),	// group
								tuple.getField(8).getValue(),	// lockedByUser
								tuple.getField(9).getValue()	// shared
					    	)
						);

						self.connected = true;
					    TS.Utils.log('Connected to tuple space');

					    // Call the callback
					    if(typeof callback == 'function') callback.call(this);

					} else {
						// Invalid response from server
						throw new Error(data);
					}
				});
			},

			/**
	    	 * Sends a message to the connector
	    	 * @param {String} message The message to be sent
			 * @param {Function} callback The function to be called when a response arrives
	    	 * @private
	    	 */
			send: function(message, callback, id) {
				// Send the request to the connector
				this.connector.send(message, callback, id || null);
			},

			/**
			 * @private
			 */
			query: function(type, tuple, callback, options) {
				var self = this;
				options = options || {};

				this.tryTupleSpace(function() {
					if(tuple instanceof TS.Tuple) {
						self.send({
							'query': {
								'type': type,
								'randomize': options.randomize || 'true',
								'returning': options.returning || 'true',
								'windowsize': options.windowsize || null,
								'space': options.spaceId || self.space.getID(),
								'tuple': tuple.toJSON()
							}
						}, function(data) {
							console.log(data);
                            // Call the callback and pass the data
                            if(typeof callback == 'function') callback.call(this, data);
						// Send the id (for iterative queries)
						}, options.id || null);
					} else {
						throw new Error('Tuple must be an instance of TS.Tuple');
					}
				});
			},

			/**
			 * @private
			 */
			getVersions: function(callback, options) {
				var self = this;
				options = options || {};

				this.tryTupleSpace(function() {
					self.send({
						'get-versions': {
							'spaceid': self.space.getID(),
							'user': options.user || 'false',
							'all': options.all || 'true'
						}
					}, function(data) {
						if(data.response.tuples && data.response.tuples.length) {
							var versions = [];
							for(var i = 0, il = data.response.tuples.length; i < il; i++) {
								// Create a version from the tuple, created from response
								var t = new TS.Tuple();
                                var v = new TS.Version();
								t.fromJSON(data.response.tuples[i]);

								versions.push(new TS.Version(
									t.getField(0).getValue(),	// version
									t.getField(1).getValue(),	// major
									t.getField(2).getValue(),	// minor
									t.getField(3).getValue(),	// branch
									t.getField(4).getValue(),	// name
									t.getField(5).getValue(),	// group
									t.getField(6).getValue(),	// lockedByUser
									t.getField(7).getValue()	// shared
								));

							}
							if(typeof callback == 'function') callback.call(this, versions);
						}
					})
				});
			},

			/**
			 * @private
			 */
			setVersion: function(callback, options) {
				var self = this;
				options = options || {};

                this.tryTupleSpace(function() {
                    var currentVersion = self.space.getVersion();
                    self.send({
                        'set-version' : {
                            'old-versionsid': options['old-versionsid'] || currentVersion.getVersion(),
                            'major': options['major'] || currentVersion.getMajor(),
                            'minor': options['minor'] || currentVersion.getMinor(),
                            'branch': options['branch'] || currentVersion.getBranch(),
                            'name': options['name'] || currentVersion.getName(),
                            'group': options['group'] || currentVersion.getGroup(),
                            'new-version': options['new-version'] || 'false',
                            'spaceid': options['spaceid'] || self.space.getID()
                        }
                    }, function (data) {
                        // Check if a tuple array was passed
                        if(data.response.tuples && data.response.tuples.length) {
                            // Create a version from the tuple, created from response
                            var t = new TS.Tuple();
                            t.fromJSON(data.response.tuples[0]);
                            var version = new TS.Version(
                                t.getField(0).getValue(),	// version
                                t.getField(1).getValue(),	// major
                                t.getField(2).getValue(),	// minor
                                t.getField(3).getValue(),	// branch
                                t.getField(4).getValue(),	// name
                                t.getField(5).getValue(),	// group
                                t.getField(6).getValue()	// lockedByUser
                            );
                            self.space.version = version;
                            if(typeof callback == 'function') callback.call(this, version);
                        }
                    });
                });
            },

			/**
			 * @private
			 */
			transaction: function(callback, options) {
				var self = this;
				options = options || {};

				this.tryTupleSpace(function() {
					self.send({
						'transaction': {
							"type": options.type || null
						}
					}, function(data) {
						if(data.response) {
							if(typeof callback == 'function') callback.call(this,
								data.response.type === 'ok'
							);
						}
					})
				});
			},

			/**
			 * @private
			 */
			tryTupleSpace: function(callback) {
				var self = this, interval, iterations = 0;

				if(this.connected == true) {
					callback.call();
				} else {
					interval = setInterval(function() {
						iterations++;
						TS.Utils.log('Wait for tuplespace (' + iterations + ')');

						if(self.connected == true) {
							clearInterval(interval);
							callback.call();
						} else if (iterations == 10) {
							clearInterval(interval);
							TS.Utils.log('TupleSpace wasn\'t able to react after 10 tries');
						}
					}, 500);
				}
			},

            /**
             * @private
             */
            parseTuple: function(data) {
                var tuple = null;
                if(data.response.tuples) {
                    // Create a new tuple from the response
                    tuple = new TS.Tuple();
                    tuple.fromJSON(data.response.tuples[0]);
                }
                return tuple;
            },

            /**
             * @private
             */
            parseTupleArray: function(data) {
                var tuples = null;
                if(data.response.tuples) {
                    tuples = [];
                    for(var i = 0, il = data.response.tuples.length; i < il; i++) {
                        var t = new TS.Tuple();
                        t.fromJSON(data.response.tuples[i]);
                        tuples.push(t);
                    }
                }
                return tuples;
            }
		},

		'public': {

			/**
			 * Writes given Tuple into the currently connected Space
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			write: function(tuple, callback) {
				var self = this;
				this.tryTupleSpace(function() {
					if(tuple instanceof TS.Tuple) {
						self.send({
							'write': {
								'space': self.space.getID(),
								'tuple': tuple.toJSON()
							}
						}, function(data) {
							// Check if a tuple array was passed
							if(data.response && typeof data.response.tuples.length) {
								var tuple = new TS.Tuple();

								// Create a new tuple from the response
							    tuple.fromJSON(data.response.tuples[0]);

								// Call the callback and pass the tuple id
							    if(typeof callback == 'function') callback.call(this,
							    	// Get the first field, which contains the id of the written tuple
							    	tuple.getField(0).getValue()
							    );
							} else {
								// Invalid response from server
								throw new Error(data);
							}
						})
					} else {
						throw new Error('Tuple must be an instance of TS.Tuple');
					}
				});
			},

			update: function(tupleId, tuple, callback) {
				var self = this;
				this.tryTupleSpace(function() {
					if(tuple instanceof TS.Tuple) {
						self.send({
							'update': {
								'tupleid': {'id': tupleId},
								'tuple': tuple.toJSON()
							}
						}, function(data) {
							console.log(data);
                            if(typeof callback == 'function') callback.call(this,
                                data.response.type === 'ok'
                            );
						});
					} else {
						throw new Error('Tuple must be an instance of TS.Tuple');
					}
				});
			},

			/**
			 * Takes a Tuple (if any) matching given template.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			take: function(tuple, callback) {
                var self = this;
                if (tuple.getTupleID()) {
                    throw "Template Tuple for take operation must not provide an id. Check your code or use takeTupleById instead!"
                }
				this.query('take', tuple, function(data) {
                    var tuple = self.parseTuple(data);
					if(typeof callback == 'function') callback.call(this, tuple);
				});
			},

			/**
			 * Takes all Tuples matching given template.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			takeAll: function(tuple, callback) {
                var self = this;
                this.query('takeAll', tuple, function(data) {
					var tuples = self.parseTupleArray(data);
					if(typeof callback == 'function') callback.call(this, tuples);
				});
			},

			/**
			 * Takes first Tuple matching given template.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			takeFirst: function(tuple, callback) {
                var self = this;
                this.query('take', tuple, function(data) {
                    var tuple = self.parseTuple(data);
					if(typeof callback == 'function') callback.call(this, tuple);
				}, {randomize: 'false'});
			},

			/**
			 * Takes Tuple having given TupleID.
			 * @param {Number} id The tuple id
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			takeTupleById: function(id, callback) {
                var self = this;
                var tuple = new TS.Tuple([], id);
				this.query('take', tuple, function(data) {
                    var tuple = self.parseTuple(data);
					if(typeof callback == 'function') callback.call(this, tuple);
				}, {randomize: 'false'});
			},

			/**
			 * Reads a Tuple matching passed tuple from database.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			read: function(tuple, callback) {
                var self = this;
				this.query('read', tuple, function(data) {
                    var tuple = self.parseTuple(data);
					if(typeof callback == 'function') callback.call(this, tuple);
				});
			},

			/**
			 * Reads all matching Tuples.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
             * @param {Object} options object, may contain the following options
             *      windowsize Result limit per server query
             *      id Id of the server query
             * @public
			 */
			readAll: function(tuple, callback, options) {
                var self = this;
				this.query('readAll', tuple, function(data) {
                    var tuples = self.parseTupleArray(data);
					if(typeof callback == 'function') callback.call(this, tuples, data.response.id);
				}, options);
			},

			/**
			 * Reads first matching Tuple.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			readFirst: function(tuple, callback) {
                var self = this;
                this.query('readFirst', tuple, function(data) {
                    var tuple = self.parseTuple(data);
					if(typeof callback == 'function') callback.call(this, tuple);
				});
			},

			/**
			 * Reads first matching Tuple.
			 * @param {TS.Tuple} tuple The tuple
			 * @param {Function} callback The method to be called when a response arrives
			 * @public
			 */
			readTupleById: function(id, callback) {
                var self = this;
                var tuple = new TS.Tuple([], id);
				this.query('read', tuple, function(data) {
                    var tuple = self.parseTuple(data);
					if(typeof callback == 'function') callback.call(this, tuple);
				}, {randomize: 'false'});
			},

            /**
             * Deletes a random matching Tuple.
             * @param {TS.Tuple} tuple The tuple template
             * @param {Function} callback The method to be called when a response arrives, receives true if successfully deleted
             */
			delete: function(tuple, callback) {
                this.query('take', tuple, function(data) {
					var tuple = new TS.Tuple();
					// Create a new tuple from the response
					tuple.fromJSON(data.response.tuples[0]);
					// Create answer true/false
					var answer = tuple.getField(0).getValue() == '1';
					if(typeof callback == 'function') callback.call(this, answer);
				}, {returning: 'false'});
			},

            /**
             * Deletes all matching Tuple.
             * @param {TS.Tuple} tuple The tuple template
             * @param {Function} callback The method to be called when a response arrives, receives {Number} of deleted tuples
             * @param {Number} spaceId The spaceId of the space to delete from
             */
			deleteAll: function(tuple, callback, spaceId) {
				this.query('takeAll', tuple, function(data) {
					var tuple = new TS.Tuple();
					// Create a new tuple from the response
					tuple.fromJSON(data.response.tuples[0]);
					// Create answer true/false
					var numberOfDeteledTuples = tuple.getField(0).getValue();
					if(typeof callback == 'function') callback.call(this, numberOfDeteledTuples);
				}, {returning: 'false', spaceId: spaceId});
			},

            /**
             * Deletes the first matching Tuple.
             * @param {TS.Tuple} tuple The tuple template
             * @param {Function} callback The method to be called when a response arrives, receives true if successfully deleted
             */
			deleteFirst: function(tuple, callback) {
				this.query('take', tuple, function(data) {
					var tuple = new TS.Tuple();
					// Create a new tuple from the response
					tuple.fromJSON(data.response.tuples[0]);
					// Create answer true/false
					var answer = tuple.getField(0).getValue() == '1';
					if(typeof callback == 'function') callback.call(this, answer);
				}, {returning: 'false', randomize: 'false'});
			},

            /**
             * Returns the number of matching Tuple.
             * @param {TS.Tuple} tuple The tuple template
             * @param {Function} callback The method to be called when a response arrives, receives the {Number} of found tuples
             * @param {Number} spaceId The spaceId of the space to delete from
             */
			count: function(tuple, callback, spaceId) {
				this.query('readAll', tuple, function(data) {
					var tuple = new TS.Tuple();
					// Create a new tuple from the response
					tuple.fromJSON(data.response.tuples[0]);
					if(typeof callback == 'function') callback.call(this, tuple.getField(0).getValue());
				}, {returning: 'false'});
			},

            /**
             * Returns the current connected Space
             * @param {Function} callback The method to be called when a response arrives, receives a {TS.Space}
             */
			getCurrentSpace: function(callback) {
				var self = this;
				this.tryTupleSpace(function() {
					if(typeof callback == 'function') callback.call(this, self.space);
				});
			},

            /**
             * Returns all existing spaces on the TupleSpace server
             * @param {Function} callback The method to be called when a response arrives, receives a {TS.Space} array
             */
			getAllSpaces: function(callback) {
				var self = this;
				this.tryTupleSpace(function() {
					self.send({
						'get-all-spaces': {}
					}, function(data) {
						// Check if a tuple array was passed
						if(data.response.tuples && data.response.tuples.length) {
							var spaces = [];
							for(var i = 0, il = data.response.tuples.length; i < il; i++) {
								// Create a space from the tuple, created from response
								var t = new TS.Tuple();
								t.fromJSON(data.response.tuples[i]);
								spaces.push(new TS.Space(
									t.getField(0).getValue(),	// name
									t.getField(1).getValue()	// id
								));
							}
							if(typeof callback == 'function') callback.call(this, spaces);
						}
					})
				});
			},

            /**
             * Returns the space names of all existing spaces on the TupleSpace server
             * @param {Function} callback The method to be called when a response arrives, receives a {String} array
             */
			getSpaceNames: function(callback) {
				this.getAllSpaces(function(spaces) {
					var names = [];
					for(var i = 0, il = spaces.length; i < il; i++) names.push(spaces[i].getName());
					if(typeof callback == 'function') callback.call(this, names);
				});
			},

			getAllVersions: function(callback) {
				this.getVersions(function(versions) {
					if(typeof callback == 'function') callback.call(this, versions);
				});
			},

			getAllUserVersions: function(callback) {
				this.getVersions(function(versions) {
					if(typeof callback == 'function') callback.call(this, versions);
				}, {user: 'true'});
			},

			getCurrentVersion: function(callback) {
				this.getVersions(function(versions) {
					if(typeof callback == 'function') callback.call(this, versions[0]);
				}, {all: 'false'});
			},

			getCurrentUserVersion: function(callback) {
				this.getVersions(function(versions) {
					if(typeof callback == 'function') callback.call(this, versions);
				}, {all: 'false', user: 'true'});
			},

			switchToVersion: function(version, callback) {
				this.setVersion(function(version) {
					if(typeof callback == 'function') callback.call(this, version);
				}, {
					'old-versionsid': version.getVersion()
				});
			},

			createNewVersion: function(callback) {
				this.setVersion(function(version) {
					if(typeof callback == 'function') callback.call(this, version);
				}, {'new-version': 'true'});
			},

			beginTransaction: function(callback) {
				this.transaction(function(data) {
					if(typeof callback == 'function') callback.call(this, data);
				}, {type: 'begin'});
			},

			commitTransaction: function(callback) {
				this.transaction(function(data) {
					if(typeof callback == 'function') callback.call(this, data);
				}, {type: 'commit'});
			},

			abortTransaction: function(callback) {
				this.transaction(function(data) {
					if(typeof callback == 'function') callback.call(this, data);
				}, {type: 'abort'});
			},

            /**
             * Registers a callback {Function} to the connected space. Registered callback is invoked
             * if a {TS.Tuple} matching the given template undergoes the given command {String}.
             *
             * @param {String } command The command for the event (write, delete, update, all)
             * @param {TS.Tuple} tuple The tuple template
             * @param {Function} notifyCallback The function to be called if an registered event occurs,
             *          receives some properties plus the tuples as before and after attributes
             * @param {Function} callback The function to be called after a successful registration of
             *          the event, receives an registration id as a {Number}
             */
			eventRegister: function(command, tuple, notifyCallback, callback) {
				var self = this;
				if(tuple instanceof TS.Tuple) {
					this.tryTupleSpace(function() {
						self.send({
							'event-register': {
								'command': command,
								'major': self.space.getVersion().getMajor(),
								'minor': self.space.getVersion().getMinor(),
								'version': self.space.getVersion().getVersion(),
								'after': {
									'tuple': tuple.toJSON()
								},
								'before': {}
							}
						}, function(data) {
							// Check if a tuple array was passed
							if(data.response.tuples && data.response.tuples.length) {
								var tuple = new TS.Tuple(),
									callbackId = null;

								// Create a new tuple from the response
								tuple.fromJSON(data.response.tuples[0]);

								// Callbacks
								callbackId = tuple.getField(0).getValue();
								// Save reference to notifyCallback
								self.callbacks[callbackId] = notifyCallback;
								// Call standard callback for passing callback id
								if(typeof callback == 'function') callback.call(this, callbackId);
							}
						});
					});
				} else {
					throw new Error('Tuple must be an instance of TS.Tuple');
				}
			},

			eventDeregister: function(callbackId, callback) {
				var self = this;
				this.tryTupleSpace(function() {
					self.send({
						'event-deregister': {
							'seq': callbackId
						}
					}, function(data) {
						if(typeof callback == 'function') callback.call(this, callbackId);
					});
				});
			},

			disconnect: function(callback) {
				var self = this;
				this.tryTupleSpace(function() {
					self.send({'disconnect': {}});
				});
			}
		}

	});

	TS.RemoteAdmin = TS.Class({

		'constructor': function(options) {
			var self = this;
			options = options || {};

			this.locked = false;
			this.waitingCallback;

			this.clients = [];

			// Setup connector, if no connector object was passed create a TS.Connector
			this.connector = options.connector || new TS.Connector({
				host: options.host || null,
				port: options.port || null,
				endpoint: options.endpoint || null,
				json: false,
				through: true,
				onCallback: function(data) {
					self.onMessage(data);
				},
				onError: function(msg) {
					if(typeof options.onError == 'function') options.onError.call(this, msg);
				}
			});

			this.onCallback = options.onCallback || function() {}

			this.modes = {
				1: 'INVESTIGATOR',
				2: 'VIZARD'
			}

			this.notifications = {
				'ADD_CLIENT': function(data) {
					self.addClient(data);
					self.unlock();
					self.onCallback.call(this, {
						client: data,
						action: 'ADD_CLIENT'
					});
				},
				'REMOVE_CLIENT': function(data) {
					self.removeClient(data);
					self.unlock();
					self.onCallback.call(this, {
						client: data,
						action: 'REMOVE_CLIENT'
					});
				},
				'ACTION_OCCURED': function(data) {
					var self = this, responses = [], tuple;

					// Add the first response to the array.
					responses.push(data);

					// Set callback for further responses
					self.waitingCallback = addResponse = function(response) {
						if(response == 'EOL') {
							tuple = new TS.Tuple();
							tuple.fromJSON(JSON.parse(responses[2]).tuple);
							self.unlock();

							self.onCallback.call(this, {
								client: responses[0],
								action: responses[1],
								tuple: tuple
							});
						} else {
							responses.push(response);
						}
					}
				},
				'INITIAL_STATE': function(data) {
					var self = this, clients, tuple, tuples = [];

					// First response is the list of clients
					clients = data.split(';');

					self.waitingCallback = function(response) {
						if(response == 'EOL') {
					self.unlock();
							self.onCallback.call(this, {
								clients: clients,
								tuples: tuples,
								action: 'INITIAL_STATE'
							})
						} else {
							tuple = new TS.Tuple();
							tuple.fromJSON(JSON.parse(response).tuple);
							tuples.push(tuple);
				}

			}

				}
			}

			// Set INVESTIGATOR mode by default
			this.setMode(
				options.mode || 1,
				options.spaceName || 1,
				options.version || 0,
				options.initialState || false
			);
		},

		'private' : {
			tryRemoteAdmin: function(callback) {
				var self = this, interval,iterations = 0;

				if(this.locked == false) {
					callback.call();
				} else {
					interval = setInterval(function() {
						iterations++;
						TS.Utils.log('Wait for remote admin (' + iterations + ')');

						if(self.locked == false) {
							clearInterval(interval);
							callback.call();
						} else if (iterations == 10) {
							clearInterval(interval);
							TS.Utils.log('Remote Admin wasn\'t able to react after 10 tries');
						}

					}, 100);
				}
			},

			lock: function(callback) {
				TS.Utils.log('LOCKED!');
				this.locked = true;
				this.waitingCallback = callback || function(){};
			},

			unlock: function() {
				TS.Utils.log('UNLOCKED!');
				this.waitingCallback = function(){};
				this.locked = false;
			},

			send: function(message, callback) {
				var self = this;

				this.tryRemoteAdmin(function() {
					if(typeof callback !== 'undefined') {
						self.lock(callback);
					}
					// If the message is not an array, convert it
					if(!(typeof message == 'object' && message.length)) message = [message];
					for(var i = 0, il = message.length; i < il; i++) self.connector.send(message[i]);
				});
			},

			onMessage: function(data) {
				var self = this, msg = data.data;
				TS.Utils.log('Incomming Message \n' + msg);

				if(typeof this.notifications[msg] !== 'undefined') {
					self.lock(function(_data) {
						self.notifications[msg].call(this, _data);
					});
				} else {
					this.waitingCallback(msg);
				}
			},

			addClient: function(client) {
				TS.Utils.log('Added client ' + client);
				this.clients.push(client);
			},

			removeClient: function(client) {
				delete this.clients[client];
			},

			handleAction: function(data) {
				if(response == 'EOL') {
					self.unlock();
					callback.call(this, responses);
				} else {
					responses.push(response);
				}
			}
		},

		'public': {
			setMode: function(mode, spaceName, version, initialState) {
				var self = this;
				if(typeof this.modes[mode] !== 'undefined') {
					this.send(this.modes[mode] + ' JSON ' + initialState + ' ' + spaceName);
				} else {
					throw new Error('This mode is not available');
				}
			},

			getHealth: function(callback) {
				var self = this, responses = [];
				var addResponse = function(response) {
					if(response == 'EOL') {
						self.unlock();
						callback.call(this, responses);
					} else {
						responses.push(response);
					}
				}

				this.send('GET_HEALTH', function(data) {
					addResponse(data);
				});
			},

			getDbProps: function(callback) {
				var self = this, responses = [];
				var addResponse = function(response) {
					responses.push(response);
					if(responses.length == 3) {
						self.unlock();
						callback.call(this, responses);
					}
				}

				this.send('GET_DB_PROPS', function(data) {
					addResponse(data);
				});
			},

			getConnections: function(callback) {
				var self = this, connections = [];
				this.send('GET_CONNS', function(data) {
					self.unlock();

					// Remove quotes and split string
					connections = data.replace(/\"/g,'').split('; ');
					callback.call(this, connections);
				});
			},

			getClients: function(callback) {
				var self = this;
				this.tryRemoteAdmin(function() {
					callback.call(this, self.clients);
				});
			},

			getTupleProps: function(spaceId, version, callback) {
				var self = this, responses = [];
				var addResponse = function(response) {
					var signature, tuple;

					if(response == 'EOL') {
						self.unlock();
						callback.call(this, responses);
					} else {
						response = response.split(',');
						signature = response[0].split('_');
						tuple = new TS.Tuple();

						for(var i = 0, il = signature.length; i < il; i++) {
							tuple.addField(
								TS.createFormalField(signature[i].toLowerCase())
							);
						}
						responses.push({tuple: tuple, length: response[1]});
					}
				}

				this.send(['GET_TUPLE_PROPS', spaceId + ', ' + version], function(data) {
					addResponse(data);
				});
			},

			invokeGarbageManager: function(callback) {
				var self = this;
				this.send('INVOKE_GM', function(data) {
					self.unlock();
					callback.call();
				});
			},

			disconnect: function() {
				this.connector.disconnect();

			}
		}
	});

}).call(this);