/*global YAHOO,window */

//JADO edited to use jQuery UI drag and drop
(function () {

	var util = YAHOO.util;
	var lang = YAHOO.lang, CSS_PREFIX = "WireIt-";

	/**
	 * This class is used for wire edition. It inherits from YAHOO.util.DDProxy and acts as a "temporary" Terminal.
	 * @class TerminalProxy
	 * @namespace WireIt
	 * @extends YAHOO.util.DDProxy
	 * @constructor
	 * @param {WireIt.Terminal} terminal Parent terminal
	 * @param {Object} options Configuration object (see "termConfig" property for details)
	 */
	WireIt.TerminalProxy = function (terminal, options) {

		/**
		 * Reference to the terminal parent
		 */
		this.terminal = terminal;

		/**
		 * Object containing the configuration object
		 * <ul>
		 *   <li>type: 'type' of this terminal. If no "allowedTypes" is specified in the options, the terminal will only connect to the same type of terminal</li>
		 *   <li>allowedTypes: list of all the allowed types that we can connect to.</li>
		 *   <li>{Integer} terminalProxySize: size of the drag drop proxy element. default is 10 for "10px"</li>
		 * </ul>
		 * @property termConfig
		 */
			// WARNING: the object config cannot be called "config" because YAHOO.util.DDProxy already has a "config" property
		this.termConfig = options || {};

		this.terminalProxySize = options.terminalProxySize || 2;

//		console.log("size " + this.terminalProxySize);

		/**
		 * Object that emulate a terminal which is following the mouse
		 */
		this.fakeTerminal = null;

		// Init the DDProxy
//		WireIt.TerminalProxy.superclass.constructor.call(this, this.terminal.el, undefined, {
//			dragElId: "WireIt-TerminalProxy",
//			resizeFrame: false,
//			centerFrame: true
//		});


		if(GLOBAL_WORKBENCH && GLOBAL_WORKBENCH.options && GLOBAL_WORKBENCH.options.tapToConnect)
		{
			console.log("initTapToConnect done in SISOBContainer");
//			this.initTapToConnect();
		}
		else
		{
			this.initDragAndDrop();
		}



	};

// Mode Intersect to get the DD objects
	util.DDM.mode = util.DDM.INTERSECT;



//	lang.extend(WireIt.TerminalProxy, YAHOO.util.DDProxy, {
	WireIt.TerminalProxy.prototype = {

		getDragEl: function()
		{
			return this.terminal.el;
		},

		initDragAndDrop: function () {
			var self = this;

			if(this.terminal.isInput)return;

			var terminalElement = $(this.terminal.el).uniqueId();

			console.log("initDD");
			console.log(this);

			terminalElement.draggable({ revert: false, helper: null,
				start: function(event, ui){
					console.log("drag start");

					// highlight possible target containers
					if( GLOBAL_WORKBENCH != null)
					{
						var containers = GLOBAL_WORKBENCH.layer.containers;
						for(var i=0;i<containers.length;++i)
						{
							var c = containers[i];

							var currentContainerId = event.currentTarget.parentNode.id;
							if(currentContainerId == c.el.id){
//								console.log("skipping self");
								continue;
							}

							if(c.inputs != null && c.inputs.length > 0)
							{

								//
								var hasFreeTerminals = false;
								var len = c.terminals.length;
								for(var v=0;v<len;++v)
								{
									var terminal = c.terminals[v];
//									console.log("isInput: " + terminal.isInput);
									if( terminal.isInput && terminal.wires.length == 0 )
									{
										hasFreeTerminals = true;
										break;
									}
								}
								// skip to next container
								if(!hasFreeTerminals) continue;


								var jContainer = $(c.el);

								console.log("making droppable ");
								console.log(jContainer);

								jContainer.addClass("connection-target-highlight");

								jContainer.droppable( {
									accept: ".WireIt-Terminal-SISOB-Out",
									hoverClass: "connection-target-hover",
									tolerance: "pointer",
									drop: function(event, ui)
									{
										// unfortunately we can not use the c (the container) from the
										//  surrounding method because will will only have the value from
										//  the last added container
										var id = $(this).attr('id');
										var cont = null;
										for(var k=0;k<containers.length;++k)
										{
											console.log(containers[k]);
											if(containers[k].el.id == id)
											{
												cont = containers[k];
											}
										}
										if(cont==null)return;

										// get the first unconnected terminal
										for(var i=0;i< cont.terminals.length;i++)
										{
											if(cont.terminals[i].wires.length==0)
											{
												self.newOnDragDrop(self, terminalElement, cont.terminals[i]);
												break;
											}
										}
									}
								});

								jContainer.droppable("option", "disabled", false);

							}
						}
					}




					// If only one wire admitted, we remove the previous wire
					if (self.terminal.nMaxWires == 1 && self.terminal.wires.length == 1) {
						self.terminal.wires[0].remove();
					}
					// If the number of wires is at its maximum, prevent editing...
					else if (self.terminal.wires.length >= self.terminal.nMaxWires) {
						return;
					}

					var halfProxySize = self.terminalProxySize / 2;
					self.fakeTerminal = {
						direction: self.terminal.fakeDirection,
						pos: [200, 200],
						addWire: function () {
						},
						removeWire: function () {
						},
						getXY: function () {
							var layers = YAHOO.util.Dom.getElementsByClassName('WireIt-Layer');
							if (layers.length > 0) {
								var orig = YAHOO.util.Dom.getXY(layers[0]);
								return [this.pos[0] - orig[0] + halfProxySize, this.pos[1] - orig[1] + halfProxySize];
							}
							return this.pos;
						}
					};

					var parentEl = self.terminal.parentEl.parentNode;
					if (self.terminal.container) {
						parentEl = self.terminal.container.layer.el;
					}

					var klass = WireIt.wireClassFromXtype(self.terminal.editingWireConfig.xtype);

					self.editingWire = new klass(self.terminal, self.fakeTerminal, parentEl, self.terminal.editingWireConfig);
					YAHOO.util.Dom.addClass(self.editingWire.element, CSS_PREFIX + 'Wire-editing');
				},

				helper: function(e){
					return $( "<div>&nbsp;</div>" );
				},

				drag: function(e){

					console.log("drag");

					// Prevention when the editing wire could not be created (due to nMaxWires)
					if (!self.editingWire) {
						return;
					}

					if (self.terminal.container) {
						var obj = self.terminal.container.layer.el;
						var curleft = 0;
						// Applied patch from http://github.com/neyric/wireit/issues/#issue/27
						// Fixes issue with Wire arrow being drawn offset to the mouse pointer
						var curtop = 0;
						if (obj.offsetParent) {
							do {
								curleft += obj.scrollLeft;
								curtop += obj.scrollTop;
								obj = obj.offsetParent;
							} while (obj);
						}
						self.fakeTerminal.pos = [e.clientX + curleft, e.clientY + curtop];
					}
					else {
						self.fakeTerminal.pos = (YAHOO.env.ua.ie) ? [e.clientX, e.clientY] : [e.clientX + window.pageXOffset, e.clientY + window.pageYOffset];
					}
					self.editingWire.redraw();
				},

				stop: function(e){
					console.log("stop");

					if(GLOBAL_WORKBENCH)
					{
						var containers = GLOBAL_WORKBENCH.layer.containers;
						for(var i=0;i<containers.length;++i)
						{
							var c = containers[i];
							if(c.inputs != null && c.inputs.length > 0)
							{
								var e = $(c.el);
								e.removeClass("connection-target-highlight");
								try{
								e.droppable("option", "disabled", true);
								}catch(err)
								{
									console.log("uninitialised disable of droppable");
								}

								for(var w=0;w< c.terminals.length;w++)
								{
									var term = c.terminals[w];
									try{
										$(term.el).droppable("option", "disabled", true);
									}catch(err)
									{
										console.log("uninitialised disable of droppable");
									}
								}
							}
						}


					}

					if (self.editingWire) {
						self.editingWire.remove();
						self.editingWire = null;
					}
				}

			});

			var self = this, body = document.body;
			if (!body || !body.firstChild) {
				window.setTimeout(function () {
					self.createFrame();
				}, 50);
				return;
			}
			var div = this.getDragEl(), Dom = YAHOO.util.Dom;
			if (!div) {
				div = document.createElement("div");
				div.id = this.dragElId;
				var s = div.style;
				s.position = "absolute";
				s.visibility = "hidden";
				s.cursor = "move";
				s.border = "2px solid #aaa";
				s.zIndex = 999;
				var size = this.terminalProxySize + "px";
				s.height = size;
				s.width = size;
				var _data = document.createElement('div');
				Dom.setStyle(_data, 'height', '100%');
				Dom.setStyle(_data, 'width', '100%');
				Dom.setStyle(_data, 'background-color', '#ccc');
				Dom.setStyle(_data, 'opacity', '0');
				div.appendChild(_data);
				body.insertBefore(div, body.firstChild);
			}
		},



			newOnDragDrop: function (self, sourceTerminal, targetTerminal) {
			console.log("onNewDragDrop");

			var i;

			// Prevention when the editing wire could not be created (due to nMaxWires)
			if (!self.editingWire) {
				return;
			}

			// Remove the editing wire
			self.editingWire.remove();
			self.editingWire = null;

			// Don't create the wire if it already exists between the 2 terminals !!
			var termAlreadyConnected = false;
			for (i = 0; i < self.terminal.wires.length; i++) {
				if (self.terminal.wires[i].terminal1 == this.terminal) {
					if (self.terminal.wires[i].terminal2 == targetTerminal) {
						termAlreadyConnected = true;
						break;
					}
				}
				else if (self.terminal.wires[i].terminal2 == self.terminal) {
					if (self.terminal.wires[i].terminal1 == targetTerminal) {
						termAlreadyConnected = true;
						break;
					}
				}
			}

			// Create the wire only if the terminals aren't connected yet
			if (termAlreadyConnected) {
				//console.log("terminals already connected ");
				return;
			}

			var parentEl = self.terminal.parentEl.parentNode;
			if (self.terminal.container) {
				parentEl = self.terminal.container.layer.el;
			}

			// Switch the order of the terminals if tgt as the "alwaysSrc" property
			var term1 = self.terminal;
			var term2 = targetTerminal;
			if (term2.alwaysSrc) {
				term1 = targetTerminal;
				term2 = self.terminal;
			}

			var klass = WireIt.wireClassFromXtype(term1.wireConfig.xtype);

			// Check the number of wires for this terminal
			var tgtTerm = targetTerminal, w;
			if (tgtTerm.nMaxWires == 1) {
				if (tgtTerm.wires.length > 0) {
					tgtTerm.wires[0].remove();
				}

				w = new klass(term1, term2, parentEl, term1.wireConfig);
				w.redraw();
			}
			else if (tgtTerm.wires.length < tgtTerm.nMaxWires) {
				w = new klass(term1, term2, parentEl, term1.wireConfig);
				w.redraw();
			}
			/*else {
			 console.log("Cannot connect to this terminal: nMaxWires = ", ddTargets[0].terminal.nMaxWires);
			 }*/

			var srcId = term1.parentEl.id;
			var tgtId = term2.parentEl.id;


		},

		// to distinct from other YAHOO.util.DragDrop objects
		isWireItTerminal: true,


		/**
		 * @method isValidWireTerminal
		 */
		isValidWireTerminal: function (DDterminal) {
			console.log("isValidWireTerminal");
			console.log(DDterminal);
			if (!DDterminal.isWireItTerminal) {
				return false;
			}

			// If this terminal has the type property:
			if (this.termConfig.type) {
				if (this.termConfig.allowedTypes) {
					if (WireIt.indexOf(DDterminal.termConfig.type, this.termConfig.allowedTypes) == -1) {
						return false;
					}
				}
				else {
					if (this.termConfig.type != DDterminal.termConfig.type) {
						return false;
					}
				}
			}
			// The other terminal may have type property too:
			else if (DDterminal.termConfig.type) {
				if (DDterminal.termConfig.allowedTypes) {
					if (WireIt.indexOf(this.termConfig.type, DDterminal.termConfig.allowedTypes) == -1) {
						return false;
					}
				}
				else {
					if (this.termConfig.type != DDterminal.termConfig.type) {
						return false;
					}
				}
			}

			// Check the allowSelfWiring
			if (this.terminal.container) {
				if (this.terminal.container.preventSelfWiring) {
					if (DDterminal.terminal.container == this.terminal.container) {
						return false;
					}
				}
			}

			// Verkabelung von Terminals gleicher Richtung ( in -> in / out -> out ) verhindern! (Prevent cabling of wires with same direction)
			if(DDterminal.terminal.direction[1]){
				//alert(DDterminal.terminal.direction[1] + " : " + this.terminal.direction[1]);
				if(DDterminal.terminal.direction[1] == this.terminal.direction[1]){
					return false;
				}
			}

			return true;
		}

	};

})();

/*global YAHOO */
(function () {

	var util = YAHOO.util;
	var Event = util.Event, lang = YAHOO.lang, Dom = util.Dom, CSS_PREFIX = "WireIt-";

	/**
	 * Terminals represent the end points of the "wires"
	 * @class Terminal
	 * @constructor
	 * @param {HTMLElement} parentEl Element that will contain the terminal
	 * @param {Object} options Configuration object
	 * @param {WireIt.Container} container (Optional) Container containing this terminal
	 */
	WireIt.Terminal = function (parentEl, options, container) {

		/**
		 * @property name
		 * @description Name of the terminal
		 * @type String
		 * @default null
		 */
		this.name = null;

		/**
		 * @property parentEl
		 * @description DOM parent element
		 * @type DOMElement
		 */
		this.parentEl = parentEl;

		/**
		 * @property container
		 * @description Container (optional). Parent container of this terminal
		 * @type WireIt.Container
		 */
		this.container = container;

		/**
		 * @property wires
		 * @description List of the associated wires
		 * @type Array
		 */
		this.wires = [];


		this.setOptions(options);

		/**
		 * Event that is fired when a wire is added
		 * You can register this event with myTerminal.eventAddWire.subscribe(function(e,params) { var wire=params[0];}, scope);
		 * @event eventAddWire
		 */
		this.eventAddWire = new util.CustomEvent("eventAddWire");

		/**
		 * Event that is fired when a wire is removed
		 * You can register this event with myTerminal.eventRemoveWire.subscribe(function(e,params) { var wire=params[0];}, scope);
		 * @event eventRemoveWire
		 */
		this.eventRemoveWire = new util.CustomEvent("eventRemoveWire");

		/**
		 * DIV dom element that will display the Terminal
		 * @property el
		 * @type {HTMLElement}
		 */
		this.el = null;


		this.render();

		// Create the TerminalProxy object to make the terminal editable
		if (this.editable) {
			this.dd = new WireIt.TerminalProxy(this, this.ddConfig);
			this.scissors = new WireIt.Scissors(this);
		}
	};

	WireIt.Terminal.prototype = {

		/**
		 * @property xtype
		 * @description String representing this class for exporting as JSON
		 * @default "WireIt.Terminal"
		 * @type String
		 */
		xtype: "WireIt.Terminal",

		/**
		 * @property direction
		 * @description direction vector of the wires when connected to this terminal
		 * @type Array
		 * @default [0,1]
		 */
		direction: [0, 1],

		/**
		 * @property fakeDirection
		 * @description direction vector of the "editing" wire when it started from this terminal
		 * @type Array
		 * @default [0,-1]
		 */
		fakeDirection: [0, -1],

		/**
		 * @property editable
		 * @description boolean that makes the terminal editable
		 * @type Boolean
		 * @default true
		 */
		editable: true,

		/**
		 * @property nMaxWires
		 * @description maximum number of wires for this terminal
		 * @type Integer
		 * @default Infinity
		 */
		nMaxWires: Infinity,

		/**
		 * @property wireConfig
		 * @description Options for the wires connected to this terminal
		 * @type Object
		 * @default {}
		 */
		wireConfig: {},

		/**
		 * @property editingWireConfig
		 * @description Options for the wires connected to this terminal
		 * @type Object
		 * @default {}
		 */
		editingWireConfig: {},

		/**
		 * @property className
		 * @description CSS class name for the terminal element
		 * @default "WireIt-Terminal"
		 * @type String
		 */
		className: "WireIt-Terminal",

		/**
		 * @property connectedClassName
		 * @description CSS class added to the terminal when it is connected
		 * @default "WireIt-connected"
		 * @type String
		 */
		connectedClassName: "WireIt-Terminal-connected",

		/**
		 * @property dropinviteClassName
		 * @description CSS class added for drop invitation
		 * @default "WireIt-dropinvite"
		 * @type String
		 */
		dropinviteClassName: "WireIt-Terminal-dropinvite",

		/**
		 * @property offsetPosition
		 * @description offset position from the parentEl position. Can be an array [top,left] or an object {left: 100, bottom: 20} or {right: 10, top: 5} etc...
		 * @default null
		 * @type Array
		 */
		offsetPosition: null,

		/**
		 * @property alwaysSrc
		 * @description forces this terminal to be the src terminal in the wire config
		 * @type Boolean
		 * @default false
		 */
		alwaysSrc: false,

		/**
		 * @property ddConfig
		 * @description configuration of the WireIt.TerminalProxy object
		 * @type Object
		 * @default {}
		 */
		ddConfig: false,


		/**
		 * Set the options by putting them in this (so it overrides the prototype default)
		 * @method setOptions
		 */
		setOptions: function (options) {
			for (var k in options) {
				if (options.hasOwnProperty(k)) {
					this[k] = options[k];
				}
			}

			// Set fakeDirection to the opposite of direction
			if (options.direction && !options.fakeDirection) {
				this.fakeDirection = [ -options.direction[0], -options.direction[1] ];
			}

			// Set the editingWireConfig to the wireConfig if specified
			if (options.wireConfig && !options.editingWireConfig) {
				this.editingWireConfig = this.wireConfig;
			}
		},

		/**
		 * Show or hide the drop invitation. (by adding/removing this.options.dropinviteClassName CSS class)
		 * @method setDropInvitation
		 * @param {Boolean} display Show the invitation if true, hide it otherwise
		 */
		setDropInvitation: function (display) {
			if (display) {
				Dom.addClass(this.el, this.dropinviteClassName);
			}
			else {
				Dom.removeClass(this.el, this.dropinviteClassName);
			}
		},

		/**
		 * Render the DOM of the terminal
		 * @method render
		 */
		render: function () {

			// Create the DIV element
			this.el = WireIt.cn('div', {className: this.className});
			if (this.name) {
				this.el.title = this.name;
			}

			// Set the offset position
			this.setPosition(this.offsetPosition);

			// Append the element to the parent
			this.parentEl.appendChild(this.el);







		},

		/**
		 * TODO
		 */
		setPosition: function (pos) {
			if (pos) {
				// Clear the current position
				this.el.style.left = "";
				this.el.style.top = "";
				this.el.style.right = "";
				this.el.style.bottom = "";

				// Kept old version [x,y] for retro-compatibility
				if (lang.isArray(pos)) {
					this.el.style.left = pos[0] + "px";
					this.el.style.top = pos[1] + "px";
				}
				// New version: {top: 32, left: 23}
				else if (lang.isObject(pos)) {
					for (var key in pos) {
						if (pos.hasOwnProperty(key) && pos[key] !== "") { //This will ignore the number 0 since 0 == "" in javascript (firefox 3.0
							this.el.style[key] = pos[key] + "px";
						}
					}
				}
			}
		},

		/**
		 * Add a wire to this terminal.
		 * @method addWire
		 * @param {WireIt.Wire} wire Wire instance to add
		 */
		addWire: function (wire) {

			// Adds this wire to the list of connected wires :
			this.wires.push(wire);

			// Set class indicating that the wire is connected
			Dom.addClass(this.el, this.connectedClassName);

			// Fire the event
			this.eventAddWire.fire(wire);
		},

		/**
		 * Remove a wire
		 * @method removeWire
		 * @param {WireIt.Wire} wire Wire instance to remove
		 */
		removeWire: function (wire) {
			var index = WireIt.indexOf(wire, this.wires);
			if (index != -1) {

				this.wires[index].destroy();

				this.wires[index] = null;
				this.wires = WireIt.compact(this.wires);

				// Remove the connected class if it has no more wires:
				if (this.wires.length === 0) {
					Dom.removeClass(this.el, this.connectedClassName);
				}

				// Fire the event
				this.eventRemoveWire.fire(wire);
			}
		},

		/**
		 * This function is a temporary test. I added the border width while traversing the DOM and
		 * I calculated the offset to center the wire in the terminal just after its creation
		 * @method getXY
		 */
		getXY: function () {

			var layerEl = this.container && this.container.layer ? this.container.layer.el : document.body;

			var obj = this.el;
			var curleft = 0, curtop = 0;
			if (obj.offsetParent) {
				do {
					curleft += obj.offsetLeft;
					curtop += obj.offsetTop;
					obj = obj.offsetParent;
				} while (!!obj && obj != layerEl);
			}

			//JADO
			var element = $(this.el);
			var heightOffset = element.height()/2;
			// for outputs let the wire start right under the element
			//  for input elements make it stop under the element at half of its height
			if(!this.isInput)
			{
				heightOffset = element.height();
			}
			return [curleft + element.width()/2, curtop + heightOffset];
		},

		/**
		 * Remove the terminal from the DOM
		 * @method remove
		 */
		remove: function () {
			// This isn't very nice but...
			// the method Wire.remove calls Terminal.removeWire to remove the reference
			while (this.wires.length > 0) {
				this.wires[0].remove();
			}
			this.parentEl.removeChild(this.el);

			// Remove all event listeners
			Event.purgeElement(this.el);

			// Remove scissors widget
			if (this.scissors) {
				Event.purgeElement(this.scissors.get('element'));
			}

		},

		/**
		 * Returns a list of all the terminals connecter to this terminal through its wires.
		 * @method getConnectedTerminals
		 * @return  {Array}  List of all connected terminals
		 */
		getConnectedTerminals: function () {
			var terminalList = [];
			if (this.wires) {
				for (var i = 0; i < this.wires.length; i++) {
					terminalList.push(this.wires[i].getOtherTerminal(this));
				}
			}
			return terminalList;
		},

		/**
		 * Redraw all the wires connected to this terminal
		 * @method redrawAllWires
		 */
		redrawAllWires: function () {
			if (this.wires) {
				for (var i = 0; i < this.wires.length; i++) {
					this.wires[i].redraw();
				}
			}
		},

		/**
		 * Remove all wires
		 * @method removeAllWires
		 */
		removeAllWires: function () {
			while (this.wires.length > 0) {
				this.wires[0].remove();
			}

			//JADO
			// Remove scissors widget
			if (this.scissors) {
				Event.purgeElement(this.scissors.get('element'));
			}
		}

	};

})();
/*global YAHOO */
/**
 * Class that extends Terminal to differenciate Input/Output terminals
 * @class WireIt.util.TerminalInput
 * @extends WireIt.Terminal
 * @constructor
 * @param {HTMLElement} parentEl Parent dom element
 * @param {Object} options configuration object
 * @param {WireIt.Container} container (Optional) Container containing this terminal
 */
WireIt.util.TerminalInput = function (parentEl, options, container) {
	WireIt.util.TerminalInput.superclass.constructor.call(this, parentEl, options, container);
};
YAHOO.lang.extend(WireIt.util.TerminalInput, WireIt.Terminal, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.TerminalInput"
	 * @type String
	 */
	xtype: "WireIt.TerminalInput",

	/**
	 * @property direction
	 * @description direction vector of the wires when connected to this terminal
	 * @type Array
	 * @default [0,-1]
	 */
	direction: [0, -1],

	/**
	 * @property fakeDirection
	 * @description direction vector of the "editing" wire when it started from this terminal
	 * @type Array
	 * @default [0,1]
	 */
	fakeDirection: [0, 1],

	/**
	 * @property nMaxWires
	 * @description maximum number of wires for this terminal
	 * @type Integer
	 * @default 1
	 */
	nMaxWires: 1,

	/**
	 * @property ddConfig
	 * @description configuration of the WireIt.TerminalProxy object
	 * @type Object
	 * @default { type: "input", allowedTypes: ["output"] }
	 */
	ddConfig: { type: "input", allowedTypes: ["output"] }

});
/*global YAHOO */
/**
 * Class that extends Terminal to differenciate Input/Output terminals
 * @class WireIt.util.TerminalOutput
 * @extends WireIt.Terminal
 * @constructor
 * @param {HTMLElement} parentEl Parent dom element
 * @param {Object} options configuration object
 * @param {WireIt.Container} container (Optional) Container containing this terminal
 */
WireIt.util.TerminalOutput = function (parentEl, options, container) {
	WireIt.util.TerminalOutput.superclass.constructor.call(this, parentEl, options, container);
};
YAHOO.lang.extend(WireIt.util.TerminalOutput, WireIt.Terminal, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.TerminalOutput"
	 * @type String
	 */
	xtype: "WireIt.TerminalOutput",

	/**
	 * @property direction
	 * @description direction vector of the wires when connected to this terminal
	 * @type Array
	 * @default [0,1]
	 */
	direction: [0, 1],

	/**
	 * @property fakeDirection
	 * @description direction vector of the "editing" wire when it started from this terminal
	 * @type Array
	 * @default [0,-1]
	 */
	fakeDirection: [0, -1],

	/**
	 * @property ddConfig
	 * @description configuration of the WireIt.TerminalProxy object
	 * @type Object
	 * @default  { type: "output", allowedTypes: ["input"] }
	 */
	ddConfig: { type: "output", allowedTypes: ["input"] },

	/**
	 * @property alwaysSrc
	 * @description forces this terminal to be the src terminal in the wire config
	 * @type Boolean
	 * @default true
	 */
	alwaysSrc: true

});

/**
 * Class that extends Terminals to have labels
 * @class WireIt.SISOBTerminal
 * @extends WireIt.Terminal
 * @constructor
 * @param {HTMLElement} parentEl Parent dom element
 * @param {Object} options configuration object
 * @param {WireIt.Container} container (Optional) Container containing this terminal
 */
WireIt.SISOBTerminalOutput = function (parentEl, options, container) {
	WireIt.SISOBTerminalOutput.superclass.constructor.call(this, parentEl, options, container);
};
YAHOO.lang.extend(WireIt.SISOBTerminalOutput, WireIt.util.TerminalOutput, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.SISOBTerminal"
	 * @type String
	 */
	xtype: "WireIt.SISOBTerminalOutput",

	className: "WireIt-Terminal-SISOB-Out",

	label: "",
	/**
	 * Set the options by putting them in this (so it overrides the prototype default)
	 * @method setOptions
	 //    */
//   setOptions: function(options) {
//
//	   WireIt.SISOBTerminal.superclass.setOptions(options);
//
//	   this.label = options.label;
//   },
	/**
	 * Render the DOM of the terminal
	 * @method render
	 */
	render: function () {

//		console.log("TERMINAL: ");
//		console.log(this);

		// Create the DIV element
		this.el = WireIt.cn('div', {className: this.className});
		if (this.label) {
			this.el.title = this.label;
		}

		// Set the offset position
		this.setPosition(this.offsetPosition);

		// Append the element to the parent
		this.parentEl.appendChild(this.el);

	}
});


/**
 * Class that extends Terminals to have labels
 * @class WireIt.SISOBTerminal
 * @extends WireIt.Terminal
 * @constructor
 * @param {HTMLElement} parentEl Parent dom element
 * @param {Object} options configuration object
 * @param {WireIt.Container} container (Optional) Container containing this terminal
 */
WireIt.SISOBTerminalInput = function (parentEl, options, container) {
	WireIt.SISOBTerminalInput.superclass.constructor.call(this, parentEl, options, container);
};
YAHOO.lang.extend(WireIt.SISOBTerminalInput, WireIt.util.TerminalInput, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.SISOBTerminal"
	 * @type String
	 */
	xtype: "WireIt.SISOBTerminalInput",

	className: "WireIt-Terminal-SISOB-In",

	label: "",
	/**
	 * Set the options by putting them in this (so it overrides the prototype default)
	 * @method setOptions
	 //    */
//   setOptions: function(options) {
//
//	   WireIt.SISOBTerminal.superclass.setOptions(options);
//
//	   this.label = options.label;
//   },
	/**
	 * Render the DOM of the terminal
	 * @method render
	 */
	render: function () {

//		console.log("TERMINAL: ");
//		console.log(this);

		// Create the DIV element
		this.el = WireIt.cn('div', {className: this.className});
		if (this.label) {
			this.el.title = this.label;
		}

		// Set the offset position
		this.setPosition(this.offsetPosition);

		// Append the element to the parent
		this.parentEl.appendChild(this.el);

	}
});