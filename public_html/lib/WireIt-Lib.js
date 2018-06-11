/*global YAHOO */
/**
 * WireIt provide classes to build wirable interfaces
 * @module WireIt
 */
/**
 * @class WireIt
 * @static
 * @namespace WireIt
 */
var WireIt = {


	/**
	 * TODO
	 */

	defaultWireClass: "WireIt.BezierArrowWire", // TODO how to handle wires?

	wireClassFromXtype: function (xtype) {
		return this.classFromXtype(xtype, this.defaultWireClass);
	},


	defaultTerminalClass: "WireIt.Terminal",

	terminalClassFromXtype: function (xtype) {
		return this.classFromXtype(xtype, this.defaultTerminalClass);
	},


	defaultContainerClass: "WireIt.Container",

	containerClassFromXtype: function (xtype) {
		return this.classFromXtype(xtype, this.defaultContainerClass);
	},

	/**
	 * default
	 */
	classFromXtype: function (xtype, defaultXtype) {
		var path = (xtype || defaultXtype).split('.');
		var klass = window;
		for (var i = 0; i < path.length; i++) {
			klass = klass[path[i]];
		}

		if (!YAHOO.lang.isFunction(klass)) {
			throw new Error("WireIt unable to find klass from xtype: '" + xtype + "'");
		}

		return klass;
	},

	/**
	 * Get a css property in pixels and convert it to an integer
	 * @method getIntStyle
	 * @namespace WireIt
	 * @static
	 * @param {HTMLElement} el The element
	 * @param {String} style css-property to get
	 * @return {Integer} integer size
	 */
	getIntStyle: function (el, style) {
		var sStyle = YAHOO.util.Dom.getStyle(el, style);
		return parseInt(sStyle.substr(0, sStyle.length - 2), 10);
	},

	/**
	 * Helper function to set DOM node attributes and style attributes.
	 * @method sn
	 * @static
	 * @param {HTMLElement} el The element to set attributes to
	 * @param {Object} domAttributes An object containing key/value pairs to set as node attributes (ex: {id: 'myElement', className: 'myCssClass', ...})
	 * @param {Object} styleAttributes Same thing for style attributes. Please use camelCase for style attributes (ex: backgroundColor for 'background-color')
	 */
	sn: function (el, domAttributes, styleAttributes) {
		if (!el) {
			return;
		}
		var i;
		if (domAttributes) {
			for (i in domAttributes) {
				if (domAttributes.hasOwnProperty(i)) {
					var domAttribute = domAttributes[i];
					if (typeof (domAttribute) == "function") {
						continue;
					}
					if (i == "className") {
						i = "class";
						el.className = domAttribute;
					}
					if (domAttribute !== el.getAttribute(i)) {
						if (domAttribute === false) {
							el.removeAttribute(i);
						} else {
							el.setAttribute(i, domAttribute);
						}
					}
				}
			}
		}
		if (styleAttributes) {
			for (i in styleAttributes) {
				if (styleAttributes.hasOwnProperty(i)) {
					if (typeof (styleAttributes[i]) == "function") {
						continue;
					}
					if (el.style[i] != styleAttributes[i]) {
						el.style[i] = styleAttributes[i];
					}
				}
			}
		}

	},


	/**
	 * Helper function to create a DOM node. (wrapps the document.createElement tag and the inputEx.sn functions)
	 * @method cn
	 * @static
	 * @param {String} tag The tagName to create (ex: 'div', 'a', ...)
	 * @param {Object} [domAttributes] see inputEx.sn
	 * @param {Object} [styleAttributes] see inputEx.sn
	 * @param {String} [innerHTML] The html string to append into the created element
	 * @return {HTMLElement} The created node
	 */
	cn: function (tag, domAttributes, styleAttributes, innerHTML) {
		var el = document.createElement(tag);
		this.sn(el, domAttributes, styleAttributes);
		if (innerHTML) {
			el.innerHTML = innerHTML;
		}
		return el;
	},

	/**
	 * indexOf replace Array.indexOf for cases where it isn't available (IE6 only ?)
	 * @method indexOf
	 * @static
	 * @param {Any} el element to search for
	 * @param {Array} arr Array to search into
	 * @return {Integer} element index or -1 if not found
	 */
	indexOf: YAHOO.lang.isFunction(Array.prototype.indexOf) ?
		function (el, arr) {
			return arr.indexOf(el);
		} :
		function (el, arr) {
			for (var i = 0; i < arr.length; i++) {
				if (arr[i] == el) {
					return i;
				}
			}
			return -1;
		},

	/**
	 * compact replace Array.compact for cases where it isn't available
	 * @method compact
	 * @static
	 *
	 * @param {Array} arr Array to compact
	 * @return {Array} compacted array
	 */
	compact: YAHOO.lang.isFunction(Array.prototype.compact) ?
		function (arr) {
			return arr.compact();
		} :
		function (arr) {
			var n = [];
			for (var i = 0; i < arr.length; i++) {
				if (arr[i]) {
					n.push(arr[i]);
				}
			}
			return n;
		}
};


/**
 * WireIt.util contains utility classes
 */
WireIt.util = {};
/*global YAHOO,WireIt,G_vmlCanvasManager,document */
(function () {

	// Shortcuts
	var Event = YAHOO.util.Event, UA = YAHOO.env.ua;

	/**
	 * Create a canvas element and wrap cross-browser hacks to resize it
	 * @class CanvasElement
	 * @namespace WireIt
	 * @constructor
	 * @param {HTMLElement} parentNode The canvas tag will be append to this parent DOM node.
	 */
	WireIt.CanvasElement = function (parentNode) {

		/**
		 * The canvas element
		 * @property element
		 * @type HTMLElement
		 */
		this.element = document.createElement('canvas');

		// Append to parentNode
		parentNode.appendChild(this.element);

		// excanvas.js for dynamic canvas tags
		if (typeof (G_vmlCanvasManager) != "undefined") {
			this.element = G_vmlCanvasManager.initElement(this.element);
		}

	};

	WireIt.CanvasElement.prototype = {

		/**
		 * Get a drawing context
		 * @method getContext
		 * @param {String} [mode] Context mode (default "2d")
		 * @return {CanvasContext} the context
		 */
		getContext: function (mode) {
			return this.element.getContext(mode || "2d");
		},

		/**
		 * Purge all event listeners and remove the component from the dom
		 * @method destroy
		 */
		destroy: function () {
			var el = this.element;

			// Remove from DOM
			if (YAHOO.util.Dom.inDocument(el)) {
				el.parentNode.removeChild(el);
			}

			// recursively purge element
			Event.purgeElement(el, true);
		},

		/**
		 * Set the canvas position and size.
		 * <b>Warning:</b> This method changes the <i>element</i> property under some brother. Don't copy references !
		 * @method SetCanvasRegion
		 * @param {Number} left Left position
		 * @param {Number} top Top position
		 * @param {Number} width New width
		 * @param {Number} height New height
		 */
		SetCanvasRegion: UA.ie ?
			// IE
			function (left, top, width, height) {
				var el = this.element;
				WireIt.sn(el, null, {left: left + "px", top: top + "px", width: width + "px", height: height + "px"});
				el.getContext("2d").clearRect(0, 0, width, height);
				this.element = el;
			} :
			( (UA.webkit || UA.opera) ?
				// Webkit (Safari & Chrome) and Opera
				function (left, top, width, height) {
					var el = this.element;
					var newCanvas = WireIt.cn("canvas", {className: el.className || el.getAttribute("class"), width: width, height: height}, {left: left + "px", top: top + "px"});
					var listeners = Event.getListeners(el);
					for (var listener in listeners) {
						if (listeners.hasOwnProperty(listener)) {
							var l = listeners[listener];
							Event.addListener(newCanvas, l.type, l.fn, l.obj, l.adjust);
						}
					}
					Event.purgeElement(el);
					el.parentNode.replaceChild(newCanvas, el);
					this.element = newCanvas;
				} :
				// Other (Firefox)
				function (left, top, width, height) {
					WireIt.sn(this.element, {width: width, height: height}, {left: left + "px", top: top + "px"});
				})
	};

})();
/*global YAHOO */
/**
 * The wire widget that uses a canvas to render
 * @class Wire
 * @namespace WireIt
 * @extends WireIt.CanvasElement
 * @constructor
 * @param  {WireIt.Terminal}    terminal1   Source terminal
 * @param  {WireIt.Terminal}    terminal2   Target terminal
 * @param  {HTMLElement} parentEl    Container of the CANVAS tag
 * @param  {Obj}                options      Wire configuration (see options property)
 */
WireIt.Wire = function (terminal1, terminal2, parentEl, options) {

	/**
	 * Reference to the parent dom element
	 * @property parentEl
	 * @type HTMLElement
	 */
	this.parentEl = parentEl;

	/**
	 * Source terminal
	 * @property terminal1
	 * @type WireIt.Terminal
	 */
	this.terminal1 = terminal1;

	/**
	 * Target terminal
	 * @property terminal2
	 * @type WireIt.Terminal || WireIt.TerminalProxy
	 */
	this.terminal2 = terminal2;


	/**
	 * Event that is fired when a wire is clicked (on the wire, not the canvas)
	 * You can register this event with myWire.eventWireClick.subscribe(function(e,params) { var wire = params[0], xy = params[1];}, scope);
	 * @event eventMouseClick
	 */
	this.eventMouseClick = new YAHOO.util.CustomEvent("eventMouseClick");

	/**
	 * Event that is fired when the mouse enter the wire
	 * You can register this event with myWire.eventMouseIn.subscribe(function(e,params) { var wire = params[0], xy = params[1];}, scope);
	 * @event eventMouseIn
	 */
	this.eventMouseIn = new YAHOO.util.CustomEvent("eventMouseIn");

	/**
	 * Event that is fired when the mouse exits the wire
	 * You can register this event with myWire.eventMouseOut.subscribe(function(e,params) { var wire = params[0], xy = params[1];}, scope);
	 * @event eventMouseOut
	 */
	this.eventMouseOut = new YAHOO.util.CustomEvent("eventMouseOut");

	/**
	 * Event that is fired when the mouse moves inside the wire
	 * You can register this event with myWire.eventMouseMove.subscribe(function(e,params) { var wire = params[0], xy = params[1];}, scope);
	 * @event eventMouseMove
	 */
	this.eventMouseMove = new YAHOO.util.CustomEvent("eventMouseMove");


	// Init the options property
	this.setOptions(options || {});

	// Create the canvas element and append it to parentEl
	WireIt.Wire.superclass.constructor.call(this, this.parentEl);

	// CSS classname
	YAHOO.util.Dom.addClass(this.element, this.className);

	// Label
	if (this.label) {
		this.renderLabel();
	}

	// Call addWire on both terminals
	this.terminal1.addWire(this);
	this.terminal2.addWire(this);
};


YAHOO.lang.extend(WireIt.Wire, WireIt.CanvasElement, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.Wire"
	 * @type String
	 */
	xtype: "WireIt.Wire",

	/**
	 * @property className
	 * @description CSS class name for the wire element
	 * @default "WireIt-Wire"
	 * @type String
	 */
	className: "WireIt-Wire",

	/**
	 * @property cap
	 * @description TODO
	 * @default "round"
	 * @type String
	 */
	cap: 'round',

	/**
	 * @property bordercap
	 * @description TODO
	 * @default "round"
	 * @type String
	 */
	bordercap: 'round',

	/**
	 * @property width
	 * @description Wire width
	 * @default 3
	 * @type Integer
	 */
	width: 3,

	/**
	 * @property borderwidth
	 * @description Border width
	 * @default 1
	 * @type Integer
	 */
	borderwidth: 1,

	/**
	 * @property color
	 * @description Wire color
	 * @default 'rgb(173, 216, 230)'
	 * @type String
	 */
	color: 'rgb(173, 216, 230)',

	/**
	 * @property bordercolor
	 * @description Border color
	 * @default '#0000ff'
	 * @type String
	 */
	bordercolor: '#0000ff',

	/**
	 * @property label
	 * @description Wire label
	 * @default null
	 * @type String
	 */
	label: null,

	/**
	 * @property labelStyle
	 * @description Wire label style
	 * @default null
	 * @type Object
	 */
	labelStyle: null,

	/**
	 * @property labelEditor
	 * @description inputEx field definition for the label editor
	 * @default null
	 * @type Object
	 */
	labelEditor: null,

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
	},

	/**
	 * Remove a Wire from the Dom
	 * @method remove
	 */
	remove: function () {

		// Remove the canvas from the dom
		this.parentEl.removeChild(this.element);

		// Remove the wire reference from the connected terminals
		if (this.terminal1 && this.terminal1.removeWire) {
			this.terminal1.removeWire(this);
		}
		if (this.terminal2 && this.terminal2.removeWire) {
			this.terminal2.removeWire(this);
		}

		// Remove references to old terminals
		this.terminal1 = null;
		this.terminal2 = null;

		// Remove Label
		if (this.labelEl) {
			if (this.labelField) {
				this.labelField.destroy();
			}
			this.labelEl.innerHTML = "";
		}
	},


	/**
	 * This function returns terminal1 if the first argument is terminal2 and vice-versa
	 * @method getOtherTerminal
	 * @param   {WireIt.Terminal} terminal
	 * @return  {WireIt.Terminal} terminal    the terminal that is NOT passed as argument
	 */
	getOtherTerminal: function (terminal) {
		return (terminal == this.terminal1) ? this.terminal2 : this.terminal1;
	},


	/**
	 * Drawing method
	 */
	draw: function () {
		var margin = [4, 4];

		// Get the positions of the terminals
		var p1 = this.terminal1.getXY();
		var p2 = this.terminal2.getXY();

		var min = [ Math.min(p1[0], p2[0]) - margin[0], Math.min(p1[1], p2[1]) - margin[1]];
		var max = [ Math.max(p1[0], p2[0]) + margin[0], Math.max(p1[1], p2[1]) + margin[1]];

		// Store the min, max positions to display the label later
		this.min = min;
		this.max = max;

		// Redimensionnement du canvas
		var lw = Math.abs(max[0] - min[0]);
		var lh = Math.abs(max[1] - min[1]);

		// Convert points in canvas coordinates
		p1[0] = p1[0] - min[0];
		p1[1] = p1[1] - min[1];
		p2[0] = p2[0] - min[0];
		p2[1] = p2[1] - min[1];

		this.SetCanvasRegion(min[0], min[1], lw, lh);

		var ctxt = this.getContext();

		// Draw the border
		ctxt.lineCap = this.bordercap;
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.width + this.borderwidth * 2;
		ctxt.beginPath();
		ctxt.moveTo(p1[0], p1[1]);
		ctxt.lineTo(p2[0], p2[1]);
		ctxt.stroke();

		// Draw the inner bezier curve
		ctxt.lineCap = this.cap;
		ctxt.strokeStyle = this.color;
		ctxt.lineWidth = this.width;
		ctxt.beginPath();
		ctxt.moveTo(p1[0], p1[1]);
		ctxt.lineTo(p2[0], p2[1]);
		ctxt.stroke();
	},

	/**
	 * Redraw the wire and label
	 * @method redraw
	 */
	redraw: function () {

		this.draw();

		if (this.label) {
			this.positionLabel();
		}
	},

	/**
	 * Render the label container
	 */
	renderLabel: function () {

		this.labelEl = WireIt.cn('div', {className: "WireIt-Wire-Label"}, this.labelStyle);

		if (this.labelEditor) {
			this.labelField = new inputEx.InPlaceEdit({parentEl: this.labelEl, editorField: this.labelEditor, animColors: {from: "#FFFF99", to: "#DDDDFF"} });
			this.labelField.setValue(this.label);
		}
		else {
			this.labelEl.innerHTML = this.label;
		}

		this.element.parentNode.appendChild(this.labelEl);

	},

	/**
	 * Set the label
	 */
	setLabel: function (val) {
		if (this.labelEditor) {
			this.labelField.setValue(val);
		}
		else {
			this.labelEl.innerHTML = val;
		}
	},

	/**
	 * Position the label element to the center
	 */
	positionLabel: function () {
		YAHOO.util.Dom.setStyle(this.labelEl, "left", (this.min[0] + this.max[0] - this.labelEl.clientWidth) / 2);
		YAHOO.util.Dom.setStyle(this.labelEl, "top", (this.min[1] + this.max[1] - this.labelEl.clientHeight) / 2);
	},

	/**
	 * Determine if the wire is drawn at position (x,y) relative to the canvas element. This is used for mouse events.
	 * @method wireDrawnAt
	 * @return {Boolean} true if the wire is drawn at position (x,y) relative to the canvas element
	 */
	wireDrawnAt: function (x, y) {
		var ctxt = this.getContext();
		var imgData = ctxt.getImageData(x, y, 1, 1);
		var pixel = imgData.data;
		return !( pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 0 );
	},

	/**
	 * Called by the Layer when the mouse moves over the canvas element.
	 * Note: the event is not listened directly, to receive the event event if the wire is behind another wire
	 * @method onMouseMove
	 * @param {Integer} x left position of the mouse (relative to the canvas)
	 * @param {Integer} y top position of the mouse (relative to the canvas)
	 */
	onMouseMove: function (x, y) {

		if (typeof this.mouseInState === undefined) {
			this.mouseInState = false;
		}

		if (this.wireDrawnAt(x, y)) {
			if (!this.mouseInState) {
				this.mouseInState = true;
				this.onWireIn(x, y);
			}

			this.onWireMove(x, y);
		}
		else {
			if (this.mouseInState) {
				this.mouseInState = false;
				this.onWireOut(x, y);
			}
		}

	},

	/**
	 * When the mouse moves over a wire
	 * Note: this will only work within a layer
	 * @method onWireMove
	 * @param {Integer} x left position of the mouse (relative to the canvas)
	 * @param {Integer} y top position of the mouse (relative to the canvas)
	 */
	onWireMove: function (x, y) {
		this.eventMouseMove.fire(this, [x, y]);
	},

	/**
	 * When the mouse comes into the wire
	 * Note: this will only work within a layer
	 * @method onWireIn
	 * @param {Integer} x left position of the mouse (relative to the canvas)
	 * @param {Integer} y top position of the mouse (relative to the canvas)
	 */
	onWireIn: function (x, y) {
		this.eventMouseIn.fire(this, [x, y]);
	},

	/**
	 * When the mouse comes out of the wire
	 * Note: this will only work within a layer
	 * @method onWireOut
	 * @param {Integer} x left position of the mouse (relative to the canvas)
	 * @param {Integer} y top position of the mouse (relative to the canvas)
	 */
	onWireOut: function (x, y) {
		this.eventMouseOut.fire(this, [x, y]);
	},

	/**
	 * When the mouse clicked on the canvas
	 * Note: this will only work within a layer
	 * @method onClick
	 * @param {Integer} x left position of the mouse (relative to the canvas)
	 * @param {Integer} y top position of the mouse (relative to the canvas)
	 */
	onClick: function (x, y) {
		if (this.wireDrawnAt(x, y)) {
			this.onWireClick(x, y);
		}
	},

	/**
	 * When the mouse clicked on the wire
	 * Note: this will only work within a layer
	 * @method onWireClick
	 * @param {Integer} x left position of the mouse (relative to the canvas)
	 * @param {Integer} y top position of the mouse (relative to the canvas)
	 */
	onWireClick: function (x, y) {
		this.eventMouseClick.fire(this, [x, y]);
	},


	/**
	 * Return the config of this Wire
	 * @method getConfig
	 */
	getConfig: function () {
		var obj = {
			xtype: this.xtype
		};

		// Export the label value
		if (this.labelEditor) {
			obj.label = this.labelField.getValue();
		}

		return obj;
	}


});

/**
 * The step wire widget
 * @class StepWire
 * @namespace WireIt
 * @extends WireIt.Wire
 * @constructor
 * @param  {WireIt.Terminal}    terminal1   Source terminal
 * @param  {WireIt.Terminal}    terminal2   Target terminal
 * @param  {HTMLElement} parentEl    Container of the CANVAS tag
 * @param  {Obj}                options      Wire configuration (see options property)
 */

WireIt.StepWire = function (terminal1, terminal2, parentEl, options) {
	WireIt.StepWire.superclass.constructor.call(this, terminal1, terminal2, parentEl, options);
};


YAHOO.lang.extend(WireIt.StepWire, WireIt.Wire, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.StepWire"
	 * @type String
	 */
	xtype: "WireIt.StepWire",

	/**
	 * Drawing methods for arrows
	 */
	draw: function () {
		var margin = [4, 4];

		// Get the positions of the terminals
		var p1 = this.terminal1.getXY();
		var p2 = this.terminal2.getXY();


		//this.terminal1.direction[0]

		var min = [ Math.min(p1[0], p2[0]) - margin[0], Math.min(p1[1], p2[1]) - margin[1]];
		var max = [ Math.max(p1[0], p2[0]) + margin[0], Math.max(p1[1], p2[1]) + margin[1]];

		// Redimensionnement du canvas
		var lw = Math.abs(max[0] - min[0]);
		var lh = Math.abs(max[1] - min[1]);

		// Convert points in canvas coordinates
		p1[0] = p1[0] - min[0];
		p1[1] = p1[1] - min[1];
		p2[0] = p2[0] - min[0];
		p2[1] = p2[1] - min[1];

		var p3 = [ p2[0], p2[1] ];
		p2[1] = p1[1];

		this.SetCanvasRegion(min[0], min[1], lw, lh);

		var ctxt = this.getContext();

		// Draw the border
		ctxt.lineCap = this.bordercap;
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.width + this.borderwidth * 2;
		ctxt.beginPath();
		ctxt.moveTo(p1[0], p1[1]);
		ctxt.lineTo(p2[0], p2[1]);

		ctxt.lineTo(p3[0], p3[1]);

		ctxt.stroke();

		// Draw the inner bezier curve
		ctxt.lineCap = this.cap;
		ctxt.strokeStyle = this.color;
		ctxt.lineWidth = this.width;
		ctxt.beginPath();

		ctxt.moveTo(p1[0], p1[1]);
		ctxt.lineTo(p2[0], p2[1]);

		ctxt.lineTo(p3[0], p3[1]);

		ctxt.stroke();
	}

});

/**
 * The arrow wire widget
 * @class ArrowWire
 * @namespace WireIt
 * @extends WireIt.Wire
 * @constructor
 * @param  {WireIt.Terminal}    terminal1   Source terminal
 * @param  {WireIt.Terminal}    terminal2   Target terminal
 * @param  {HTMLElement} parentEl    Container of the CANVAS tag
 * @param  {Obj}                options      Wire configuration (see properties)
 */
WireIt.ArrowWire = function (terminal1, terminal2, parentEl, options) {
	WireIt.ArrowWire.superclass.constructor.call(this, terminal1, terminal2, parentEl, options);
};

YAHOO.lang.extend(WireIt.ArrowWire, WireIt.Wire, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.ArrowWire"
	 * @type String
	 */
	xtype: "WireIt.ArrowWire",

	/**
	 * Drawing methods for arrows
	 */
	draw: function () {
		var d = 7; // arrow width/2
		var redim = d + 3; //we have to make the canvas a little bigger because of arrows
		var margin = [4 + redim, 4 + redim];

		// Get the positions of the terminals
		var p1 = this.terminal1.getXY();
		var p2 = this.terminal2.getXY();

		var distance = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

		var min = [ Math.min(p1[0], p2[0]) - margin[0], Math.min(p1[1], p2[1]) - margin[1]];
		var max = [ Math.max(p1[0], p2[0]) + margin[0], Math.max(p1[1], p2[1]) + margin[1]];

		// Store the min, max positions to display the label later
		this.min = min;
		this.max = max;

		// Redimensionnement du canvas

		var lw = Math.abs(max[0] - min[0]) + redim;
		var lh = Math.abs(max[1] - min[1]) + redim;

		p1[0] = p1[0] - min[0];
		p1[1] = p1[1] - min[1];
		p2[0] = p2[0] - min[0];
		p2[1] = p2[1] - min[1];

		this.SetCanvasRegion(min[0], min[1], lw, lh);

		var ctxt = this.getContext();

		// Draw the border
		ctxt.lineCap = this.bordercap;
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.width + this.borderwidth * 2;
		ctxt.beginPath();
		ctxt.moveTo(p1[0], p1[1]);
		ctxt.lineTo(p2[0], p2[1]);
		ctxt.stroke();

		// Draw the inner bezier curve
		ctxt.lineCap = this.cap;
		ctxt.strokeStyle = this.color;
		ctxt.lineWidth = this.width;
		ctxt.beginPath();
		ctxt.moveTo(p1[0], p1[1]);
		ctxt.lineTo(p2[0], p2[1]);
		ctxt.stroke();

		/* start drawing arrows */
		var t1 = p1;
		var t2 = p2;

		var z = [0, 0]; //point on the wire with constant distance (dlug) from terminal2
		var dlug = 20; //arrow length
		var t = (distance === 0) ? 0 : 1 - (dlug / distance);
		z[0] = Math.abs(t1[0] + t * (t2[0] - t1[0]));
		z[1] = Math.abs(t1[1] + t * (t2[1] - t1[1]));

		//line which connects the terminals: y=ax+b
		var a, b;
		var W = t1[0] - t2[0];
		var Wa = t1[1] - t2[1];
		var Wb = t1[0] * t2[1] - t1[1] * t2[0];
		if (W !== 0) {
			a = Wa / W;
			b = Wb / W;
		}
		else {
			a = 0;
		}
		//line perpendicular to the main line: y = aProst*x + b
		var aProst, bProst;
		if (a === 0) {
			aProst = 0;
		}
		else {
			aProst = -1 / a;
		}
		bProst = z[1] - aProst * z[0]; //point z lays on this line

		//we have to calculate coordinates of 2 points, which lay on perpendicular line and have the same distance (d) from point z
		var A = 1 + Math.pow(aProst, 2);
		var B = 2 * aProst * bProst - 2 * z[0] - 2 * z[1] * aProst;
		var C = -2 * z[1] * bProst + Math.pow(z[0], 2) + Math.pow(z[1], 2) - Math.pow(d, 2) + Math.pow(bProst, 2);
		var delta = Math.pow(B, 2) - 4 * A * C;
		if (delta < 0) {
			return;
		}

		var x1 = (-B + Math.sqrt(delta)) / (2 * A);
		var x2 = (-B - Math.sqrt(delta)) / (2 * A);
		var y1 = aProst * x1 + bProst;
		var y2 = aProst * x2 + bProst;

		if (t1[1] == t2[1]) {
			var o = (t1[0] > t2[0]) ? 1 : -1;
			x1 = t2[0] + o * dlug;
			x2 = x1;
			y1 -= d;
			y2 += d;
		}

		//triangle fill
		ctxt.fillStyle = this.color;
		ctxt.beginPath();
		ctxt.moveTo(t2[0], t2[1]);
		ctxt.lineTo(x1, y1);
		ctxt.lineTo(x2, y2);
		ctxt.fill();

		//triangle border
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.borderwidth;
		ctxt.beginPath();
		ctxt.moveTo(t2[0], t2[1]);
		ctxt.lineTo(x1, y1);
		ctxt.lineTo(x2, y2);
		ctxt.lineTo(t2[0], t2[1]);
		ctxt.stroke();
	}



});

/**
 * The bezier wire widget
 * @class BezierWire
 * @namespace WireIt
 * @extends WireIt.Wire
 * @constructor
 * @param  {WireIt.Terminal}    terminal1   Source terminal
 * @param  {WireIt.Terminal}    terminal2   Target terminal
 * @param  {HTMLElement} parentEl    Container of the CANVAS tag
 * @param  {Obj}                options      Wire configuration (see options property)
 */
WireIt.BezierWire = function (terminal1, terminal2, parentEl, options) {
	WireIt.BezierWire.superclass.constructor.call(this, terminal1, terminal2, parentEl, options);
};


YAHOO.lang.extend(WireIt.BezierWire, WireIt.Wire, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.BezierWire"
	 * @type String
	 */
	xtype: "WireIt.BezierWire",

	/**
	 * @property coeffMulDirection
	 * @description Norm of the tangent vector at the terminals
	 * @default 100
	 * @type Integer
	 */
	coeffMulDirection: 100,


	/**
	 * Redraw the Wire
	 */
	draw: function () {

		// Get the positions of the terminals
		var p1 = this.terminal1.getXY();
		var p2 = this.terminal2.getXY();

		// Coefficient multiplicateur de direction
		// 100 par defaut, si distance(p1,p2) < 100, on passe en distance/2
		var coeffMulDirection = this.coeffMulDirection;


		var distance = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
		if (distance < coeffMulDirection) {
			coeffMulDirection = distance / 2;
		}

		// Calcul des vecteurs directeurs d1 et d2 :
		var d1 = [this.terminal1.direction[0] * coeffMulDirection,
			this.terminal1.direction[1] * coeffMulDirection];
		var d2 = [this.terminal2.direction[0] * coeffMulDirection,
			this.terminal2.direction[1] * coeffMulDirection];

		var bezierPoints = [];
		bezierPoints[0] = p1;
		bezierPoints[1] = [p1[0] + d1[0], p1[1] + d1[1]];
		bezierPoints[2] = [p2[0] + d2[0], p2[1] + d2[1]];
		bezierPoints[3] = p2;
		var min = [p1[0], p1[1]];
		var max = [p1[0], p1[1]];
		for (var i = 1; i < bezierPoints.length; i++) {
			var p = bezierPoints[i];
			if (p[0] < min[0]) {
				min[0] = p[0];
			}
			if (p[1] < min[1]) {
				min[1] = p[1];
			}
			if (p[0] > max[0]) {
				max[0] = p[0];
			}
			if (p[1] > max[1]) {
				max[1] = p[1];
			}
		}
		// Redimensionnement du canvas
		var margin = [4, 4];
		min[0] = min[0] - margin[0];
		min[1] = min[1] - margin[1];
		max[0] = max[0] + margin[0];
		max[1] = max[1] + margin[1];
		var lw = Math.abs(max[0] - min[0]);
		var lh = Math.abs(max[1] - min[1]);

		// Store the min, max positions to display the label later
		this.min = min;
		this.max = max;

		this.SetCanvasRegion(min[0], min[1], lw, lh);

		var ctxt = this.getContext();
		for (i = 0; i < bezierPoints.length; i++) {
			bezierPoints[i][0] = bezierPoints[i][0] - min[0];
			bezierPoints[i][1] = bezierPoints[i][1] - min[1];
		}

		// Draw the border
		ctxt.lineCap = this.bordercap;
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.width + this.borderwidth * 2;
		ctxt.beginPath();
		ctxt.moveTo(bezierPoints[0][0], bezierPoints[0][1]);
		ctxt.bezierCurveTo(bezierPoints[1][0], bezierPoints[1][1], bezierPoints[2][0], bezierPoints[2][1], bezierPoints[3][0], bezierPoints[3][1]);
		ctxt.stroke();

		// Draw the inner bezier curve
		ctxt.lineCap = this.cap;
		ctxt.strokeStyle = this.color;
		ctxt.lineWidth = this.width;
		ctxt.beginPath();
		ctxt.moveTo(bezierPoints[0][0], bezierPoints[0][1]);
		ctxt.bezierCurveTo(bezierPoints[1][0], bezierPoints[1][1], bezierPoints[2][0], bezierPoints[2][1], bezierPoints[3][0], bezierPoints[3][1]);
		ctxt.stroke();
	}



});
/**
 * The bezier wire widget
 * @class BezierArrowWire
 * @namespace WireIt
 * @extends WireIt.BezierWire
 * @constructor
 * @param  {WireIt.Terminal}    terminal1   Source terminal
 * @param  {WireIt.Terminal}    terminal2   Target terminal
 * @param  {HTMLElement} parentEl    Container of the CANVAS tag
 * @param  {Obj}                options      Wire configuration (see options property)
 */
WireIt.BezierArrowWire = function (terminal1, terminal2, parentEl, options) {
	WireIt.BezierArrowWire.superclass.constructor.call(this, terminal1, terminal2, parentEl, options);
};


YAHOO.lang.extend(WireIt.BezierArrowWire, WireIt.BezierWire, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.BezierArrowWire"
	 * @type String
	 */
	xtype: "WireIt.BezierArrowWire",

	/**
	 * Attempted bezier drawing method for arrows
	 */
	draw: function () {

		var arrowWidth = Math.round(this.width * 1.5 + 20);
		var arrowLength = Math.round(this.width * 1.2 + 20);
		var d = arrowWidth / 2; // arrow width/2
		var redim = d + 3; //we have to make the canvas a little bigger because of arrows
		var margin = [4 + redim, 4 + redim];

		// Get the positions of the terminals
		var p1 = this.terminal1.getXY();
		var p2 = this.terminal2.getXY();

		// Coefficient multiplicateur de direction
		// 100 par defaut, si distance(p1,p2) < 100, on passe en distance/2
		var coeffMulDirection = this.coeffMulDirection;


		var distance = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
		if (distance < coeffMulDirection) {
			coeffMulDirection = distance / 2;
		}

		// Calcul des vecteurs directeurs d1 et d2 :
		var d1 = [this.terminal1.direction[0] * coeffMulDirection,
			this.terminal1.direction[1] * coeffMulDirection];
		var d2 = [this.terminal2.direction[0] * coeffMulDirection,
			this.terminal2.direction[1] * coeffMulDirection];

		var bezierPoints = [];
		bezierPoints[0] = p1;
		bezierPoints[1] = [p1[0] + d1[0], p1[1] + d1[1]];
		bezierPoints[2] = [p2[0] + d2[0], p2[1] + d2[1]];
		bezierPoints[3] = p2;

		var min = [p1[0], p1[1]];
		var max = [p1[0], p1[1]];
		for (var i = 1; i < bezierPoints.length; i++) {
			var p = bezierPoints[i];
			if (p[0] < min[0]) {
				min[0] = p[0];
			}
			if (p[1] < min[1]) {
				min[1] = p[1];
			}
			if (p[0] > max[0]) {
				max[0] = p[0];
			}
			if (p[1] > max[1]) {
				max[1] = p[1];
			}
		}
		// Redimensionnement du canvas
		//var margin = [4,4];
		min[0] = min[0] - margin[0];
		min[1] = min[1] - margin[1];
		max[0] = max[0] + margin[0];
		max[1] = max[1] + margin[1];
		var lw = Math.abs(max[0] - min[0]);
		var lh = Math.abs(max[1] - min[1]);

		// Store the min, max positions to display the label later
		this.min = min;
		this.max = max;

		this.SetCanvasRegion(min[0], min[1], lw, lh);

		var ctxt = this.getContext();
		for (i = 0; i < bezierPoints.length; i++) {
			bezierPoints[i][0] = bezierPoints[i][0] - min[0];
			bezierPoints[i][1] = bezierPoints[i][1] - min[1];
		}

		// Draw the border
		ctxt.lineCap = this.bordercap;
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.width + this.borderwidth * 2;
		ctxt.beginPath();
		ctxt.moveTo(bezierPoints[0][0], bezierPoints[0][1]);
		ctxt.bezierCurveTo(bezierPoints[1][0], bezierPoints[1][1], bezierPoints[2][0], bezierPoints[2][1], bezierPoints[3][0], bezierPoints[3][1] + arrowLength / 2 * this.terminal2.direction[1]);
		ctxt.stroke();

		// Draw the inner bezier curve
		ctxt.lineCap = this.cap;
		ctxt.strokeStyle = this.color;
		ctxt.lineWidth = this.width;
		ctxt.beginPath();
		ctxt.moveTo(bezierPoints[0][0], bezierPoints[0][1]);
		ctxt.bezierCurveTo(bezierPoints[1][0], bezierPoints[1][1], bezierPoints[2][0], bezierPoints[2][1], bezierPoints[3][0], bezierPoints[3][1] + arrowLength / 2 * this.terminal2.direction[1]);
		ctxt.stroke();

		//Variables from drawArrows
		//var t1 = p1;
		var t1 = bezierPoints[2], t2 = p2;

		var z = [0, 0]; //point on the wire with constant distance (dlug) from terminal2
		var dlug = arrowLength; //arrow length
		var t = 1 - (dlug / distance);
		z[0] = Math.abs(t1[0] + t * (t2[0] - t1[0]));
		z[1] = Math.abs(t1[1] + t * (t2[1] - t1[1]));

		// line which connects the terminals: y=ax+b
		var a, b;
		var W = t1[0] - t2[0];
		var Wa = t1[1] - t2[1];
		var Wb = t1[0] * t2[1] - t1[1] * t2[0];
		if (W !== 0) {
			a = Wa / W;
			b = Wb / W;
		}
		else {
			a = 0;
		}
		//line perpendicular to the main line: y = aProst*x + b
		var aProst, bProst;
		if (a === 0) {
			aProst = 0;
		}
		else {
			aProst = -1 / a;
		}
		bProst = z[1] - aProst * z[0]; //point z lays on this line

		//we have to calculate coordinates of 2 points, which lay on perpendicular line and have the same distance (d) from point z
		var A = 1 + Math.pow(aProst, 2),
			B = 2 * aProst * bProst - 2 * z[0] - 2 * z[1] * aProst,
			C = -2 * z[1] * bProst + Math.pow(z[0], 2) + Math.pow(z[1], 2) - Math.pow(d, 2) + Math.pow(bProst, 2),
			delta = Math.pow(B, 2) - 4 * A * C;

		if (delta < 0) {
			return false;
		}

		var x1 = (-B + Math.sqrt(delta)) / (2 * A),
			x2 = (-B - Math.sqrt(delta)) / (2 * A),
			y1 = aProst * x1 + bProst,
			y2 = aProst * x2 + bProst;

		if (t1[1] == t2[1]) {
			var o = (t1[0] > t2[0]) ? 1 : -1;
			x1 = t2[0] + o * dlug;
			x2 = x1;
			y1 -= d;
			y2 += d;
		}

		// triangle fill
		ctxt.fillStyle = this.color;
		ctxt.beginPath();
		ctxt.moveTo(t2[0], t2[1]);
		ctxt.lineTo(x1, y1);
		ctxt.lineTo(x2, y2);
		ctxt.fill();

		// triangle border
		ctxt.strokeStyle = this.bordercolor;
		ctxt.lineWidth = this.borderwidth;
		ctxt.beginPath();
		ctxt.moveTo(t2[0], t2[1]);
		ctxt.lineTo(x1, y1);
		ctxt.lineTo(x2, y2);
		ctxt.lineTo(t2[0], t2[1]);
		ctxt.stroke();

		return [p1, p2, t1, t2];
	}

});



/*global YAHOO */
(function () {

	var util = YAHOO.util;
	var Event = util.Event, lang = YAHOO.lang, CSS_PREFIX = "WireIt-";

	/**
	 * Scissors widget to cut wires
	 * @class Scissors
	 * @namespace WireIt
	 * @extends YAHOO.util.Element
	 * @constructor
	 * @param {WireIt.Terminal} terminal Associated terminal
	 * @param {Object} oConfigs
	 */
	WireIt.Scissors = function (terminal, oConfigs) {
		WireIt.Scissors.superclass.constructor.call(this, document.createElement('div'), oConfigs);

		/**
		 * The terminal it is associated to
		 * @property _terminal
		 * @type {WireIt.Terminal}
		 */
		this._terminal = terminal;

		this.initScissors();
	};

	WireIt.Scissors.visibleInstance = null;

	lang.extend(WireIt.Scissors, YAHOO.util.Element, {

		/**
		 * Init the scissors
		 * @method initScissors
		 */
		initScissors: function () {

			// Display the cut button
			this.hideNow();
			this.addClass(CSS_PREFIX + "Wire-scissors");

			// The scissors are within the terminal element
			this.appendTo(this._terminal.container ? this._terminal.container.layer.el : this._terminal.el.parentNode.parentNode);

			// Ajoute un listener sur le scissor:
			this.on("mouseover", this.show, this, true);
			this.on("mouseout", this.hide, this, true);
			this.on("click", this.scissorClick, this, true);

			// On mouseover/mouseout to display/hide the scissors
			Event.addListener(this._terminal.el, "mouseover", this.mouseOver, this, true);
			Event.addListener(this._terminal.el, "mouseout", this.hide, this, true);
		},

		/**
		 * @method setPosition
		 */
		setPosition: function () {
			var pos = this._terminal.getXY();
			this.setStyle("left", (pos[0] + this._terminal.direction[0] * 30 - 8) + "px");
			this.setStyle("top", (pos[1] + this._terminal.direction[1] * 30 - 8) + "px");
		},
		/**
		 * @method mouseOver
		 */
		mouseOver: function () {
			if (this._terminal.wires.length > 0) {
				this.show();
			}
		},

		/**
		 * @method scissorClick
		 */
		scissorClick: function () {
			this._terminal.removeAllWires();
			if (this.terminalTimeout) {
				this.terminalTimeout.cancel();
			}
			this.hideNow();
		},
		/**
		 * @method show
		 */
		show: function () {
			this.setPosition();
			this.setStyle('display', '');

			if (WireIt.Scissors.visibleInstance && WireIt.Scissors.visibleInstance != this) {
				if (WireIt.Scissors.visibleInstance.terminalTimeout) {
					WireIt.Scissors.visibleInstance.terminalTimeout.cancel();
				}
				WireIt.Scissors.visibleInstance.hideNow();
			}
			WireIt.Scissors.visibleInstance = this;

			if (this.terminalTimeout) {
				this.terminalTimeout.cancel();
			}
		},
		/**
		 * @method hide
		 */
		hide: function () {
			this.terminalTimeout = YAHOO.lang.later(700, this, this.hideNow);
		},
		/**
		 * @method hideNow
		 */
		hideNow: function () {
			WireIt.Scissors.visibleInstance = null;
			this.setStyle('display', 'none');
		}

	});

})();



/*global YAHOO,WireIt,window */
/**
 * A layer encapsulate a bunch of containers and wires
 * @class Layer
 * @namespace WireIt
 * @constructor
 * @param {Object}   options   Configuration object (see the properties)
 */
WireIt.Layer = function (options) {

	this.setOptions(options);

	/**
	 * List of all the WireIt.Container (or subclass) instances in this layer
	 * @property containers
	 * @type {Array}
	 */
	this.containers = [];

	/**
	 * List of all the WireIt.Wire (or subclass) instances in this layer
	 * @property wires
	 * @type {Array}
	 */
	this.wires = [];

	/**
	 * TODO
	 */
	this.groups = [];

	/**
	 * Layer DOM element
	 * @property el
	 * @type {HTMLElement}
	 */
	this.el = null;

	/**
	 * Event that is fired when the layer has been changed
	 * You can register this event with myTerminal.eventChanged.subscribe(function(e,params) { }, scope);
	 * @event eventChanged
	 */
	this.eventChanged = new YAHOO.util.CustomEvent("eventChanged");

	/**
	 * Event that is fired when a wire is added
	 * You can register this event with myTerminal.eventAddWire.subscribe(function(e,params) { var wire=params[0];}, scope);
	 * @event eventAddWire
	 */
	this.eventAddWire = new YAHOO.util.CustomEvent("eventAddWire");

	/**
	 * Event that is fired when a wire is removed
	 * You can register this event with myTerminal.eventRemoveWire.subscribe(function(e,params) { var wire=params[0];}, scope);
	 * @event eventRemoveWire
	 */
	this.eventRemoveWire = new YAHOO.util.CustomEvent("eventRemoveWire");

	/**
	 * Event that is fired when a container is added
	 * You can register this event with myTerminal.eventAddContainer.subscribe(function(e,params) { var container=params[0];}, scope);
	 * @event eventAddContainer
	 */
	this.eventAddContainer = new YAHOO.util.CustomEvent("eventAddContainer");

	/**
	 * Event that is fired when a container is removed
	 * You can register this event with myTerminal.eventRemoveContainer.subscribe(function(e,params) { var container=params[0];}, scope);
	 * @event eventRemoveContainer
	 */
	this.eventRemoveContainer = new YAHOO.util.CustomEvent("eventRemoveContainer");

	/**
	 * Event that is fired when a container has been moved
	 * You can register this event with myTerminal.eventContainerDragged.subscribe(function(e,params) { var container=params[0];}, scope);
	 * @event eventContainerDragged
	 */
	this.eventContainerDragged = new YAHOO.util.CustomEvent("eventContainerDragged");

	/**
	 * Event that is fired when a container has been resized
	 * You can register this event with myTerminal.eventContainerResized.subscribe(function(e,params) { var container=params[0];}, scope);
	 * @event eventContainerResized
	 */
	this.eventContainerResized = new YAHOO.util.CustomEvent("eventContainerResized");

	this.render();

	if (options.containers) {
		this.initContainers(options.containers);
	}

	if (options.wires) {
		this.initWires(options.wires);
	}

	if (this.layerMap) {
		this.layermap = new WireIt.LayerMap(this, this.layerMapOptions);
	}

	if (WireIt.Grouper) {
		this.grouper = new WireIt.Grouper(this, this.grouper.baseConfigFunction);

		var rb = this.grouper.rubberband;
		this.el.onmousedown = function (event) {
			return rb.layerMouseDown.call(rb, event);
		};
		var grouper = this.grouper;
		this.el.addEventListener("mouseup", function (event) {
			rb.finish();
			grouper.rubberbandSelect.call(grouper);
		}, false);
	}
};

WireIt.Layer.prototype = {

	/**
	 * @property className
	 * @description CSS class name for the layer element
	 * @default "WireIt-Layer"
	 * @type String
	 */
	className: "WireIt-Layer",

	/**
	 * @property parentEl
	 * @description DOM element that schould contain the layer
	 * @default null
	 * @type DOMElement
	 */
	parentEl: null,

	/**
	 * @property layerMap
	 * @description Display the layer map
	 * @default false
	 * @type Boolean
	 */
	layerMap: false,

	/**
	 * @property layerMapOptions
	 * @description Options for the layer map
	 * @default null
	 * @type Object
	 */
	layerMapOptions: null,

	/**
	 * @property enableMouseEvents
	 * @description Enable the mouse events
	 * @default true
	 * @type Boolean
	 */
	enableMouseEvents: true,

	/**
	 * TODO
	 */
	grouper: null,

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

		if (!this.parentEl) {
			this.parentEl = document.body;
		}

	},

	/**
	 * Create the dom of the layer and insert it into the parent element
	 * @method render
	 */

	//JADO
	render: function () {

		//JADO EDIT
		this.el = WireIt.cn('div', {className: this.className});
		this.parentEl = $("#center").get(0);
		this.parentEl.appendChild(this.el);
	},



	/**
	 * Create all the containers passed as options
	 * @method initContainers
	 */
	initContainers: function (containers) {
		for (var i = 0; i < containers.length; i++) {
			this.addContainer(containers[i]);
		}
	},

	/**
	 * Create all the wires passed in the config
	 * @method initWires
	 */
	initWires: function (wires) {
		for (var i = 0; i < wires.length; i++) {
			this.addWire(wires[i]);
		}
	},

	/**
	 * TODO
	 */
	setSuperHighlighted: function (containers) {
		this.unsetSuperHighlighted();
		for (var i in containers) {
			if (containers.hasOwnProperty(i)) {
				containers[i].superHighlight();
			}
		}
		this.superHighlighted = containers;
	},

	/**
	 * TODO
	 */
	unsetSuperHighlighted: function () {
		if (YAHOO.lang.isValue(this.superHighlighted)) {
			for (var i in this.superHighlighted) {
				if (this.superHighlighted.hasOwnProperty(i)) {
					this.superHighlighted[i].highlight();
				}
			}
		}
		this.superHighlighted = null;
	},

	/**
	 * Instanciate a wire given its "xtype" (default to WireIt.Wire)
	 * @method addWire
	 * @param {Object} wireConfig  Wire configuration object (see WireIt.Wire class for details)
	 * @return {WireIt.Wire} Wire instance build from the xtype
	 */
	addWire: function (wireConfig) {

		var klass = WireIt.wireClassFromXtype(wireConfig.xtype);

		var src = wireConfig.src;
		var tgt = wireConfig.tgt;

		var terminal1 = this.containers[src.moduleId].getTerminal(src.terminal);
		var terminal2 = this.containers[tgt.moduleId].getTerminal(tgt.terminal);
		var wire = new klass(terminal1, terminal2, this.el, wireConfig);
		wire.redraw();

		return wire;
	},

	/**
	 * Instanciate a container given its "xtype": WireIt.Container (default) or a subclass of it.
	 * @method addContainer
	 * @param {Object} containerConfig  Container configuration object (see WireIt.Container class for details)
	 * @return {WireIt.Container} Container instance build from the xtype
	 */
	addContainer: function (containerConfig) {

		var klass = WireIt.containerClassFromXtype(containerConfig.xtype);

		var container = new klass(containerConfig, this);

		return this.addContainerDirect(container);
	},


	addContainerDirect: function (container) {
		this.containers.push(container);

		// Event listeners
		container.eventAddWire.subscribe(this.onAddWire, this, true);
		container.eventRemoveWire.subscribe(this.onRemoveWire, this, true);

//		if (container.ddResize) {
//			container.ddResize.on('endDragEvent', function () {
//				this.eventContainerResized.fire(container);
//				this.eventChanged.fire(this);
//			}, this, true);
//		}
//		if (container.dd) {
//			container.dd.on('endDragEvent', function () {
//				this.eventContainerDragged.fire(container);
//				this.eventChanged.fire(this);
//			}, this, true);
//		}

		this.eventAddContainer.fire(container);

		this.eventChanged.fire(this);

		return container;
	},

	/**
	 * Remove a container
	 * @method removeContainer
	 * @param {WireIt.Container} container Container instance to remove
	 */
	removeContainer: function (container) {
		var index = WireIt.indexOf(container, this.containers);
		if (index != -1) {

			container.remove();

			this.containers[index] = null;
			this.containers = WireIt.compact(this.containers);

			this.eventRemoveContainer.fire(container);

			this.eventChanged.fire(this);
		}
	},

	/**
	 * TODO
	 */
	removeGroup: function (group, containersAsWell) {
		var index = this.groups.indexOf(group) , i;

		if (index != -1) {
			this.groups.splice(index, 1);
		}

		if (containersAsWell) {
			if (YAHOO.lang.isValue(group.groupContainer)) {
				this.removeContainer(group.groupContainer);
			}
			else {
				for (i in group.containers) {
					if (group.containers.hasOwnProperty(i)) {
						var elem = group.containers[i].container;
						this.removeContainer(elem);
					}
				}

				for (i in group.groups) {
					if (group.containers.hasOwnProperty(i)) {
						var g = group.groups[i].group;
						this.removeGroup(g);
					}
				}
			}
		}
	},

	/**
	 * Update the wire list when any of the containers fired the eventAddWire
	 * @method onAddWire
	 * @param {Event} event The eventAddWire event fired by the container
	 * @param {Array} args This array contains a single element args[0] which is the added Wire instance
	 */
	onAddWire: function (event, args) {
		var wire = args[0];
		// add the wire to the list if it isn't in
		if (WireIt.indexOf(wire, this.wires) == -1) {
			this.wires.push(wire);

			if (this.enableMouseEvents) {
				YAHOO.util.Event.addListener(wire.element, "mousemove", this.onWireMouseMove, this, true);
				YAHOO.util.Event.addListener(wire.element, "click", this.onWireClick, this, true);
			}

			// Re-Fire an event at the layer level
			this.eventAddWire.fire(wire);

			// Fire the layer changed event
			this.eventChanged.fire(this);
		}
	},

	/**
	 * Update the wire list when a wire is removed
	 * @method onRemoveWire
	 * @param {Event} event The eventRemoveWire event fired by the container
	 * @param {Array} args This array contains a single element args[0] which is the removed Wire instance
	 */
	onRemoveWire: function (event, args) {
		var wire = args[0];
		var index = WireIt.indexOf(wire, this.wires);
		if (index != -1) {
			this.wires[index] = null;
			this.wires = WireIt.compact(this.wires);
			this.eventRemoveWire.fire(wire);
			this.eventChanged.fire(this);
		}
	},


	/**
	 * Remove all the containers in this layer (and the associated terminals and wires)
	 * @method clear
	 */
	clear: function () {
		while (this.containers.length > 0) {
			this.removeContainer(this.containers[0]);
		}
	},

	/**
	 * @deprecated Alias for clear
	 * @method removeAllContainers
	 */
	removeAllContainers: function () {
		this.clear();
	},


	/**
	 * Return an object that represent the state of the layer including the containers and the wires
	 * @method getWiring
	 * @return {Obj} layer configuration
	 */
	getWiring: function () {

		var i;
		var obj = {containers: [], wires: []};

		for (i = 0; i < this.containers.length; i++) {
			obj.containers.push(this.containers[i].getConfig());
		}

		for (i = 0; i < this.wires.length; i++) {
			var wire = this.wires[i];
			var wireObj = wire.getConfig();
			wireObj.src = {moduleId: WireIt.indexOf(wire.terminal1.container, this.containers), terminal: wire.terminal1.name };
			wireObj.tgt = {moduleId: WireIt.indexOf(wire.terminal2.container, this.containers), terminal: wire.terminal2.name };
			obj.wires.push(wireObj);
		}

		return obj;
	},

	/**
	 * Load a layer configuration object
	 * @method setWiring
	 * @param {Object} wiring layer configuration
	 */
	setWiring: function (wiring) {
		this.clear();
		var i;
		if (YAHOO.lang.isArray(wiring.containers)) {
			for (i = 0; i < wiring.containers.length; i++) {
				this.addContainer(wiring.containers[i]);
			}
		}
		if (YAHOO.lang.isArray(wiring.wires)) {
			for (i = 0; i < wiring.wires.length; i++) {
				this.addWire(wiring.wires[i]);
			}
		}
	},

	/**
	 * Returns a position relative to the layer from a mouse event
	 * @method _getMouseEvtPos
	 * @param {Event} e Mouse event
	 * @return {Array} position
	 */
	_getMouseEvtPos: function (e) {
		var tgt = YAHOO.util.Event.getTarget(e);
		var tgtPos = [tgt.offsetLeft, tgt.offsetTop];
		return [tgtPos[0] + e.layerX, tgtPos[1] + e.layerY];
	},

	/**
	 * Handles click on any wire canvas
	 * Note: we treat mouse events globally so that wires behind others can still receive the events
	 * @method onWireClick
	 * @param {Event} e Mouse click event
	 */
	onWireClick: function (e) {
		var p = this._getMouseEvtPos(e);
		var lx = p[0], ly = p[1], n = this.wires.length, w;
		for (var i = 0; i < n; i++) {
			w = this.wires[i];
			var elx = w.element.offsetLeft, ely = w.element.offsetTop;
			// Check if the mouse is within the canvas boundaries
			if (lx >= elx && lx < elx + w.element.width && ly >= ely && ly < ely + w.element.height) {
				var rx = lx - elx, ry = ly - ely; // relative to the canvas
				w.onClick(rx, ry);
			}
		}
	},

	/**
	 * Handles mousemove events on any wire canvas
	 * Note: we treat mouse events globally so that wires behind others can still receive the events
	 * @method onWireMouseMove
	 * @param {Event} e Mouse click event
	 */
	onWireMouseMove: function (e) {
		var p = this._getMouseEvtPos(e);
		var lx = p[0], ly = p[1], n = this.wires.length, w;
		for (var i = 0; i < n; i++) {
			w = this.wires[i];
			var elx = w.element.offsetLeft, ely = w.element.offsetTop;
			// Check if the mouse is within the canvas boundaries
			if (lx >= elx && lx < elx + w.element.width && ly >= ely && ly < ely + w.element.height) {
				var rx = lx - elx, ry = ly - ely; // relative to the canvas
				w.onMouseMove(rx, ry);
			}
		}
	}

};
/*global YAHOO,WireIt,window */
(function () {

	var Dom = YAHOO.util.Dom, Event = YAHOO.util.Event;

	/**
	 * Widget to display a minimap on a layer
	 * @class LayerMap
	 * @namespace WireIt
	 * @extends WireIt.CanvasElement
	 * @constructor
	 * @param {WireIt.Layer} layer the layer object it is attached to
	 * @param {Obj} options configuration object
	 */
	WireIt.LayerMap = function (layer, options) {

		/**
		 * @property layer
		 */
		this.layer = layer;

		this.setOptions(options);

		if (typeof options.parentEl == "string") {
			this.parentEl = YAHOO.util.Dom.get(options.parentEl);
		}
		else if (this.layer && !this.parentEl) {
			this.parentEl = this.layer.el;
		}

		// Create the canvas element
		WireIt.LayerMap.superclass.constructor.call(this, this.parentEl);

		// Set the className
		this.element.className = this.className;

		this.initEvents();

		this.draw();
	};

	YAHOO.lang.extend(WireIt.LayerMap, WireIt.CanvasElement, {

		/**
		 * @property className
		 * @description CSS class name for the layer map element
		 * @default "WireIt-LayerMap"
		 * @type String
		 */
		className: "WireIt-LayerMap",

		/**
		 * @property style
		 * @description display style
		 * @default "WireIt-LayerMap"
		 * @type String
		 */
		style: "rgba(0, 0, 200, 0.5)",

		/**
		 * @property parentEl
		 * @description DOM element that schould contain the layer
		 * @default null
		 * @type DOMElement
		 */
		parentEl: null,

		/**
		 * @property lineWidth
		 * @description Line width
		 * @default 2
		 * @type Integer
		 */
		lineWidth: 2,

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
		},


		/**
		 * Listen for various events that should redraw the layer map
		 * @method initEvents
		 */
		initEvents: function () {

			var layer = this.layer;

			Event.addListener(this.element, 'mousedown', this.onMouseDown, this, true);
			Event.addListener(this.element, 'mouseup', this.onMouseUp, this, true);
			Event.addListener(this.element, 'mousemove', this.onMouseMove, this, true);
			Event.addListener(this.element, 'mouseout', this.onMouseUp, this, true);

			layer.eventAddWire.subscribe(this.draw, this, true);
			layer.eventRemoveWire.subscribe(this.draw, this, true);
			layer.eventAddContainer.subscribe(this.draw, this, true);
			layer.eventRemoveContainer.subscribe(this.draw, this, true);
			layer.eventContainerDragged.subscribe(this.draw, this, true);
			layer.eventContainerResized.subscribe(this.draw, this, true);

			Event.addListener(this.layer.el, "scroll", this.onLayerScroll, this, true);
		},

		/**
		 * When a mouse move is received
		 * @method onMouseMove
		 * @param {Event} e Original event
		 * @param {Array} args event parameters
		 */
		onMouseMove: function (e, args) {
			Event.stopEvent(e);
			if (this.isMouseDown) {
				this.scrollLayer(e.clientX, e.clientY);
			}
		},

		/**
		 * When a mouseup or mouseout is received
		 * @method onMouseUp
		 * @param {Event} e Original event
		 * @param {Array} args event parameters
		 */
		onMouseUp: function (e, args) {
			Event.stopEvent(e);
			this.isMouseDown = false;
		},

		/**
		 * When a mouse down is received
		 * @method onMouseDown
		 * @param {Event} e Original event
		 * @param {Array} args event parameters
		 */
		onMouseDown: function (e, args) {
			Event.stopEvent(e);
			this.scrollLayer(e.clientX, e.clientY);
			this.isMouseDown = true;
		},

		/**
		 * Scroll the layer from mousedown/mousemove
		 * @method scrollLayer
		 * @param {Integer} clientX mouse event x coordinate
		 * @param {Integer} clientY mouse event y coordinate
		 */
		scrollLayer: function (clientX, clientY) {

			var canvasPos = Dom.getXY(this.element);
			var click = [ clientX - canvasPos[0], clientY - canvasPos[1] ];

			// Canvas Region
			var canvasRegion = Dom.getRegion(this.element);
			var canvasWidth = canvasRegion.right - canvasRegion.left - 4;
			var canvasHeight = canvasRegion.bottom - canvasRegion.top - 4;

			// Calculate ratio
			var layerWidth = this.layer.el.scrollWidth;
			var layerHeight = this.layer.el.scrollHeight;
			var hRatio = Math.floor(100 * canvasWidth / layerWidth) / 100;
			var vRatio = Math.floor(100 * canvasHeight / layerHeight) / 100;

			// Center position:
			var center = [ click[0] / hRatio, click[1] / vRatio ];

			// Region
			var region = Dom.getRegion(this.layer.el);
			var viewportWidth = region.right - region.left;
			var viewportHeight = region.bottom - region.top;

			// Calculate the scroll position of the layer
			var topleft = [ Math.max(Math.floor(center[0] - viewportWidth / 2), 0) , Math.max(Math.floor(center[1] - viewportHeight / 2), 0) ];
			if (topleft[0] + viewportWidth > layerWidth) {
				topleft[0] = layerWidth - viewportWidth;
			}
			if (topleft[1] + viewportHeight > layerHeight) {
				topleft[1] = layerHeight - viewportHeight;
			}

			this.layer.el.scrollLeft = topleft[0];
			this.layer.el.scrollTop = topleft[1];

		},

		/**
		 * Redraw after a timeout
		 * @method onLayerScroll
		 */
		onLayerScroll: function () {

			if (this.scrollTimer) {
				window.clearTimeout(this.scrollTimer);
			}
			var that = this;
			this.scrollTimer = window.setTimeout(function () {
				that.draw();
			}, 50);

		},

		/**
		 * Redraw the layer map
		 * @method draw
		 */
		draw: function () {
			var ctxt = this.getContext();

			// Canvas Region
			var canvasRegion = Dom.getRegion(this.element);
			var canvasWidth = canvasRegion.right - canvasRegion.left - 4;
			var canvasHeight = canvasRegion.bottom - canvasRegion.top - 4;

			// Clear Rect
			ctxt.clearRect(0, 0, canvasWidth, canvasHeight);

			// Calculate ratio
			var layerWidth = this.layer.el.scrollWidth;
			var layerHeight = this.layer.el.scrollHeight;
			var hRatio = Math.floor(100 * canvasWidth / layerWidth) / 100;
			var vRatio = Math.floor(100 * canvasHeight / layerHeight) / 100;

			// Draw the viewport
			var region = Dom.getRegion(this.layer.el);
			var viewportWidth = region.right - region.left;
			var viewportHeight = region.bottom - region.top;
			var viewportX = this.layer.el.scrollLeft;
			var viewportY = this.layer.el.scrollTop;
			ctxt.strokeStyle = "rgb(200, 50, 50)";
			ctxt.lineWidth = 1;
			ctxt.strokeRect(viewportX * hRatio, viewportY * vRatio, viewportWidth * hRatio, viewportHeight * vRatio);

			// Draw containers and wires
			ctxt.fillStyle = this.style;
			ctxt.strokeStyle = this.style;
			ctxt.lineWidth = this.lineWidth;
			this.drawContainers(ctxt, hRatio, vRatio);
			this.drawWires(ctxt, hRatio, vRatio);
		},

		/**
		 * Subroutine to draw the containers
		 * @method drawContainers
		 */
		drawContainers: function (ctxt, hRatio, vRatio) {
			var containers = this.layer.containers;
			var n = containers.length, i, gIS = WireIt.getIntStyle, containerEl;
			for (i = 0; i < n; i++) {
				containerEl = containers[i].el;
				ctxt.fillRect(gIS(containerEl, "left") * hRatio, gIS(containerEl, "top") * vRatio,
					gIS(containerEl, "width") * hRatio, gIS(containerEl, "height") * vRatio);
			}
		},

		/**
		 * Subroutine to draw the wires
		 * @method drawWires
		 */
		drawWires: function (ctxt, hRatio, vRatio) {
			var wires = this.layer.wires;
			var n = wires.length, i, wire;
			for (i = 0; i < n; i++) {
				wire = wires[i];
				var pos1 = wire.terminal1.getXY(),
					pos2 = wire.terminal2.getXY();

				// Stroked line
				// TODO:
				ctxt.beginPath();
				ctxt.moveTo(pos1[0] * hRatio, pos1[1] * vRatio);
				ctxt.lineTo(pos2[0] * hRatio, pos2[1] * vRatio);
				ctxt.closePath();
				ctxt.stroke();
			}

		}


	});

})();