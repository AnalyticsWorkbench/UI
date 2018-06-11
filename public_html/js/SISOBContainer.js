(function () {

	var util = YAHOO.util;
	var Dom = util.Dom, Event = util.Event, CSS_PREFIX = "WireIt-";

	/**
	 * Visual module that contains terminals. The wires are updated when the module is dragged around.
	 * @class Container
	 * @namespace WireIt
	 * @constructor
	 * @param {Object}   options      Configuration object (see options property)
	 * @param {WireIt.Layer}   layer The WireIt.Layer (or subclass) instance that contains this container
	 */
	WireIt.Container = function (options, layer) {

		// Set the options
		this.setOptions(options);

		/**
		 * the WireIt.Layer object that schould contain this container
		 * @property layer
		 * @type {WireIt.Layer}
		 */
		this.layer = layer;

		/**
		 * List of the terminal
		 * @property terminals
		 * @type {Array}
		 */
		this.terminals = [];

		/**
		 * List of all the wires connected to this container terminals
		 * @property wires
		 * @type {Array}
		 */
		this.wires = [];

		/**
		 * Container DOM element
		 * @property el
		 * @type {HTMLElement}
		 */
		this.el = null;

		/**
		 * Body element
		 * @property bodyEl
		 * @type {HTMLElement}
		 */
		this.bodyEl = null;

		/**
		 * Event that is fired when a wire is added
		 * You can register this event with myContainer.eventAddWire.subscribe(function(e,params) { var wire=params[0];}, scope);
		 * @event eventAddWire
		 */
		this.eventAddWire = new util.CustomEvent("eventAddWire");

		/**
		 * Event that is fired when a wire is removed
		 * You can register this event with myContainer.eventRemoveWire.subscribe(function(e,params) { var wire=params[0];}, scope);
		 * @event eventRemoveWire
		 */
		this.eventRemoveWire = new util.CustomEvent("eventRemoveWire");

		/**
		 * Event that is fired when the container is focused
		 * You can register this event with myContainer.eventFocus.subscribe(function(e,params) { }, scope);
		 * @event eventFocus
		 */
		this.eventFocus = new util.CustomEvent("eventFocus");

		/**
		 * Event that is fired when the container loses focus
		 * You can register this event with myContainer.eventBlur.subscribe(function(e,params) { }, scope);
		 * @event eventBlur
		 */
		this.eventBlur = new util.CustomEvent("eventBlur");

		// Render the div object
		this.render();

		// Init the terminals
		if (options.terminals) {
			this.initTerminals(options.terminals);
		}

		// Make the container resizable
//		if (this.resizable) {
//			this.makeResizable();
//		}

		// Make the container draggable
//		if (this.draggable) {
//			this.makeDraggable();
//		}

	};


	WireIt.Container.prototype = {

		/**
		 * @property xtype
		 * @description String representing this class for exporting as JSON
		 * @default "WireIt.Container"
		 * @type String
		 */
		xtype: "WireIt.Container",

		/**
		 * @property draggable
		 * @description boolean that enables drag'n drop on this container
		 * @default true
		 * @type Boolean
		 */
		draggable: true,

		/**
		 * @property position
		 * @description initial position of the container
		 * @default [100,100]
		 * @type Array
		 */
		position: [100, 100],

		/**
		 * @property className
		 * @description CSS class name for the container element
		 * @default "WireIt-Container"
		 * @type String
		 */
		className: CSS_PREFIX + "Container",

		/**
		 * @property ddHandle
		 * @description (only if draggable) boolean indicating we use a handle for drag'n drop
		 * @default true
		 * @type Boolean
		 */
		ddHandle: true,

		/**
		 * @property ddHandleClassName
		 * @description CSS class name for the drag'n drop handle
		 * @default "WireIt-Container-ddhandle"
		 * @type String
		 */
		ddHandleClassName: CSS_PREFIX + "Container-ddhandle",

		/**
		 * @property resizable
		 * @description boolean that makes the container resizable
		 * @default true
		 * @type Boolean
		 */
		resizable: true,

		/**
		 * @property resizeHandleClassName
		 * @description CSS class name for the resize handle
		 * @default "WireIt-Container-resizehandle"
		 * @type String
		 */
		resizeHandleClassName: CSS_PREFIX + "Container-resizehandle",

		/**
		 * @property close
		 * @description display a button to close the container
		 * @default true
		 * @type Boolean
		 */
		close: true,

		/**
		 * @property closeButtonClassName
		 * @description CSS class name for the close button
		 * @default "WireIt-Container-closebutton"
		 * @type String
		 */
		closeButtonClassName: CSS_PREFIX + "Container-closebutton",

		/**
		 * @property groupable
		 * @description option to add the grouping button
		 * @default true
		 * @type Boolean
		 */
		groupable: true,

		/**
		 * @property preventSelfWiring
		 * @description option to prevent connections between terminals of this same container
		 * @default true
		 * @type Boolean
		 */
		preventSelfWiring: true,

		/**
		 * @property title
		 * @description text that will appear in the module header
		 * @default null
		 * @type String
		 */
		title: null,

		/**
		 * @property icon
		 * @description image url to be displayed in the module header
		 * @default null
		 * @type String
		 */
		icon: null,

		/**
		 * @property width
		 * @description initial width of the container
		 * @default null
		 * @type Integer
		 */
		width: null,

		/**
		 * @property height
		 * @description initial height of the container
		 * @default null
		 * @type Integer
		 */
		height: null,


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
		 * Use the DDResize utility to make container resizable while redrawing the connected wires
		 */
		makeResizable: function () {
			this.ddResize = new WireIt.util.DDResize(this);
			this.ddResize.eventResize.subscribe(this.onResize, this, true);
		},

		/**
		 * Function called when the container is being resized.
		 * It sets the size of the body element of the container
		 * @method onResize
		 */
		onResize: function (event, args) {
			var size = args[0];
			// TODO: do not hardcode those sizes !!
			WireIt.sn(this.bodyEl, null, {width: (size[0] - 14) + "px", height: (size[1] - ( this.ddHandle ? 44 : 14) ) + "px"});
		},

		/**
		 * Render the dom of the container
		 * @method render
		 */
		render: function () {

			// Create the element
			this.el = WireIt.cn('div', {className: this.className});

			if (this.width) {
				this.el.style.width = this.width + "px";
			}
			if (this.height) {
				this.el.style.height = this.height + "px";
			}

			// Adds a handler for mousedown so we can notice the layer
			Event.addListener(this.el, "mousedown", this.onMouseDown, this, true);

			if (this.ddHandle) {
				// Create the drag/drop handle
				this.ddHandle = WireIt.cn('div', {className: this.ddHandleClassName});
				this.el.appendChild(this.ddHandle);

				// Icon
				if (this.icon) {
					var iconCn = WireIt.cn('img', {src: this.icon, className: 'WireIt-Container-icon'});
					this.ddHandle.appendChild(iconCn);
				}

				// Set title
				if (this.title) {
					this.ddHandle.appendChild(WireIt.cn('div', {className: 'containerTitle'}, null, this.title));
				}

			}

			// Create the body element
			this.bodyEl = WireIt.cn('div', {className: "body"});
			this.el.appendChild(this.bodyEl);

			if (this.resizable) {
				// Create the resize handle
				this.ddResizeHandle = WireIt.cn('div', {className: this.resizeHandleClassName});
				this.el.appendChild(this.ddResizeHandle);
			}

			if (this.close) {
				// Close button
				this.closeButton = WireIt.cn('div', {className: this.closeButtonClassName});
				if (this.ddHandle) {
					this.ddHandle.appendChild(this.closeButton);
				}
				else {
					this.el.appendChild(this.closeButton);
				}
				Event.addListener(this.closeButton, "click", this.onCloseButton, this, true);
			}

			if (this.groupable && this.ddHandle) {
				this.groupButton = WireIt.cn('div', {className: 'WireIt-Container-groupbutton'});
				this.ddHandle.appendChild(this.groupButton);
				Event.addListener(this.groupButton, "click", this.onGroupButton, this, true);
			}
			// Append to the layer element
			this.layer.el.appendChild(this.el);

			// Set the position
			this.el.style.left = this.position[0] + "px";
			this.el.style.top = this.position[1] + "px";
		},

		/**
		 * Sets the content of the body element
		 * @method setBody
		 * @param {String or HTMLElement} content
		 */
		setBody: function (content) {
			if (typeof content == "string") {
				this.bodyEl.innerHTML = content;
			}
			else {
				this.bodyEl.innerHTML = "";
				this.bodyEl.appendChild(content);
			}
		},

		/**
		 * Called when the user made a mouse down on the container and sets the focus to this container (only if within a Layer)
		 * @method onMouseDown
		 */
		onMouseDown: function (event) {
			if (this.layer) {
				if (this.layer.focusedContainer && this.layer.focusedContainer != this) {
					this.layer.focusedContainer.removeFocus();
				}
				this.setFocus();
				this.layer.focusedContainer = this;
			}
		},

		/**
		 * Adds the class that shows the container as "focused"
		 * @method setFocus
		 */
		setFocus: function () {
			Dom.addClass(this.el, CSS_PREFIX + "Container-focused");

			this.eventFocus.fire(this);
		},

		/**
		 * Remove the class that shows the container as "focused"
		 * @method removeFocus
		 */
		removeFocus: function () {
			Dom.removeClass(this.el, CSS_PREFIX + "Container-focused");

			this.eventBlur.fire(this);
		},

		/**
		 * Called when the user clicked on the close button
		 * @method onCloseButton
		 */
		onCloseButton: function (e, args) {
			Event.stopEvent(e);
			this.layer.removeContainer(this);
		},

		/**
		 * TODO
		 */
		highlight: function () {
			this.el.style.border = "2px solid blue";
		},

		/**
		 * TODO
		 */
		dehighlight: function () {
			this.el.style.border = "";
		},

		/**
		 * TODO
		 */
		superHighlight: function () {
			this.el.style.border = "4px outset blue";
		},

		/**
		 * TODO
		 */
		red: function () {
			this.el.style.border = "3px solid #FF0000";
		},

		/**
		 * TODO
		 */
		yellow: function () {
			this.el.style.border = "3px solid #FFFF00";
		},

		/**
		 * TODO
		 */
		green: function () {
			this.el.style.border = "3px solid #00FF00";
		},

		/**
		 * TODO
		 */
		grey: function () {
			this.el.style.border = "3px solid gray";
		},

		/**
		 * Remove this container from the dom
		 * @method remove
		 */
		remove: function () {
			// Remove the terminals (and thus remove the wires)
			this.removeAllTerminals();

			// Remove from the dom
			this.layer.el.removeChild(this.el);

			// Remove all event listeners
			Event.purgeElement(this.el);
		},

		/**
		 * Call the addTerminal method for each terminal configuration.
		 * @method initTerminals
		 */
		initTerminals: function (terminalConfigs) {
			for (var i = 0; i < terminalConfigs.length; i++) {
				this.addTerminal(terminalConfigs[i]);
			}
		},


		/**
		 * Instanciate the terminal from the class pointer "xtype" (default WireIt.Terminal)
		 * @method addTerminal
		 * @return {WireIt.Terminal}  terminal Created terminal
		 */
		addTerminal: function (terminalConfig) {

			var klass = WireIt.terminalClassFromXtype(terminalConfig.xtype);

			// Instanciate the terminal
			var term = new klass(this.el, terminalConfig, this);

			// Add the terminal to the list
			this.terminals.push(term);

			// Event listeners
			term.eventAddWire.subscribe(this.onAddWire, this, true);
			term.eventRemoveWire.subscribe(this.onRemoveWire, this, true);

			return term;
		},

		/**
		 * This method is called when a wire is added to one of the terminals
		 * @method onAddWire
		 * @param {Event} event The eventAddWire event fired by the terminal
		 * @param {Array} args This array contains a single element args[0] which is the added Wire instance
		 */
		onAddWire: function (event, args) {
			var wire = args[0];
			// add the wire to the list if it isn't in
			if (WireIt.indexOf(wire, this.wires) == -1) {
				this.wires.push(wire);
				this.eventAddWire.fire(wire);
			}
		},

		/**
		 * This method is called when a wire is removed from one of the terminals
		 * @method onRemoveWire
		 * @param {Event} event The eventRemoveWire event fired by the terminal
		 * @param {Array} args This array contains a single element args[0] which is the removed Wire instance
		 */
		onRemoveWire: function (event, args) {
			var wire = args[0];
			var index = WireIt.indexOf(wire, this.wires);
			if (index != -1) {
				this.eventRemoveWire.fire(wire);
				this.wires[index] = null;
			}
			this.wires = WireIt.compact(this.wires);
		},

		/**
		 * Remove all terminals
		 * @method removeAllTerminals
		 */
		removeAllTerminals: function () {
			for (var i = 0; i < this.terminals.length; i++) {

				this.terminals[i].remove();
			}
			this.terminals = [];
		},

		/**
		 * Redraw all the wires connected to the terminals of this container
		 * @method redrawAllTerminals
		 */
		redrawAllWires: function () {
			for (var i = 0; i < this.terminals.length; i++) {
				this.terminals[i].redrawAllWires();
			}
		},

		/**
		 * Get the position relative to the layer (if any)
		 * @method getXY
		 * @return Array position
		 */
		getXY: function () {
			var position = Dom.getXY(this.el);
			console.log(this);
			console.log(position);
			if (this.layer) {
				// remove the layer position to the container position
				var layerPos = Dom.getXY(this.layer.el);
				console.log("layerPos");console.log(layerPos);
				position[0] -= layerPos[0];
				position[1] -= layerPos[1];
				// add the scroll position of the layer to the container position
				position[0] += this.layer.el.scrollLeft;
				position[1] += this.layer.el.scrollTop;
			}

			console.log("position: ");
			console.log(position);

			return position;
		},

		/**
		 * Return the config of this container.
		 * @method getConfig
		 */
		getConfig: function () {
			return {
				position: this.getXY(),
				xtype: this.xtype,
				collapsed: this.collapsed
			};
		},

		/**
		 * Subclasses should override this method.
		 * @method getValue
		 * @return {Object} value
		 */
		getValue: function () {
			return {};
		},

		getTemplateValue: function () {
			return {};
		},

		/**
		 * Subclasses should override this method.
		 * @method setValue
		 * @param {Any} val Value
		 */
		setValue: function (val) {
		},


		/**
		 * @method getTerminal
		 */
		getTerminal: function (name) {
			var term;
			for (var i = 0; i < this.terminals.length; i++) {
				term = this.terminals[i];
				if (term.name == name) {
					return term;
				}
			}
			return null;
		}

	};

})();

/**
 * Include the form library inputEx + WirableField + FormContainer
 *
 * WARNING: This file should be placed between "inputEx/field.js" and all other inputEx fields
 *
 * See the inputEx website for documentation of the fields & forms: http://neyric.github.com/inputex
 *
 * @module inputex-plugin
 */
/**
 * Class used to build a container with inputEx forms
 * @class FormContainer
 * @namespace WireIt
 * @extends WireIt.Container
 * @constructor
 * @param {Object}   options  Configuration object (see properties)
 * @param {WireIt.Layer}   layer The WireIt.Layer (or subclass) instance that contains this container
 */
WireIt.FormContainer = function (options, layer) {
	WireIt.FormContainer.superclass.constructor.call(this, options, layer);
};

YAHOO.lang.extend(WireIt.FormContainer, WireIt.Container, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.FormContainer"
	 * @type String
	 */
	xtype: "WireIt.FormContainer",

	/**
	 * @property fields
	 * @description List of inputEx field definitions
	 * @default []
	 * @type Array
	 */
	fields: [],

	/**
	 * @property legend
	 * @description Legend
	 * @default null
	 * @type String
	 */
	legend: null,

	/**
	 * @property collapsible
	 * @description Collapsible
	 * @default false
	 * @type Boolean
	 */
	collapsible: false,

	/**
	 * The render method is overrided to call renderForm
	 * @method render
	 */
	render: function () {
		WireIt.FormContainer.superclass.render.call(this);
		this.renderForm();





	},

	/**
	 * Render the form
	 * @method renderForm
	 */
	renderForm: function () {
		this.setBackReferenceOnFieldOptionsRecursively(this.fields);

		var groupParams = {parentEl: this.bodyEl, fields: this.fields, legend: this.legend, collapsible: this.collapsible};
		this.form = new inputEx.Group(groupParams);

		// Redraw all wires when the form is collapsed
		if (this.form.legend) {
			YAHOO.util.Event.addListener(this.form.legend, 'click', function () {

				// Override the getXY method on field terminals:
				var that = this;
				for (var i = 0; i < this.form.inputs.length; i++) {
					var field = this.form.inputs[i];
					if (field.terminal) {
						field.terminal.getXY = function () {
							if (YAHOO.util.Dom.hasClass(that.form.fieldset, "inputEx-Collapsed")) {
								return that.getXY();
							}
							else {
								return WireIt.Terminal.prototype.getXY.call(this);
							}

						};
					}
				}

				this.redrawAllWires();
			}, this, true);
		}
	},

	/**
	 * When creating wirable input fields, the field configuration must have a reference to the current container (this is used for positionning).
	 * For complex fields (like object or list), the reference is set recursively AFTER the field creation.
	 * @method setBackReferenceOnFieldOptionsRecursively
	 */
	setBackReferenceOnFieldOptionsRecursively: function (fieldArray, container) {
		if (YAHOO.lang.isUndefined(container))
			container = this;

		for (var i = 0; i < fieldArray.length; i++) {
			var inputParams = fieldArray[i];
			inputParams.container = container;

			// Checking for group sub elements
			if (inputParams.fields && typeof inputParams.fields == 'object') {
				this.setBackReferenceOnFieldOptionsRecursively(inputParams.fields);
			}

			// Checking for list sub elements
			if (inputParams.elementType) {
				inputParams.elementType.container = container;

				// Checking for group elements within list elements
				if (inputParams.elementType.fields && typeof inputParams.elementType.fields == 'object') {
					this.setBackReferenceOnFieldOptionsRecursively(inputParams.elementType.fields);
				}
			}
		}
	},

	/**
	 * @method getValue
	 */
	getValue: function () {
		return this.form.getValue();
	},

	getTemplateValue: function(){
		return this.form.getTemplateValue();
	},

	/**
	 * @method setValue
	 */
	setValue: function (val) {
		this.form.setValue(val);
	}

});



//SISOB container
/**
 * Container with left inputs and right outputs
 * @class SISOBContainer
 * @extends WireIt.FormContainer
 * @constructor
 * @param {Object} options
 * @param {WireIt.Layer} layer
 */
WireIt.SISOBContainer = function (options, layer) {

	WireIt.SISOBContainer.superclass.constructor.call(this, options, layer);
	this.opts = options;


//	var self = this;
//	if(this.collapsed)
//	{
//		setTimeout(function(){
//			self.collapse();
//		}, 500);
//	}

};

YAHOO.lang.extend(WireIt.SISOBContainer, WireIt.FormContainer, {

	/**
	 * @property xtype
	 * @description String representing this class for exporting as JSON
	 * @default "WireIt.ImageContainer"
	 * @type String
	 */
	xtype: "WireIt.SISOBContainer",


	/**
	 * @property className
	 * @description CSS class name for the container element
	 * @default "WireIt-Container WireIt-ImageContainer"
	 * @type String
	 */
	className: "WireIt-Container WireIt-FormContainer WireItSISOBContainer",

	opts: [],
	/**
	 * @property inputs
	 * @description Array of name label pairs for which an Input terminal will be created.
	 * @default []
	 * @type Array
	 */
	descriptionText: "",

	/**
	 * @property inputs
	 * @description Array of name label pairs for which an Input terminal will be created.
	 * @default []
	 * @type Array
	 */
	inputs: [],

	/**
	 * @property outputs
	 * @description Array of name label pairs for which an Output terminal will be created.
	 * @default []
	 * @type Array
	 */
	outputs: [],

	detailsHidden: true,

	isOutputFilter: false,


	redrawAllWires: function()
	{
		for (var i = 0; i < this.terminals.length; i++) {

			this.terminals[i].redrawAllWires();
		}
	},


	collapse: function(button)
	{
//		console.log("collapse: " + button);

		if(button)
		{
			button.addClass("expandButton");
		}
		this.collapsed = true;

		var ddHandle = $(this.ddHandle);
		// add handles width as fixed with in css
		//   ohterwise the container would shrink in its with when collapsing
		var w = ddHandle.width();
		ddHandle.css("width", w + "px");

		$(this.bodyEl).children().each(function(index, elem){
			$(elem).hide();
		});


		this.redrawAllWires();
	},

	expand: function(button)
	{
		if(button)
		{
			button.removeClass("expandButton");
		}
		this.collapsed=false;


		$(this.bodyEl).children().each(function(index, elem){
			var e = $(elem);

			// expand except for the details text
			if(!e.hasClass("sisobDescriptionText"))
			{
				e.show();
			}
		});

		this.redrawAllWires();
	},

	// button jquery that gets the expandButton class added or removed
	toggleCollapse: function(button)
	{
		try{
		SC.socket.emit('statistics', { username: GLOBAL_WORKBENCH.loginName, action: 'toggleCollapse' });
		}catch(err){}
//		console.log("toggleCollapse");
//		console.log(this);
		if(this.collapsed)
		{
			this.expand(button);
		}else
		{
			this.collapse(button);
		}
	},



	/**
	 * @method render
	 */
	render: function () {
//		console.log("SISOBContainer render");
		WireIt.SISOBContainer.superclass.render.call(this);

		var self = this;

		var bottomLine = WireIt.cn('div', {align: "right"}, null);
		var button = WireIt.cn('span', {className: "sisobContainerButton"}, {width: "20px", cursor: "pointer"}, "show details...");

		bottomLine.appendChild(button);

		var description = WireIt.cn('div', {className: "sisobDescriptionText"}, {display: "none"}, this.descriptionText);

		// copy button

        var copyButton = WireIt.cn('div', {className: "copyButton"});
        if (this.ddHandle) {
            this.ddHandle.appendChild(copyButton);
        }
        else {
            this.el.appendChild(copyButton);
        }



        copyButton.title = "copy filter";

		YAHOO.util.Event.addListener(button, 'click', function () {

			if (this.detailsHidden) {

				button.firstChild.data = "...hide details";
				description.style.display = "block";
				this.detailsHidden = false;
			} else {
				button.firstChild.data = "show details...";
				description.style.display = "none";
				this.detailsHidden = true;
			}

			this.redrawAllWires();

		}, this, true);

        YAHOO.util.Event.addListener(copyButton, 'click', function () {

			try{
			SC.socket.emit('statistics', { username: GLOBAL_WORKBENCH.loginName, action: 'copyButton' });
			}catch(err){}

            var copyClass = WireIt.terminalClassFromXtype("WireIt.SISOBContainer");

            var copy = new copyClass(this.opts, this.layer);
            this.layer.addContainerDirect(copy);

            copy.setValue(this.getValue());
        }, this, true);

		this.bodyEl.appendChild(bottomLine);
		this.bodyEl.appendChild(description);



		var termClassInput = WireIt.terminalClassFromXtype("WireIt.SISOBTerminalInput");
		var termClassOutput = WireIt.terminalClassFromXtype("WireIt.SISOBTerminalOutput");
		//WireIt.terminalClassFromXtype("WireIt.Terminal");


		var itc;
		var otc;

		var left = 100;
		if(this.inputs.length > 0)
		{

			// if we have one or more input create the input div
			$(this.el).uniqueId();
//			var inputdivs = $("<div id='inputs'></div>");
//			$(this.bodyEl).prepend(inputdivs);

			for (var i = 0; i < this.inputs.length; i++) {
				var input = this.inputs[i];
				itc = {
					"name": input.name,
					"label": input.label,
					"direction": [ 0, -1 ],
					"nMaxWires": 1,
					"offsetPosition": {
						"left": left,
						"top": -15
					},
					"isInput": true // JADO
				}


				// Instanciate the terminal
				var term = new termClassInput(this.el, itc, this);

				//alert(term.classname);
				// Add the terminal to the list
				this.terminals.push(term);

				$(term.el).on("click", function(){
					if(GLOBAL_WORKBENCH.lastClickedOutputTerminal != null)
					{
						console.log("connecting");
						console.log(term);
						console.log(GLOBAL_WORKBENCH.lastClickedOutputTerminal);
					}
				});


				// Event listeners
				term.eventAddWire.subscribe(this.onAddWire, this, true);
				term.eventRemoveWire.subscribe(this.onRemoveWire, this, true);
				//this.bodyEl.appendChild(WireIt.cn('div', {className:"terminalLabel"}, {lineHeight: "12px", left: left + "px", top: "2px", position: "absolute", zIndex: "9999"}, input.label));
				left = left + 60; //40;
			}

		}

		left = 100;

		if(this.outputs.length>0)
		{
			// if we have one or more outputs create the output div
			$(this.el).uniqueId();
//			var outputdivs = $("<div id='outputs'></div>");
//			$(this.bodyEl).append(outputdivs);

			for (i = 0; i < this.outputs.length; i++) {
				var output = this.outputs[i];
				otc = {
					"name": output.name,
					"label": output.label,
					"alwaysSrc": true,
					"direction": [ 0, 1 ],
					"nMaxWires": 1,
					"offsetPosition": {
						"left": left,
						"bottom": -15
					},
					"isInput": false // JADO
				}

//				var terminal = $("<div class='sisob-terminal' id='"+output.name+"'>OUT</div>");
//				var terminal = $("<div class='sisob-terminal-out'>OUT</div>");
//				terminal.uniqueId();
//				outputdivs.append(terminal);

				var term = new termClassOutput(this.el, otc, this);

				// Add the terminal to the list
				this.terminals.push(term);

				if( GLOBAL_WORKBENCH && GLOBAL_WORKBENCH.options && GLOBAL_WORKBENCH.options.tapToConnect)
				{
					this.setUpTapToConnect(term);
				}
				else
				{
//					this.setUpDragAndDropConnect(term);
					// drag and drop set up done in Terminal Proxy
				}

				// Event listeners
				term.eventAddWire.subscribe(this.onAddWire, this, true);
				term.eventRemoveWire.subscribe(this.onRemoveWire, this, true);

				//this.bodyEl.appendChild(WireIt.cn('div', {className:"terminalLabel"}, {lineHeight: "12px", left: left + "px", bottom: "2px", position: "absolute", zIndex: "9999"}, output.label));
				left = left + 60; //40;
			}

		}

		this.toggleCollapseButton = $("<div class='toggleCollapseButton' title='toggle collapse'></div>");
		$(this.ddHandle).append(this.toggleCollapseButton);

		this.toggleCollapseButton.on('click', function(){
			self.toggleCollapse.call(self, self.toggleCollapseButton);
		});


		var jContainer = $(this.el);
		jContainer.uniqueId();

		setTimeout(function(){

			// workaround otherwise the rendering seems to be incomplete or for some reason it does not take the right
			//   canvasPosition coordinates
			var canvasPosition = $(".WireIt-Layer").position();
			jContainer.draggable(
				{
					/* handle: '.WireIt-Container-ddhandle', */
					containment: [canvasPosition.left,canvasPosition.top],
					drag: function(){
	//					console.log("drag redraw");
						var terminals = self.terminals;
						var terminalList = YAHOO.lang.isArray(terminals) ? terminals : (terminals.isWireItTerminal ? [terminals] : []);
						// Redraw all the wires
						for (var i = 0; i < terminalList.length; i++) {
							/*if(terminalList[i].wires) {
							 for(var k = 0 ; k < terminalList[i].wires.length ; k++) {
							 terminalList[i].wires[k].redraw();
							 }
							 }*/

							terminalList[i].redrawAllWires();
						}
					}
			});

			self.redrawAllWires();
			if(self.collapsed)
			{
				self.collapse(self.toggleCollapseButton);
			}





		}, 1000);

	},


	setUpTapToConnect: function(outputTerminal)
	{
		$(outputTerminal.el).bind("click", [outputTerminal], function(event){
			event.stopPropagation();
			var term = event.data[0];

			// if there is a wire for this terminal remove it
			if(term.wires.length > 0)
			{
				term.removeAllWires();
				return;
			}

			$(GLOBAL_WORKBENCH.layer.el).on("click", function(){
				console.log("layer click");
				console.log(GLOBAL_WORKBENCH.lastClickedOutputTerminal);
				GLOBAL_WORKBENCH.lastClickedOutputTerminal = null;

				var containers = GLOBAL_WORKBENCH.layer.containers;
				for(var i=0;i<containers.length;++i)
				{
					var c = containers[i];
					var jContainer = $(c.el);
					jContainer.off("click");
					jContainer.removeClass("connection-target-highlight");
				}

				$(GLOBAL_WORKBENCH.layer.el).off("click");
			});

			GLOBAL_WORKBENCH.lastClickedOutputTerminal = term;


			var containers = GLOBAL_WORKBENCH.layer.containers;
			for(var i=0;i<containers.length;++i)
			{
				var c = containers[i];
				var jContainer = $(c.el);

				var currentContainerId = event.currentTarget.parentNode.id;
				if(currentContainerId == c.el.id){
					console.log("skipping self");
					continue;
				}

				console.log(c);
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

					//								for(var v=0;v<len;++v)
					//								{
					//									var terminal = c.terminals[v];
					//									if(terminal.isInput)
					//										$(terminal.el).addClass("connection-target-highlight");
					//								}

					jContainer.addClass("connection-target-highlight");
					//TODO: change cursor to hand, this is not enough
					jContainer.css("cursor", "hand");

					jContainer.on("click", function(event){
						event.stopPropagation();
						//TODO: prevent the header buttons to fire and highlight on mouse over

						if(GLOBAL_WORKBENCH.lastClickedOutputTerminal == null)
						{
							console.log("lastClickeOutputTerminal NULL");
							return;
						}

						// unfortunately we can not use the c (the container) from the
						//  surrounding method because will will only have the value from
						//  the last added container
						var id = $(this).attr('id');
						var cont = null;
						var containers = GLOBAL_WORKBENCH.layer.containers;
						for(var k=0;k<containers.length;++k)
						{
							console.log(containers[k]);
							if(containers[k].el.id == id)
							{
								cont = containers[k];
							}
						}
						if(cont==null)return;

						var jCont = $(cont.el);
						jCont.removeClass("connection-target-highlight");
						jCont.off("click");


						// get the first unconnected terminal
						for(var i=0;i< cont.terminals.length;i++)
						{
							if(cont.terminals[i].wires.length==0)
							{
								var endTerm = cont.terminals[i];
								GLOBAL_WORKBENCH.connectTerminals(GLOBAL_WORKBENCH.lastClickedOutputTerminal, endTerm);
								break;
							}
						}


						GLOBAL_WORKBENCH.lastClickedOutputTerminal = null;
						for(var i=0;i<containers.length;++i)
						{
							var c = containers[i];
							var jContainer = $(c.el);
							jContainer.off("click");
							jContainer.removeClass("connection-target-highlight");
						}
						$(GLOBAL_WORKBENCH.layer.el).off("click");
					});

				}
			}
		});

	},

	colorContainer: function(color) {
		this.ddHandle.style.backgroundColor = color;
	},

	colorContainerDefault: function() {
//		this.colorContainer("#3366CC");
		$(this.ddHandle).removeClass("colorContainerWaiting colorContainerWorking colorContainerDone colorContainerError");
	},

	colorContainerWaiting: function() {
//		this.colorContainer("#3366CC");
		this.colorContainerDefault();
		$(this.ddHandle).addClass("colorContainerWaiting");
	},

	colorContainerWorking: function() {
//		this.colorContainer("#FFCC33");
		this.colorContainerDefault();
		$(this.ddHandle).addClass("colorContainerWorking");
	},

	colorContainerDone: function() {
		console.log("colorContainerDone");
		console.log(this.ddHandle);
		this.colorContainerDefault();
//		this.colorContainer("#33CC00");
		$(this.ddHandle).addClass("colorContainerDone");
	},

	colorContainerError: function() {
//		this.colorContainer("#CC2200");
		this.colorContainerDefault();
		$(this.ddHandle).addClass("colorContainerError");
	}
});
