/**
 * inputEX Library
 */

/**
 * The inputEx Library
 * @module inputEx
 */
/*global inputEx: false, YAHOO: false */
(function () {

	var lang = YAHOO.lang;

	/**
	 * The inputEx method lets you create a field from the JSON definition:
	 * <pre>
	 *    inputEx({type: 'string', name: 'company', label: 'Your company' })
	 * </pre>
	 * Build a field from an object like: { type: 'color' or fieldClass: inputEx.ColorField, ... }<br />
	 * If the neither type or fieldClass are found, it uses inputEx.StringField
	 *
	 * @class inputEx
	 * @static
	 * @param {Object} fieldOptions
	 * @param {inputEx.Group|inputEx.Form|inputEx.ListField|inputEx.CombineField} (optional) parentField The parent field instance
	 * @return {inputEx.Field} Created field instance
	 */
	inputEx = function (fieldOptions, parentField) {
		var fieldClass = null,
			inputInstance;

		if (fieldOptions.type) {
			fieldClass = inputEx.getFieldClass(fieldOptions.type);
			if (fieldClass === null) fieldClass = inputEx.StringField;
		}
		else {
			fieldClass = fieldOptions.fieldClass ? fieldOptions.fieldClass : inputEx.StringField;
		}

		// Instanciate the field

		// Retro-compatibility with deprecated inputParams Object
		if (lang.isObject(fieldOptions.inputParams)) {
			inputInstance = new fieldClass(fieldOptions.inputParams);

			// New prefered way to instanciate a field
		} else {
			inputInstance = new fieldClass(fieldOptions);
		}

		// If the parentField argument is provided
		if (parentField) {
			inputInstance.setParentField(parentField);
		}

		// Add the flatten attribute if present in the params
		/*if(fieldOptions.flatten) {
		 inputInstance._flatten = true;
		 }*/

		return inputInstance;
	};

	lang.augmentObject(inputEx, {

		VERSION: "0.5.0",

		/**
		 * Url to the spacer image. This url schould be changed according to your project directories
		 * @type String
		 */
		spacerUrl: "images/space.gif", // 1x1 px

		/**
		 * Field empty state constant
		 * @type String
		 */
		stateEmpty: 'empty',

		/**
		 * Field required state constant
		 * @type String
		 */
		stateRequired: 'required',

		/**
		 * Field valid state constant
		 * @type String
		 */
		stateValid: 'valid',

		/**
		 * Field invalid state constant
		 * @type String
		 */
		stateInvalid: 'invalid',

		/**
		 * Associative array containing field messages
		 */
		messages: {
			required: "This field is required",
			invalid: "This field is invalid",
			valid: "This field is valid",
			defaultDateFormat: "m/d/Y",
			months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			timeUnits: { SECOND: "seconds", MINUTE: "minutes", HOUR: "hours", DAY: "days", MONTH: "months", YEAR: "years" }
		},

		/**
		 * inputEx widget namespace
		 * @static
		 */
		widget: {},

		/**
		 * inputEx mixin namespace
		 * @static
		 */
		mixin: {},

		/**
		 * Associative array containing common regular expressions
		 */
		regexps: {
			email: /^[a-z0-9!\#\$%&'\*\-\/=\?\+\-\^_`\{\|\}~]+(?:\.[a-z0-9!\#\$%&'\*\-\/=\?\+\-\^_`\{\|\}~]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,6}$/i,
			url: /^(http|https):\/\/[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(\:[0-9]{1,5})?(([0-9]{1,5})?\/.*)?$/i,
			password: /^[0-9a-zA-Z\x20-\x7E]*$/
		},

		/**
		 * Hash between inputEx types and classes (ex: <code>inputEx.typeClasses.color = inputEx.ColorField</code>)<br />
		 * Please register the types with the <code>registerType</code> method
		 */
		typeClasses: {},

		/**
		 * Property to globally turn on/off the browser autocompletion
		 * (used as default autocomplete option value by StringField, Form and their subclasses)
		 */
		browserAutocomplete: true,

		/**
		 * When you create a new inputEx Field Class, you can register it to give it a simple type.
		 * ex:   inputEx.registerType("color", inputEx.ColorField);
		 * @static
		 * @param {String} type String used as the inputEx field type
		 * @param {Class} fieldClass Field Class to register as this type
		 * @param {Array} groupOptions List of inputEx field description for each option
		 * @param {Boolean} dontInherit Won't inherhit the parent field properties if set to true
		 */
		registerType: function (type, fieldClass, groupOptions, dontInherit) {
			if (!lang.isString(type)) {
				throw new Error("inputEx.registerType: first argument must be a string");
			}
			if (!lang.isFunction(fieldClass)) {
				throw new Error("inputEx.registerType: second argument must be a function");
			}
			this.typeClasses[type] = fieldClass;

			// Setup the groupOptions property on the class
			var opts = [];
			if (lang.isArray(groupOptions)) {
				opts = groupOptions;
			}
			if (fieldClass.superclass && !dontInherit && lang.isArray(fieldClass.superclass.constructor.groupOptions)) {
				opts = opts.concat(fieldClass.superclass.constructor.groupOptions);
			}
			fieldClass.groupOptions = opts;
		},

		/**
		 * Returns the class for the given type
		 * ex: inputEx.getFieldClass("color") returns inputEx.ColorField
		 * @static
		 * @param {String} type String type of the field
		 */
		getFieldClass: function (type) {
			return lang.isFunction(this.typeClasses[type]) ? this.typeClasses[type] : null;
		},

		/**
		 * Get the inputex type for the given class (ex: <code>inputEx.getType(inputEx.ColorField)</code> returns "color")
		 * @static
		 * @param {inputEx.Field} FieldClass An inputEx.Field or derivated class
		 * @return {String} returns the inputEx type string or <code>null</code>
		 */
		getType: function (FieldClass) {
			for (var type in this.typeClasses) {
				if (this.typeClasses.hasOwnProperty(type)) {
					if (this.typeClasses[type] == FieldClass) {
						return type;
					}
				}
			}
			return null;
		},

		/**
		 * @deprecated Kept for backward compatibility (alias for inputEx() )
		 * @param {Object} fieldOptions
		 * @return {inputEx.Field} Created field instance
		 */
		buildField: function (fieldOptions) {
			return inputEx(fieldOptions);
		},

		/**
		 * Helper function to set DOM node attributes and style attributes.
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
					var domAttribute = domAttributes[i];
					if (lang.isFunction(domAttribute)) {
						continue;
					}
					if (i == "className") {
						i = "class";
						el.className = domAttribute;
					}
					if (domAttribute !== el.getAttribute(i)) {
						try {
							if (domAttribute === false) {
								el.removeAttribute(i);
							} else {
								el.setAttribute(i, domAttribute);
							}
						}
						catch (err) {
							//console.log("WARNING: WireIt.sn failed for "+el.tagName+", attr "+i+", val "+domAttribute);
						}
					}
				}
			}

			if (styleAttributes) {
				for (i in styleAttributes) {
					if (lang.isFunction(styleAttributes[i])) {
						continue;
					}
					if (el.style[i] != styleAttributes[i]) {
						el.style[i] = styleAttributes[i];
					}
				}
			}
		},


		/**
		 * Helper function to create a DOM node. (wrapps the document.createElement tag and the inputEx.sn functions)
		 * @static
		 * @param {String} tag The tagName to create (ex: 'div', 'a', ...)
		 * @param {Object} [domAttributes] see inputEx.sn
		 * @param {Object} [styleAttributes] see inputEx.sn
		 * @param {String} [innerHTML] The html string to append into the created element
		 * @return {HTMLElement} The created node
		 */
		cn: function (tag, domAttributes, styleAttributes, innerHTML) {
			if (tag == 'input' && YAHOO.env.ua.ie) { //only limit to input tag that has no tag body
				var strDom = '<' + tag;
				if (domAttributes !== 'undefined') {
					for (var k in domAttributes) {
						strDom += ' ' + (k === "className" ? "class" : k) + '="' + domAttributes[k] + '"';
					}
				}
				strDom += '/' + '>';
				return document.createElement(strDom);

			} else {
				var el = document.createElement(tag);
				this.sn(el, domAttributes, styleAttributes);
				if (innerHTML) {
					el.innerHTML = innerHTML;
				}
				return el;
			}
		},


		/**
		 * Find the position of the given element. (This method is not available in IE 6)
		 * @static
		 * @param {Object} el Value to search
		 * @param {Array} arr The array to search
		 * @param {Function} (optional) fn A function to define another way to test inclusion of el than === (returns a boolean)
		 * @return {number} Element position, -1 if not found
		 */
		indexOf: function (el, arr, fn) {

			var l = arr.length, i;

			if (!lang.isFunction(fn)) {
				fn = function (elt, arrElt) {
					return elt === arrElt;
				};
			}

			for (i = 0; i < l; i++) {
				if (fn.call({}, el, arr[i])) {
					return i;
				}
			}

			return -1;
		},


		/**
		 * Create a new array without the null or undefined values
		 * @static
		 * @param {Array} arr The array to compact
		 * @return {Array} The new array
		 */
		compactArray: function (arr) {
			var n = [], l = arr.length, i;
			for (i = 0; i < l; i++) {
				if (!lang.isNull(arr[i]) && !lang.isUndefined(arr[i])) {
					n.push(arr[i]);
				}
			}
			return n;
		},

		/**
		 * Return a string without accent (only on lowercase)
		 * @static
		 * @param {String} str The string
		 * @return {String} String without accent
		 */
		removeAccents: function (str) {
			return str.replace(/[????????????]/g, "a").
				replace(/[????????]/g, "e").
				replace(/[????????]/g, "i").
				replace(/[??????????]/g, "o").
				replace(/[????????]/g, "u").
				replace(/[????]/g, "y").
				replace(/[??]/g, "n").
				replace(/[??]/g, "c").
				replace(/[??]/g, "oe").
				replace(/[??]/g, "ae");
		}

	});

})();


// The main inputEx namespace shortcut
YAHOO.inputEx = inputEx;
(function () {
	var Dom = YAHOO.util.Dom, lang = YAHOO.lang, util = YAHOO.util;

	/**
	 * An abstract class (never instantiated) that contains the shared features for all fields.
	 * @class inputEx.Field
	 * @constructor
	 * @param {Object} options Configuration object
	 * <ul>
	 *      <li>name: the name of the field</li>
	 *      <li>required: boolean, the field cannot be null if true</li>
	 *   <li>className: CSS class name for the div wrapper (default 'inputEx-Field')</li>
	 *   <li>value: initial value</li>
	 *   <li>parentEl: HTMLElement or String id, append the field to this DOM element</li>
	 * </ul>
	 */
	inputEx.Field = function (options) {

		// Set the default values of the options
		this.setOptions(options || {});

		// Call the render of the dom
		this.render();

		/**
		 * Event fired after the user changed the value of the field.
		 * @event updatedEvt
		 * @param {Any} value The new value of the field
		 * @desc YAHOO custom event fired when the field is "updated"<br /> subscribe with: this.updatedEvt.subscribe(function(e, params) { var value = params[0]; console.log("updated",value, this.updatedEvt); }, this, true);
		 */
		this.updatedEvt = new util.CustomEvent('updated', this);

		// initialize behaviour events
		this.initEvents();

		// Set the initial value
		//   -> no initial value = no style (setClassFromState called by setValue)
		if (!lang.isUndefined(this.options.value)) {
			this.setValue(this.options.value, false);
		}

		// append it immediatly to the parent DOM element
		if (options.parentEl) {
			if (lang.isString(options.parentEl)) {
				Dom.get(options.parentEl).appendChild(this.getEl());
			}
			else {
				options.parentEl.appendChild(this.getEl());
			}
		}
	};


	inputEx.Field.prototype = {

		/**
		 * Set the default values of the options
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {

			/**
			 * Configuration object to set the options for this class and the parent classes. See constructor details for options added by this class.
			 */
			this.options = {};

			// Basic options
			this.options.name = options.name;
			this.options.value = options.value;
			this.options.id = options.id || Dom.generateId();
			this.options.label = options.label;
			this.options.description = options.description;

			// Define default messages
			this.options.messages = {};
			this.options.messages.required = (options.messages && options.messages.required) ? options.messages.required : inputEx.messages.required;
			this.options.messages.invalid = (options.messages && options.messages.invalid) ? options.messages.invalid : inputEx.messages.invalid;
			//this.options.messages.valid = (options.messages && options.messages.valid) ? options.messages.valid : inputEx.messages.valid;

			// Other options
			this.options.className = options.className ? options.className : 'inputEx-Field';
			this.options.required = lang.isUndefined(options.required) ? false : options.required;
			this.options.showMsg = lang.isUndefined(options.showMsg) ? false : options.showMsg;
		},

		/**
		 * Default render of the dom element. Create a divEl that wraps the field.
		 */
		render: function () {

			// Create a DIV element to wrap the editing el and the image
			this.divEl = inputEx.cn('div', {className: 'inputEx-fieldWrapper'});
			if (this.options.id) {
				this.divEl.id = this.options.id;
			}
			if (this.options.required) {
				Dom.addClass(this.divEl, "inputEx-required");
			}

			// Label element
			if (this.options.label) {
				this.labelDiv = inputEx.cn('div', {id: this.divEl.id + '-label', className: 'inputEx-label', 'for': this.divEl.id + '-field'});
				this.labelEl = inputEx.cn('label');
				this.labelEl.appendChild(document.createTextNode(this.options.label));
				this.labelDiv.appendChild(this.labelEl);
				this.divEl.appendChild(this.labelDiv);
			}

			this.fieldContainer = inputEx.cn('div', {className: this.options.className}); // for wrapping the field and description

			// Render the component directly
			this.renderComponent();

			// Description
			if (this.options.description) {
				this.fieldContainer.appendChild(inputEx.cn('div', {id: this.divEl.id + '-desc', className: 'inputEx-description'}, null, this.options.description));
			}

			this.divEl.appendChild(this.fieldContainer);

			// Insert a float breaker
			this.divEl.appendChild(inputEx.cn('div', null, {clear: 'both'}, " "));

		},

		/**
		 * Fire the "updated" event (only if the field validated)
		 * Escape the stack using a setTimeout
		 */
		fireUpdatedEvt: function () {
			// Uses setTimeout to escape the stack (that originiated in an event)
			var that = this;
			setTimeout(function () {
				that.updatedEvt.fire(that.getValue(), that);
			}, 50);
		},

		/**
		 * Render the interface component into this.divEl
		 */
		renderComponent: function () {
			// override me
		},

		/**
		 * The default render creates a div to put in the messages
		 * @return {HTMLElement} divEl The main DIV wrapper
		 */
		getEl: function () {
			return this.divEl;
		},

		/**
		 * Initialize events of the Input
		 */
		initEvents: function () {
			// override me
		},

		/**
		 * Return the value of the input
		 * @return {Any} value of the field
		 */
		getValue: function () {
			// override me
		},

		/**
		 * Function to set the value
		 * @param {Any} value The new value
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {
			// to be inherited

			// set corresponding style
			this.setClassFromState();

			if (sendUpdatedEvt !== false) {
				// fire update event
				this.fireUpdatedEvt();
			}
		},

		/**
		 * Set the styles for valid/invalide state
		 */
		setClassFromState: function () {
			var className;
			// remove previous class
			if (this.previousState) {
				// remove invalid className for both required and invalid fields
				className = 'inputEx-' + ((this.previousState == inputEx.stateRequired) ? inputEx.stateInvalid : this.previousState);
				Dom.removeClass(this.divEl, className);
			}

			// add new class
			var state = this.getState();
			if (!(state == inputEx.stateEmpty && Dom.hasClass(this.divEl, 'inputEx-focused') )) {
				// add invalid className for both required and invalid fields
				className = 'inputEx-' + ((state == inputEx.stateRequired) ? inputEx.stateInvalid : state);
				Dom.addClass(this.divEl, className);
			}

			if (this.options.showMsg) {
				this.displayMessage(this.getStateString(state));
			}

			this.previousState = state;
		},

		/**
		 * Get the string for the given state
		 */
		getStateString: function (state) {
			if (state == inputEx.stateRequired) {
				return this.options.messages.required;
			}
			else if (state == inputEx.stateInvalid) {
				return this.options.messages.invalid;
			}
			else {
				return '';
			}
		},

		/**
		 * Returns the current state (given its value)
		 * @return {String} One of the following states: 'empty', 'required', 'valid' or 'invalid'
		 */
		getState: function () {
			// if the field is empty :
			if (this.isEmpty()) {
				return this.options.required ? inputEx.stateRequired : inputEx.stateEmpty;
			}
			return this.validate() ? inputEx.stateValid : inputEx.stateInvalid;
		},

		/**
		 * Validation of the field
		 * @return {Boolean} field validation status (true/false)
		 */
		validate: function () {
			return true;
		},

		/**
		 * Function called on the focus event
		 * @param {Event} e The original 'focus' event
		 */
		onFocus: function (e) {
			var el = this.getEl();
			Dom.removeClass(el, 'inputEx-empty');
			Dom.addClass(el, 'inputEx-focused');
		},

		/**
		 * Function called on the blur event
		 * @param {Event} e The original 'blur' event
		 */
		onBlur: function (e) {
			Dom.removeClass(this.getEl(), 'inputEx-focused');

			// Call setClassFromState on Blur
			this.setClassFromState();
		},

		/**
		 * onChange event handler
		 * @param {Event} e The original 'change' event
		 */
		onChange: function (e) {
			this.fireUpdatedEvt();
		},

		/**
		 * Close the field and eventually opened popups...
		 */
		close: function () {
		},

		/**
		 * Disable the field
		 */
		disable: function () {
		},

		/**
		 * Enable the field
		 */
		enable: function () {
		},

		/**
		 * Focus the field
		 */
		focus: function () {
		},

		/**
		 * Purge all event listeners and remove the component from the dom
		 */
		destroy: function () {
			var el = this.getEl();

			// Unsubscribe all listeners on the updatedEvt
			this.updatedEvt.unsubscribeAll();

			// Purge element (remove listeners on el and childNodes recursively)
			util.Event.purgeElement(el, true);

			// Remove from DOM
			if (Dom.inDocument(el)) {
				el.parentNode.removeChild(el);
			}

		},

		/**
		 * Update the message
		 * @param {String} msg Message to display
		 */
		displayMessage: function (msg) {
			if (!this.fieldContainer) {
				return;
			}
			if (!this.msgEl) {
				this.msgEl = inputEx.cn('div', {className: 'inputEx-message'});
				try {
					var divElements = this.divEl.getElementsByTagName('div');
					this.divEl.insertBefore(this.msgEl, divElements[(divElements.length - 1 >= 0) ? divElements.length - 1 : 0]); //insertBefore the clear:both div
				} catch (e) {
					alert(e);
				}
			}
			this.msgEl.innerHTML = msg;
		},

		/**
		 * Show the field
		 */
		show: function () {
			this.divEl.style.display = '';
		},

		/**
		 * Hide the field
		 */
		hide: function () {
			this.divEl.style.display = 'none';
		},

		/**
		 * Clear the field by setting the field value to this.options.value
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this clear should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		clear: function (sendUpdatedEvt) {
			this.setValue(lang.isUndefined(this.options.value) ? '' : this.options.value, sendUpdatedEvt);
		},

		/**
		 * Should return true if empty
		 */
		isEmpty: function () {
			return this.getValue() === '';
		},

		/**
		 * Set the parentField.
		 * Generally use by composable fields (ie. Group,Form,ListField,CombineField,...}
		 * @param {inputEx.Group|inputEx.Form|inputEx.ListField|inputEx.CombineField} parentField The parent field instance
		 */
		setParentField: function (parentField) {
			this.parentField = parentField;
		},

		/**
		 * Return the parent field instance
		 * @return {inputEx.Group|inputEx.Form|inputEx.ListField|inputEx.CombineField}
		 */
		getParentField: function () {
			return this.parentField;
		}

	};

	inputEx.Field.groupOptions = [
		{ type: "string", label: "Label", name: "label", value: '' },
		{ type: "string", label: "Name", name: "name", value: '' },
		{ type: "string", label: "Description", name: "description", value: '' },
		{ type: "boolean", label: "Required?", name: "required", value: false },
		{ type: "boolean", label: "Show messages", name: "showMsg", value: false }
	];

})();
(function () {

	var lang = YAHOO.lang;

	/**
	 * Copy of the original inputEx.Field class that we're gonna override to extend it.
	 * @class BaseField
	 * @namespace inputEx
	 */
	inputEx.BaseField = inputEx.Field;

	/**
	 * Class to make inputEx Fields "wirable".Re-create inputEx.Field adding the wirable properties
	 * @class Field
	 * @namespace inputEx
	 * @extends inputEx.BaseField
	 */
	inputEx.Field = function (options) {
		inputEx.Field.superclass.constructor.call(this, options);
	};

	lang.extend(inputEx.Field, inputEx.BaseField, {

		/**
		 * Adds a wirable option to every field
		 * @method setOptions
		 */
		setOptions: function (options) {
			inputEx.Field.superclass.setOptions.call(this, options);

			this.options.wirable = lang.isUndefined(options.wirable) ? false : options.wirable;
			this.options.container = options.container;
			options.container = null;
		},

		/**
		 * Adds a terminal to each field
		 * @method render
		 */
		render: function () {
			inputEx.Field.superclass.render.call(this);

			if (this.options.wirable) {
				this.renderTerminal();
			}
		},

		/**
		 * Render the associated input terminal
		 * @method renderTerminal
		 */
		renderTerminal: function () {

			var wrapper = inputEx.cn('div', {className: 'WireIt-InputExTerminal'});
			this.divEl.insertBefore(wrapper, this.fieldContainer);

			this.terminal = new WireIt.Terminal(wrapper, {
				name: this.options.name,
				direction: [-1, 0],
				fakeDirection: [0, 1],
				ddConfig: {
					type: "input",
					allowedTypes: ["output"]
				},
				nMaxWires: 1 }, this.options.container);

			// Reference to the container
			if (this.options.container) {
				this.options.container.terminals.push(this.terminal);
			}

			// Register the events
			this.terminal.eventAddWire.subscribe(this.onAddWire, this, true);
			this.terminal.eventRemoveWire.subscribe(this.onRemoveWire, this, true);
		},

		/**
		 * Remove the input wired state on the
		 * @method onAddWire
		 */
		onAddWire: function (e, params) {
			this.options.container.onAddWire(e, params);

			this.disable();
			this.el.value = "[wired]";
		},

		/**
		 * Remove the input wired state on the
		 * @method onRemoveWire
		 */
		onRemoveWire: function (e, params) {
			this.options.container.onRemoveWire(e, params);

			this.enable();
			this.el.value = "";
		}

	});

	inputEx.Field.groupOptions = inputEx.BaseField.groupOptions.concat([
		{ type: 'boolean', label: 'Wirable', name: 'wirable', value: false}
	]);

})();

(function () {

	var lang = YAHOO.lang, Dom = YAHOO.util.Dom, Event = YAHOO.util.Event;

	/**
	 * Handle a group of fields
	 * @class inputEx.Group
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options The following options are added for Groups and subclasses:
	 * <ul>
	 *   <li>fields: Array of input fields declared like { label: 'Enter the value:' , type: 'text' or fieldClass: inputEx.Field, optional: true/false, ... }</li>
	 *   <li>legend: The legend for the fieldset (default is an empty string)</li>
	 *   <li>collapsible: Boolean to make the group collapsible (default is false)</li>
	 *   <li>collapsed: If collapsible only, will be collapsed at creation (default is false)</li>
	 *   <li>flatten:</li>
	 * </ul>
	 */
	inputEx.Group = function (options) {
		inputEx.Group.superclass.constructor.call(this, options);

		// Run default field interactions (if setValue has not been called before)
		if (!this.options.value) {
			this.runFieldsInteractions();
		}
	};
	lang.extend(inputEx.Group, inputEx.Field, {


		/**
		 * Adds some options: legend, collapsible, fields...
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {

			inputEx.Group.superclass.setOptions.call(this, options);

			this.options.className = options.className || 'inputEx-Group';

			this.options.fields = options.fields;

			this.options.flatten = options.flatten;

			this.options.legend = options.legend || '';

			this.options.collapsible = lang.isUndefined(options.collapsible) ? false : options.collapsible;
			this.options.collapsed = lang.isUndefined(options.collapsed) ? false : options.collapsed;

			this.options.disabled = lang.isUndefined(options.disabled) ? false : options.disabled;

			// Array containing the list of the field instances
			this.inputs = [];

			// Associative array containing the field instances by names
			this.inputsNames = {};
		},

		/**
		 * Render the group
		 */
		render: function () {

			// Create the div wrapper for this group
			this.divEl = inputEx.cn('div', {className: this.options.className});
			if (this.options.id) {
				this.divEl.id = this.options.id;
			}

			this.renderFields(this.divEl);

			if (this.options.disabled) {
				this.disable();
			}
		},

		/**
		 * Render all the fields.
		 * We use the parentEl so that inputEx.Form can append them to the FORM tag
		 */
		renderFields: function (parentEl) {

			this.fieldset = inputEx.cn('fieldset');
			this.legend = inputEx.cn('legend', {className: 'inputEx-Group-legend'});

			// Option Collapsible
			if (this.options.collapsible) {
				var collapseImg = inputEx.cn('div', {className: 'inputEx-Group-collapseImg'}, null, ' ');
				this.legend.appendChild(collapseImg);
				inputEx.sn(this.fieldset, {className: 'inputEx-Expanded'});
			}

			if (!lang.isUndefined(this.options.legend) && this.options.legend !== '') {
				this.legend.appendChild(inputEx.cn("span", null, null, " " + this.options.legend));
			}

			if (this.options.collapsible || (!lang.isUndefined(this.options.legend) && this.options.legend !== '')) {
				this.fieldset.appendChild(this.legend);
			}

			// Iterate this.createInput on input fields
			for (var i = 0; i < this.options.fields.length; i++) {
				var input = this.options.fields[i];

				// Throw Error if input is undefined
				if (!input) {
					throw new Error("inputEx.Form: One of the provided fields is undefined ! (check trailing comma)");
				}

				//evtl nur neue (wenn templateView aktiviert) Felder/Container mit Sicht ausstatten?
				//if (true){
				// Render the field
				var field = this.renderField(input);

				//Struktur: Parent(wrapper)->Links(normalview)/Rechts(templateview)
				var divWrapper = inputEx.cn("div", {name:'fieldWrapper', number:i}, {width:'auto',height:'auto'},'');//ParentWrapper

				var normalView = inputEx.cn("div", null, {display:'inline-block',width:'auto'},'');//feldwrapper
				var templateView = inputEx.cn("div", {className: "templateView"}, {display: 'none',width:'auto',marginLeft:'20px',position:'relative',top:'-3px',align:'right',textAlign:'right'},null);//checkboxwrapper
				if(document.getElementById("WiringEditor-expertModeButton-button")){
					if(document.getElementById("WiringEditor-expertModeButton-button").getAttribute("status")=='active'){
						templateView.style.display = "";
					}
				}
				//Configdaten eines Feldes fuer spaeteren export/save zwischenspeichern
				if(!input.CFG){
					input.CFG = {   enabled: false,
						free: true,
						range: false,
						default: false,
						defaultValue: false,
						possibleValues: []
					}
				}

				//Feld
				normalView.appendChild(field.getEl());//feldElement

				//checkbox fuer Configs
				var checkBoxWrapper = inputEx.cn("div", {className:'editCheckBoxWrapper', name: 'editCheckBoxWrapper',number:i}, {display:'inline-block', margin: '3px'}, '');
				var checkBox = inputEx.cn("input", {type: 'checkbox', className:'editCheckBox', name: 'editCheckBox', number:i}, {width:"15px", height:"15px"}, '');
				//Gegen ungueltige Inputdefinition "absichern"
				var allowedInputTypes = [
					"string",
					"int",
					"boolean",
					"select",
					"file"
				];
				checkBox.disabled = true;
				var continueBuild = false;
				for (var d = 0; d<allowedInputTypes.length; d++){
					if (allowedInputTypes[d] == input.type){
						checkBox.disabled = false;
						continueBuild = true;
					}
				}

				if(continueBuild){
					//onclick: configs zeigen und Einblenden/ausblenden aktivieren
					YAHOO.util.Event.addListener(checkBox, 'change', function (e) {
						var target = YAHOO.util.Event.getTarget(e);
						var n = target.getAttribute('number');
						if(target.checked){
							target.parentNode.getElementsByClassName('showhideCheckBox')[0].checked = true;
							target.parentNode.getElementsByClassName('showhideCheckBox')[0].disabled = false;
							var elementsToHandle = target.parentNode.parentNode.getElementsByClassName('config');
							for (var j = 0; j<elementsToHandle.length; j++){
								elementsToHandle[j].style.display = '';
							}
							this.options.fields[n].CFG.enabled = true;
						}
						else{
							target.parentNode.getElementsByClassName('showhideCheckBox')[0].disabled = true;
							target.parentNode.getElementsByClassName('showhideCheckBox')[0].checked = false;
							var elementsToHandle = target.parentNode.parentNode.getElementsByClassName('config');
							for (var j = 0; j<elementsToHandle.length; j++){
								elementsToHandle[j].style.display = 'none';
							}
							this.options.fields[n].CFG.enabled = false;
						}

					}, this, true);
					///File-> keine Auswahl mgl.
					if(input.type=="file"){
						checkBox.disabled = true;
					}
					checkBoxWrapper.appendChild(checkBox);//checkboxElement
					//bild
//					var unlockPic = inputEx.cn("img", {type: 'image', name: 'pic', border: '0', alt:'unlock', src:"lib/assets/unlock.png"}, {width:"15px", height:"15px"}, '');
					var unlockPic = inputEx.cn("img", {type: 'image', name: 'pic', border: '0', alt:'unlock', src:"lib/assets/eye.png"}, {width:"15px", height:"15px"}, '');

					checkBoxWrapper.appendChild(unlockPic);
					var checkBox2 = inputEx.cn("input", {type: 'checkbox', className:'showhideCheckBox', disabled: 'true', name: 'showhideCheckBox', number:i}, {width:"15px", height:"15px"}, '');
					//onclick: configs verstecken/anzeigen
					YAHOO.util.Event.addListener(checkBox2, 'click', function (e) {
						var target = YAHOO.util.Event.getTarget(e);
						var isCFGenabled = target.parentNode.getElementsByClassName('editCheckBox')[0].checked;
						if (isCFGenabled){
							var elementsToHandle = target.parentNode.parentNode.getElementsByClassName('config');
							for (var j = 0; j<elementsToHandle.length; j++){
								if (target.checked){
									elementsToHandle[j].style.display = '';
								}else{
									elementsToHandle[j].style.display = 'none';
								}
							}
						}
					}, this, true);
					checkBoxWrapper.appendChild(checkBox2);//checkboxElement
					//bild
					var eyePic = inputEx.cn("img", {type: 'image', name: 'pic', border: '0', alt:'unlock', src:"lib/assets/eye.png"}, {width:"15px", height:"15px"}, '');
					checkBoxWrapper.appendChild(eyePic);
					templateView.appendChild(checkBoxWrapper);
					if(input.type=="file"){
						templateView.appendChild(inputEx.cn("p",{},{fontStyle:"italic"},"No preselection possible for filechooser."));
					}else{
						templateView.appendChild(inputEx.cn("br", null, null,null));
					}



					///////////////////////////// configs /////////////////////////////////////
					var divConfig = inputEx.cn("div", {name:'config', className: "config", id: input.name + 'CFG', number:i}, {display:'none',width:'auto',marginLeft:''},'');//configWrapper

					/////////////// Auswahl Range oder Free
					var selection = inputEx.cn("div", {number: i}, {display:'block'},'');
					//onclick: range zeigen/verstecken
					YAHOO.util.Event.addListener(selection, 'change', function (e) {
						var target = YAHOO.util.Event.getTarget(e);
						var n = target.getAttribute('number');
						var rangeRadio = target.parentNode.getElementsByClassName('rangeRadio')[0];
						if (rangeRadio.checked){
							target.parentNode.parentNode.getElementsByClassName('rangeSelection')[0].style.display = '';
							this.options.fields[n].CFG.range = true;
							this.options.fields[n].CFG.free = false;
						}else{
							target.parentNode.parentNode.getElementsByClassName('rangeSelection')[0].style.display = 'none';
							this.options.fields[n].CFG.range = false;
							this.options.fields[n].CFG.free = true;
						}
					}, this, true);
					var freeRadioTitle = inputEx.cn("div", null, {display:'inline-block'},'free choice');
					var freeRadio =  inputEx.cn("input", {type: 'radio', id:'freeRadio', name: 'configRadio' + i, value: 'free choice', checked:'true'}, null,'');

					selection.appendChild(freeRadioTitle);
					selection.appendChild(freeRadio);
					selection.appendChild(inputEx.cn("div", null, {display:'inline-block', marginLeft:'5px', marginRight: '5px'},'or'));
					var rangeRadioTitle = inputEx.cn("div", null, {display:'inline-block'},'defined range');
					var rangeRadio =  inputEx.cn("input", {className:'rangeRadio', type: 'radio', name: 'configRadio' + i, number: i}, null,'');
					if (input.type == 'boolean'){rangeRadio.disabled = true;}
					selection.appendChild(rangeRadio);
					selection.appendChild(rangeRadioTitle);

					divConfig.appendChild(selection);
					//divConfig.appendChild(inputEx.cn("br", null, null,null));

					////////////  default wert
					//input->"type", "label", "name", "required", "selectValues", "container"
					var defaultWrapper=inputEx.cn("div", {className:'defaultWrapper', number: i}, {margin: '3px'},null);
					defaultWrapper.appendChild(inputEx.cn("div", {id: "defaultValueDiv"},{display:'inline-block', marginRight:'5px',marginBottom: '2px'},'...with a default selection'));
					var checkBoxDefaultValue = inputEx.cn("input", {type: 'checkbox', className:'defaultCheckBox', name: 'defaultCheckBox', number:i}, {width:"15px", height:"15px"}, '');
					//onclick: defaults zeigen
					YAHOO.util.Event.addListener(checkBoxDefaultValue, 'change', function (e) {
						var target = YAHOO.util.Event.getTarget(e);
						var n = target.getAttribute("number");
						var elements = target.parentNode.getElementsByClassName('defaultCheckBox');
						if (target.checked){
							target.parentNode.parentNode.getElementsByClassName('defaultValue')[0].style.display = '';
							this.options.fields[n].CFG.default = true;
						}else{
							target.parentNode.parentNode.getElementsByClassName('defaultValue')[0].style.display = 'none';
							this.options.fields[n].CFG.default = false;
						}
					}, this, true);
					defaultWrapper.appendChild(checkBoxDefaultValue);//checkboxElement
					////defaultValues
					var defaultValue = inputEx.cn("div", {className:'defaultValue', name:'defaultValue', number: i}, {display:'none'},null);
					switch(input.type){
						case 'select':
							//Auswahl durch Radiobutton this.options.fields[n].CFG.free = false;
							var ul = inputEx.cn("ul", null, null, null);
							if(input.selectValues && !input.choices){
								for (var x = 0; x<input.selectValues.length; x++){
									var li = inputEx.cn("li", null, null, null);
									li.appendChild(inputEx.cn("div", {className:'defaultValueSelection', number: i}, {display:'inline-block'},input.selectValues[x]));
									var liVal = inputEx.cn("input", {type: "radio", name:"defaultValueSelectionRadio", className:'defaultValueSelection', number: i}, null,null);
									YAHOO.util.Event.addListener(liVal, 'change', function (e) {
										var target = YAHOO.util.Event.getTarget(e);
										var n = target.getAttribute("number");
										this.options.fields[n].CFG.defaultValue = target.parentNode.getElementsByClassName("defaultValueSelection")[0].innerHTML;
									}, this, true);
									li.appendChild(liVal);
									ul.appendChild(li);
								}
							}
							if(input.choices && !input.selectValues){
								for (var x = 0; x<input.choices.length; x++){
									var li = inputEx.cn("li", null, null, null);
									li.appendChild(inputEx.cn("div", {className:'defaultValueSelection', number: i}, {display:'inline-block'},input.choices[x]));
									var liVal = inputEx.cn("input", {type: "radio", name:"defaultValueSelectionRadio", className:'defaultValueSelection', number: i}, null,null);
									YAHOO.util.Event.addListener(liVal, 'change', function (e) {
										var target = YAHOO.util.Event.getTarget(e);
										var n = target.getAttribute("number");
										this.options.fields[n].CFG.defaultValue = target.parentNode.getElementsByClassName("defaultValueSelection")[0].innerHTML;
									}, this, true);
									li.appendChild(liVal);
									ul.appendChild(li);
								}
							}
							defaultValue.appendChild(ul);
							break;
						case 'int':
							var def = inputEx.cn("input", {type: "number", className:'defaultValueSelection', number: i}, {width:"50px"},null);
							YAHOO.util.Event.addListener(def, 'change', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var n = target.getAttribute("number");
								this.options.fields[n].CFG.defaultValue = target.value;
							}, this, true);
							defaultValue.appendChild(def);
							break;
						case 'string':
							var def = inputEx.cn("input", {type: "text", className:'defaultValueSelection', number: i}, {width:"150px"},null);
							YAHOO.util.Event.addListener(def, 'change', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var n = target.getAttribute("number");
								this.options.fields[n].CFG.defaultValue = target.value;
							}, this, true);
							defaultValue.appendChild(def);
							break;
						case 'file':
							break;
						case 'boolean':
							var boolWrapper = inputEx.cn("div", {}, {display:'block'},'');
							boolWrapper.appendChild(inputEx.cn("div", {type: "text", className:'defaultValueSelection', number: i}, {display:'inline-block', marginRight:'5px', fontStyle:'italic'},'(checked=true)'));
							var def = inputEx.cn("input", {type: "checkbox", className:'defaultValueSelection', number: i}, {display:'inline-block', width:"15px", height:"15px"},null);
							YAHOO.util.Event.addListener(def, 'change', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var n = target.getAttribute("number");
								if (target.checked == true){
									this.options.fields[n].CFG.defaultValue = true;
								}else{
									this.options.fields[n].CFG.defaultValue = false;
								}
							}, this, true);
							boolWrapper.appendChild(def);

							defaultValue.appendChild(boolWrapper);
							break;
						default:
							//checkBoxDefaultValue.disabled = true;
							break;
					}
					defaultWrapper.appendChild(defaultValue);
					divConfig.appendChild(defaultWrapper);

					///////////////   range selection
					var rangeSelection = inputEx.cn("div", {className:'rangeSelection', number: i}, {display:'none'},null);
					switch(input.type){
						case 'select':
							this.options.fields[i].CFG.type="select";
							//Dropdownliste
							rangeSelection.appendChild(inputEx.cn("div", null,{display:'inline-block',marginBottom: '5px', marginTop:"3px"}, 'range:'));
							var ul = inputEx.cn("ul", null, null, null);
							if (input.selectValues && !input.choices){
								for (var x = 0; x<input.selectValues.length; x++){
									var li = inputEx.cn("li", null, null, null);
									li.appendChild(inputEx.cn("div", {className:'rangeSelectionValue', number: i}, {display:'inline-block'},input.selectValues[x]));
									var rangeVal = inputEx.cn("input", {type: "checkbox", name:"rangeSelectionCheckbox", className:'rangeSelectionCheckbox', number: i}, null,null);
									YAHOO.util.Event.addListener(rangeVal, 'change', function (e) {
										var target = YAHOO.util.Event.getTarget(e);
										var n = target.getAttribute("number");
										var y = [];
										for (var k = 0; k < target.parentNode.parentNode.getElementsByClassName("rangeSelectionValue").length; k++){
											if(target.parentNode.parentNode.getElementsByClassName("rangeSelectionCheckbox")[k].checked){
												y[y.length]=target.parentNode.parentNode.getElementsByClassName("rangeSelectionValue")[k].innerHTML;
											}
										}
										this.options.fields[n].CFG.possibleValues = y;
									}, this, true);
									li.appendChild(rangeVal);
									ul.appendChild(li);
								}
							}
							if (input.choices && !input.selectValues){
								for (var x = 0; x<input.choices.length; x++){
									var li = inputEx.cn("li", null, null, null);
									li.appendChild(inputEx.cn("div", {className:'rangeSelectionValue', number: i}, {display:'inline-block'},input.choices[x]));
									var rangeVal = inputEx.cn("input", {type: "checkbox", name:"rangeSelectionCheckbox", className:'rangeSelectionCheckbox', number: i}, null,null);
									YAHOO.util.Event.addListener(rangeVal, 'change', function (e) {
										var target = YAHOO.util.Event.getTarget(e);
										var n = target.getAttribute("number");
										var y = [];
										for (var k = 0; k < target.parentNode.parentNode.getElementsByClassName("rangeSelectionValue").length; k++){
											if(target.parentNode.parentNode.getElementsByClassName("rangeSelectionCheckbox")[k].checked){
												y[y.length]=target.parentNode.parentNode.getElementsByClassName("rangeSelectionValue")[k].innerHTML;
											}
										}
										this.options.fields[n].CFG.possibleValues = y;
									}, this, true);
									li.appendChild(rangeVal);
									ul.appendChild(li);
								}
							}
							rangeSelection.appendChild(ul);
							var selAllWrapper = inputEx.cn("div", null, {marginTop:'3px'},'');
							selAllWrapper.appendChild(inputEx.cn("div", null, {display:'inline-block', fontStyle: 'italic', marginRight: '5px'},'select/deselect all'));
							var selAllCB = inputEx.cn("input", {type: "checkbox", className:'', number: i}, {display:'inline-block'},null);
							YAHOO.util.Event.addListener(selAllCB, 'click', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var elementsToHandle = target.parentNode.parentNode.getElementsByClassName('rangeSelectionCheckbox');
								var n = target.getAttribute("number");
								if(target.checked){
									for(var z = 0; z < elementsToHandle.length; z++){
										elementsToHandle[z].checked=true;
									}
									var y = [];
									for (var k = 0; k < target.parentNode.parentNode.getElementsByClassName("rangeSelectionValue").length; k++){
										y[y.length]=target.parentNode.parentNode.getElementsByClassName("rangeSelectionValue")[k].innerHTML;
									}
									this.options.fields[n].CFG.possibleValues = y;
								}
								else{
									for(var z = 0; z < elementsToHandle.length; z++){
										elementsToHandle[z].checked=false;
									}
									this.options.fields[n].CFG.possibleValues = [];
								}
							}, this, true);
							selAllWrapper.appendChild(selAllCB);
							rangeSelection.appendChild(selAllWrapper);
							break;
						case 'int':
							this.options.fields[i].CFG.type="int";
							rangeSelection.appendChild(inputEx.cn("div", null, {display:'inline-block'},'range from:'));
							var rangeVal = inputEx.cn("input", {type: "number", className:'rangeSelectionValue', number: i, name: 'rangeSelectionValue1'}, {width:"50px"},null);
							YAHOO.util.Event.addListener(rangeVal, 'change', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var n = target.getAttribute("number");
								var y = [];
								y[0] = target.parentNode.getElementsByClassName("rangeSelectionValue")[0].value;
								y[1] = target.parentNode.getElementsByClassName("rangeSelectionValue")[1].value;
								this.options.fields[n].CFG.possibleValues = y;
							}, this, true);
							rangeSelection.appendChild(rangeVal);
							var rangeVal2 = inputEx.cn("input", {type: "number", className:'rangeSelectionValue', number: i, name: 'rangeSelectionValue2'}, {width:"50px"},null);
							rangeSelection.appendChild(inputEx.cn("div", null, {display:'inline-block'},'to:'));
							YAHOO.util.Event.addListener(rangeVal2, 'change', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var n = target.getAttribute("number");
								var y = [];
								y[0] = target.parentNode.getElementsByClassName("rangeSelectionValue")[0].value;
								y[1] = target.parentNode.getElementsByClassName("rangeSelectionValue")[1].value;
								this.options.fields[n].CFG.possibleValues = y;
							}, this, true);
							rangeSelection.appendChild(rangeVal2);
							break;
						case 'string':
							this.options.fields[i].CFG.type="string";
							rangeSelection.appendChild(inputEx.cn("div", null, null,'range:'));
							//Liste mit moeglichen Strings
							var ulSt = inputEx.cn("ul", {className:'ulSt'}, {marginBottom:'5px'},null);
							rangeSelection.appendChild(ulSt);
							var inputSt = inputEx.cn("input", {type: "text", className:'rangeSelectionValue', number: i}, {width:"150px"},null);
							rangeSelection.appendChild(inputSt);
							var addBtn = inputEx.cn("button", {className:'addStBtn' + i, number: i}, null,'add');
							//onclick: input adden
							YAHOO.util.Event.addListener(addBtn, 'click', function (e) {
								var target = YAHOO.util.Event.getTarget(e);
								var n = target.getAttribute("number");
								var elToHandle = target.parentNode.getElementsByClassName('rangeSelectionValue')[0];
								if(elToHandle.value!=null&elToHandle.value!=''){
									var list = target.parentNode.getElementsByClassName('ulSt')[0];
									var li = inputEx.cn('li',{className:'ulStLi'},null,null);
									var valueDiv = inputEx.cn('div',{className:'ulStValue'},{display:'inline-block'},elToHandle.value);
									var deleteDiv = inputEx.cn('div',{className:'ulStDel', number: i},{display:'inline-block', cursor:'pointer', color:'blue'},'&nbsp;[x]');

									//ENTFERNEN DER EINTRAEGE
									YAHOO.util.Event.addListener(deleteDiv, 'click', function(e){
										var target2 = YAHOO.util.Event.getTarget(e);
										var n = target.getAttribute("number");
										list.removeChild(target2.parentNode);
										//mgl. Values
										var y2 = [];
										for (var g = 0; g < list.getElementsByClassName('ulStValue').length; g++){
											y2[y2.length] = list.getElementsByClassName('ulStValue')[g].innerHTML;
										}
										this.options.fields[n].CFG.possibleValues.splice(0,this.options.fields[g].CFG.possibleValues.length);
										this.options.fields[n].CFG.possibleValues = y2;
									},this,true);
									li.appendChild(valueDiv);
									li.appendChild(deleteDiv);
									list.appendChild(li);
									elToHandle.value = '';

									//mgl. Values
									var y = [];
									for (var f = 0; f < target.parentNode.getElementsByClassName('ulSt')[0].getElementsByClassName('ulStValue').length; f++){
										y[y.length] = target.parentNode.getElementsByClassName('ulSt')[0].getElementsByClassName('ulStValue')[f].innerHTML;
									}
									this.options.fields[n].CFG.possibleValues = y;
								}
							}, this, true);
							rangeSelection.appendChild(addBtn);
							break;
						case 'file':
							break;
						case 'boolean':
							this.options.fields[i].CFG.type="boolean";
							break;
						default:
							break;
					}
					divConfig.appendChild(rangeSelection);

					templateView.appendChild(divConfig);
					///////////////////////////////////////////////////////////////////////////

					//zusammensetzen..
					divWrapper.appendChild(normalView);
					templateView.appendChild(divConfig);
					if(i < (this.options.fields.length-1)){templateView.appendChild(inputEx.cn("hr", null, {color:'#dcdcdc'},null));}
					divWrapper.appendChild(templateView);
					this.fieldset.appendChild(divWrapper);
				}//continueBuild-Klammer
				else{
					//unbekannter input typ
					this.fieldset.appendChild(inputEx.cn("hr", null, {color: 'red'}, null));
					this.fieldset.appendChild(inputEx.cn("p", null, {color: 'red'}, 'Error building Field Nr: ' + (i+1)));
					this.fieldset.appendChild(inputEx.cn("p", null, {color: 'red'}, 'Unknown input type - check your filter specification...'));
					this.fieldset.appendChild(inputEx.cn("p", null, {color: 'red', fontStyle:'italic'}, 'Allowed types are: int, boolean, string, select, file (case sensitive)'));
					this.fieldset.appendChild(inputEx.cn("hr", null, {color: 'red'}, null));
				}
			}


			// Collapsed at creation ?
			if (this.options.collapsed) {
				this.toggleCollapse();
			}

			// Append the fieldset
			parentEl.appendChild(this.fieldset);
		},

		/**
		 * Instanciate one field given its parameters, type or fieldClass
		 * @param {Object} fieldOptions The field properties as required by the inputEx() method
		 */
		renderField: function (fieldOptions) {

			// Instanciate the field
			var fieldInstance = inputEx(fieldOptions, this);

			this.inputs.push(fieldInstance);

			// Create an index to access fields by their name
			if (fieldInstance.options.name) {
				this.inputsNames[fieldInstance.options.name] = fieldInstance;
			}

			// Create the this.hasInteractions to run interactions at startup
			if (!this.hasInteractions && fieldOptions.interactions) {
				this.hasInteractions = true;
			}

			// Subscribe to the field "updated" event to send the group "updated" event
			fieldInstance.updatedEvt.subscribe(this.onChange, this, true);

			return fieldInstance;
		},

		/**
		 * Add a listener for the 'collapsible' option
		 */
		initEvents: function () {
			if (this.options.collapsible) {
				Event.addListener(this.legend, "click", this.toggleCollapse, this, true);
			}
		},

		/**
		 * Toggle the collapse state
		 */
		toggleCollapse: function () {
			if (Dom.hasClass(this.fieldset, 'inputEx-Expanded')) {
				Dom.replaceClass(this.fieldset, 'inputEx-Expanded', 'inputEx-Collapsed');
			}
			else {
				Dom.replaceClass(this.fieldset, 'inputEx-Collapsed', 'inputEx-Expanded');
			}
		},

		/**
		 * Validate each field
		 * @returns {Boolean} true if all fields validate and required fields are not empty
		 */
		validate: function () {
			var response = true;

			// Validate all the sub fields
			for (var i = 0; i < this.inputs.length; i++) {
				var input = this.inputs[i];
				input.setClassFromState(); // update field classes (mark invalid fields...)
				var state = input.getState();
				if (state == inputEx.stateRequired || state == inputEx.stateInvalid) {
					response = false; // but keep looping on fields to set classes
				}
			}
			return response;
		},

		/**
		 * Alternative method to validate for advanced error handling
		 * @returns {Object} with all Forms's fields state, error message
		 * and validate containing a boolean for the global Form validation
		 */
		getFieldsStates: function () {
			var input, inputName, state, message,
				returnedObj = { fields: {}, validate: true };

			// Loop on all the sub fields
			for (var i = 0; i < this.inputs.length; i++) {

				input = this.inputs[i];
				inputName = input.options.name;
				state = input.getState();
				message = input.getStateString(state);

				returnedObj.fields[inputName] = {};
				returnedObj.fields[inputName].valid = true;
				returnedObj.fields[inputName].message = message;

				// check if subfield validates
				if (state == inputEx.stateRequired || state == inputEx.stateInvalid) {
					returnedObj.fields[inputName].valid = false;
					returnedObj.validate = false;
				}

			}

			return returnedObj;
		},

		/**
		 * Enable all fields in the group
		 */
		enable: function () {
			for (var i = 0; i < this.inputs.length; i++) {
				this.inputs[i].enable();
			}
		},

		/**
		 * Disable all fields in the group
		 */
		disable: function () {
			for (var i = 0; i < this.inputs.length; i++) {
				this.inputs[i].disable();
			}
		},

		/**
		 * Set the values of each field from a key/value hash object
		 * @param {Any} value The group value
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (oValues, sendUpdatedEvt) {
			if (!oValues) {
				return;
			}
			for (var i = 0; i < this.inputs.length; i++) {
				var field = this.inputs[i];
				var name = field.options.name;
				if (name && !lang.isUndefined(oValues[name])) {
					field.setValue(oValues[name], false); // don't fire the updated event !
				}
				else {
					field.clear(false);
				}
			}

			this.runFieldsInteractions();

			if (sendUpdatedEvt !== false) {
				// fire update event
				this.fireUpdatedEvt();
			}
		},

		/**
		 * Return an object with all the values of the fields
		 */
		getValue: function () {
			var o = {};
			for (var i = 0; i < this.inputs.length; i++) {
				var v = this.inputs[i].getValue();
				if (this.inputs[i].options.name) {
					if (this.inputs[i].options.flatten && lang.isObject(v)) {
						lang.augmentObject(o, v);
					}
					else {
						o[this.inputs[i].options.name] = v;
					}
				}
			}
			return o;
		},

		/**
		 * Modifizierten Wert zur??ckgeben
		 *
		 * Bsp. m??glicher Definitionen
		 * ,.."fields":{...
         * statt
         * "field1":"Wert",
         * folgender, hier definierter Teil:
         * "field1":{"configurable":"false", "value": "Wert"},
         * "field2":{"configurable":"free"},
         * "field3":{"configurable":"free", "value":"Wert"},
         * "field4":{"configurable":"range", "range":["Wert1","Wert2","WertN"]},
         * "field5":{"configurable":"range", "range":["Wert1","Wert2","WertN"], "value": "Wert"},
         * ...
         * }...
		 */
		getTemplateValue: function(){
			var o = {};
			if(document.getElementById('WiringEditor-expertModeButton-button').getAttribute("status")=="active"){
				for (var x = 0; x < this.options.fields.length; x++){
					this.options.fields[x].CFG.enabled;
					//Name des Feldes
					//{"valueX":...
					o[this.options.fields[x].name] = {};
					//Configdetails
					//...{"configurable":...
					if (!this.options.fields[x].CFG.enabled){
						//..."false"
						o[this.options.fields[x].name]["configurable"] = "false";
						o[this.options.fields[x].name]["value"] = this.inputs[x].getValue();
					}
					else{
						//..., , "range":...
						if (this.options.fields[x].CFG.range == true){
							o[this.options.fields[x].name]["configurable"] = "range";
							//... {1,2,3,4,...} ...
							o[this.options.fields[x].name]["range"] = this.options.fields[x].CFG.possibleValues;
						}
						//..., "free": ...
						else{
							o[this.options.fields[x].name]["configurable"] = "free";
						}

						//default?
						if (this.options.fields[x].CFG.default==true){
							//..."value": "XYZ" ...
							o[this.options.fields[x].name]["value"] = this.options.fields[x].CFG.defaultValue;//this.options.fields[x].CFG.defaultValue;
						}

					}

				}
			}
			return o;
		},


		/**
		 * Close the group (recursively calls "close" on each field, does NOT hide the group )
		 * Call this function before hidding the group to close any field popup
		 */
		close: function () {
			for (var i = 0; i < this.inputs.length; i++) {
				this.inputs[i].close();
			}
		},

		/**
		 * Set the focus to the first input in the group
		 */
		focus: function () {
			if (this.inputs.length > 0) {
				this.inputs[0].focus();
			}
		},

		/**
		 * Return the sub-field instance by its name property
		 * @param {String} fieldName The name property
		 */
		getFieldByName: function (fieldName) {
			if (!this.inputsNames.hasOwnProperty(fieldName)) {
				return null;
			}
			return this.inputsNames[fieldName];
		},


		/**
		 * Called when one of the group subfields is updated.
		 * @param {String} eventName Event name
		 * @param {Array} args Array of [fieldValue, fieldInstance]
		 */
		onChange: function (eventName, args) {

			if(document.getElementById('saveIndicator').style.display = ''){
				// alert("unsave");
				document.getElementById('saveIndicator').savedWfId = '';
			}

			// TODO uncolor

			// Run interactions
			var fieldValue = args[0];
			var fieldInstance = args[1];
			this.runInteractions(fieldInstance, fieldValue);

			//this.setClassFromState();

			this.fireUpdatedEvt();
		},

		/**
		 * Run an action (for interactions)
		 * @param {Object} action inputEx action object
		 * @param {Any} triggerValue The value that triggered the interaction
		 */
		runAction: function (action, triggerValue) {
			var field = this.getFieldByName(action.name);
			if (YAHOO.lang.isFunction(field[action.action])) {
				field[action.action].call(field);
			}
			else if (YAHOO.lang.isFunction(action.action)) {
				action.action.call(field, triggerValue);
			}
			else {
				throw new Error("action " + action.action + " is not a valid action for field " + action.name);
			}
		},

		/**
		 * Run the interactions for the given field instance
		 * @param {inputEx.Field} fieldInstance Field that just changed
		 * @param {Any} fieldValue Field value
		 */
		runInteractions: function (fieldInstance, fieldValue) {

			var index = inputEx.indexOf(fieldInstance, this.inputs);
			var fieldConfig = this.options.fields[index];
			if (YAHOO.lang.isUndefined(fieldConfig.interactions)) return;

			// Let's run the interactions !
			var interactions = fieldConfig.interactions;
			for (var i = 0; i < interactions.length; i++) {
				var interaction = interactions[i];
				if (interaction.valueTrigger === fieldValue) {
					for (var j = 0; j < interaction.actions.length; j++) {
						this.runAction(interaction.actions[j], fieldValue);
					}
				}
			}

		},

		/**
		 * Run the interactions for all fields
		 */
		runFieldsInteractions: function () {
			if (this.hasInteractions) {
				for (var i = 0; i < this.inputs.length; i++) {
					this.runInteractions(this.inputs[i], this.inputs[i].getValue());
				}
			}
		},

		/**
		 * Clear all subfields
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this clear should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		clear: function (sendUpdatedEvt) {
			for (var i = 0; i < this.inputs.length; i++) {
				this.inputs[i].clear(false);
			}
			if (sendUpdatedEvt !== false) {
				// fire update event
				this.fireUpdatedEvt();
			}
		},

		/**
		 * Write error messages for fields as specified in the hash
		 * @param {Object || Array} errors Hash object containing error messages as Strings referenced by the field name, or array [ ["fieldName", "Message"], ...]
		 */
		setErrors: function (errors) {
			var i, k;
			if (YAHOO.lang.isArray(errors)) {
				for (i = 0; i < errors.length; i++) {
					k = errors[i][0];
					value = errors[i][1];
					if (this.inputsNames[k]) {
						if (this.inputsNames[k].options.showMsg) {
							this.inputsNames[k].displayMessage(value);
							Dom.replaceClass(this.inputsNames[k].divEl, "inputEx-valid", "inputEx-invalid");
						}
					}
				}
			}
			else if (YAHOO.lang.isObject(errors)) {
				for (k in errors) {
					if (errors.hasOwnProperty(k)) {
						if (this.inputsNames[k]) {
							if (this.inputsNames[k].options.showMsg) {
								this.inputsNames[k].displayMessage(errors[k]);
								Dom.replaceClass(this.inputsNames[k].divEl, "inputEx-valid", "inputEx-invalid");
							}
						}
					}
				}
			}
		},


		/**
		 * Purge all event listeners and remove the component from the dom
		 */
		destroy: function () {

			var i, length, field;

			// Recursively destroy inputs
			for (i = 0, length = this.inputs.length; i < length; i++) {
				field = this.inputs[i];
				field.destroy();
			}

			// Destroy group itself
			inputEx.Group.superclass.destroy.call(this);

		}


	});


// Register this class as "group" type
	inputEx.registerType("group", inputEx.Group, [
		{ type: "string", label: "Name", name: "name", value: '' },
		{ type: 'string', label: 'Legend', name: 'legend'},
		{ type: 'boolean', label: 'Collapsible', name: 'collapsible', value: false},
		{ type: 'boolean', label: 'Collapsed', name: 'collapsed', value: false},
		{ type: 'list', label: 'Fields', name: 'fields', elementType: {type: 'type' } }
	], true);


})();
(function () {

	var lang = YAHOO.lang;
	/**
	 * Contains the various visualization methods
	 * @class inputEx.visus
	 * @static
	 */
	inputEx.visus = {

		/**
		 * Use the trimpath-template engine
		 * see http://code.google.com/p/trimpath/wiki/JavaScriptTemplates for syntax
		 * options = {visuType: 'trimpath', template: "String template"}
		 */
		trimpath: function (options, data) {
			if (!TrimPath) {
				alert('TrimPath is not on the page. Please load inputex/lib/trimpath-template.js');
				return null;
			}
			var tpl = TrimPath.parseTemplate(options.template);
			var ret = tpl.process(data);
			return ret;
		},

		/**
		 * Use a rendering function
		 * options = {visuType: 'func', func: function(data) { ...code here...} }
		 * @method func
		 */
		"func": function (options, data) {
			return options.func(data);
		},

		/**
		 * Use YAHOO.lang.dump
		 * options = {visuType: 'dump'}
		 */
		dump: function (options, data) {
			return lang.dump(data);
		}

	};

	/**
	 * Render 'data' using a visualization function described by 'visuOptions'
	 * @static
	 * @param {Object} visuOptions The visu parameters object with: visuType: 'myType', ...args...
	 * @param {Object} data The input data to send to the template
	 * @param {HTMLElement || String} parentEl optional Set the result as content of parentEl
	 * @return {HTMLElement || String} Either the inserted HTMLElement or the String set to parentEl.innerHTML
	 */
	inputEx.renderVisu = function (visuOptions, data, parentEl) {

		var opts = visuOptions || {};
		var visuType = opts.visuType || 'dump';

		if (!inputEx.visus.hasOwnProperty(visuType)) {
			throw new Error("inputEx: no visu for visuType: " + visuType);
		}

		var f = inputEx.visus[visuType];
		if (!lang.isFunction(f)) {
			throw new Error("inputEx: no visu for visuType: " + visuType);
		}

		var v = null;
		try {
			v = f(opts, data);
		}
		catch (ex) {
			throw new Error("inputEx: error while running visu " + visuType + " : " + ex.message);
		}

		// Get the node
		var node = null;
		if (parentEl) {
			if (lang.isString(parentEl)) {
				node = YAHOO.util.Dom.get(parentEl);
			}
			else {
				node = parentEl;
			}
		}

		// Insert it
		if (node) {
			if (YAHOO.lang.isObject(v) && v.tagName) {
				node.innerHTML = "";
				node.appendChild(v);
			}
			else {
				node.innerHTML = v;
			}
		}

		return v;
	};

})();
(function () {
	var util = YAHOO.util, lang = YAHOO.lang, Event = util.Event, Dom = util.Dom;

	/**
	 * Create a button
	 * @class inputEx.widget.Button
	 * @constructor
	 * @param {Object} options The following options are available for Button :
	 * <ul>
	 *     <li><b>id</b>: id of the created A element (default is auto-generated)</li>
	 *     <li><b>className</b>: CSS class added to the button (default is either "inputEx-Button-Link" or "inputEx-Button-Submit-Link", depending on "type")</li>
	 *     <li><b>parentEl</b>: The DOM element where we should append the button</li>
	 *     <li><b>type</b>: "link", "submit-link" or "submit"</li>
	 *     <li><b>value</b>: text displayed inside the button</li>
	 *     <li><b>disabled</b>: Disable the button after creation</li>
	 *     <li><b>onClick</b>: Custom click event handler</li>
	 * </ul>
	 */
	inputEx.widget.Button = function (options) {

		this.setOptions(options || {});

		if (!!this.options.parentEl) {
			this.render(this.options.parentEl);
		}

	};


	lang.augmentObject(inputEx.widget.Button.prototype, {

		/**
		 * set the default options
		 */
		setOptions: function (options) {

			this.options = {};
			this.options.id = lang.isString(options.id) ? options.id : Dom.generateId();
			this.options.className = options.className || "inputEx-Button";
			this.options.parentEl = lang.isString(options.parentEl) ? Dom.get(options.parentEl) : options.parentEl;

			// default type === "submit"
			this.options.type = (options.type === "link" || options.type === "submit-link") ? options.type : "submit";

			// value is the text displayed inside the button (<input type="submit" value="Submit" /> convention...)
			this.options.value = options.value;

			this.options.disabled = !!options.disabled;

			if (lang.isFunction(options.onClick)) {
				this.options.onClick = {fn: options.onClick, scope: this};

			} else if (lang.isObject(options.onClick)) {
				this.options.onClick = {fn: options.onClick.fn, scope: options.onClick.scope || this};
			}

		},

		/**
		 * render the button into the parent Element
		 * @param {DOMElement} parentEl The DOM element where the button should be rendered
		 * @return {DOMElement} The created button
		 */
		render: function (parentEl) {

			var innerSpan;

			if (this.options.type === "link" || this.options.type === "submit-link") {

				this.el = inputEx.cn('a', {className: this.options.className, id: this.options.id, href: "#"});
				Dom.addClass(this.el, this.options.type === "link" ? "inputEx-Button-Link" : "inputEx-Button-Submit-Link");

				innerSpan = inputEx.cn('span', null, null, this.options.value);

				this.el.appendChild(innerSpan);

				// default type is "submit" input
			} else {

				this.el = inputEx.cn('input', {type: "submit", value: this.options.value, className: this.options.className, id: this.options.id});
				Dom.addClass(this.el, "inputEx-Button-Submit");
			}

			parentEl.appendChild(this.el);

			if (this.options.disabled) {
				this.disable();
			}

			this.initEvents();

			return this.el;
		},

		/**
		 * attach the listeners on "click" event and create the custom events
		 */
		initEvents: function () {

			/**
			 * Click Event facade (YUI custom event)
			 * @event clickEvent
			 */
			this.clickEvent = new util.CustomEvent("click");

			/**
			 * Submit Event facade (YUI custom event)
			 * @event submitEvent
			 */
			this.submitEvent = new util.CustomEvent("submit");


			Event.addListener(this.el, "click", function (e) {

				var fireSubmitEvent;

				// stop click event, so :
				//
				//  1. buttons of 'link' or 'submit-link' type don't link to any url
				//  2. buttons of 'submit' type (<input type="submit" />) don't fire a 'submit' event
				Event.stopEvent(e);

				// button disabled : don't fire clickEvent, and stop here
				if (this.disabled) {
					fireSubmitEvent = false;

					// button enabled : fire clickEvent
				} else {
					// submit event will be fired if not prevented by clickEvent
					fireSubmitEvent = this.clickEvent.fire();
				}

				// link buttons should NOT fire a submit event
				if (this.options.type === "link") {
					fireSubmitEvent = false;
				}

				if (fireSubmitEvent) {
					this.submitEvent.fire();
				}

			}, this, true);

			// Subscribe onClick handler
			if (this.options.onClick) {
				this.clickEvent.subscribe(this.options.onClick.fn, this.options.onClick.scope, true);
			}

		},

		/**
		 * Disable the button
		 */
		disable: function () {

			this.disabled = true;

			Dom.addClass(this.el, "inputEx-Button-disabled");

			if (this.options.type === "submit") {
				this.el.disabled = true;
			}
		},

		/**
		 * Enable the button
		 */
		enable: function () {

			this.disabled = false;

			Dom.removeClass(this.el, "inputEx-Button-disabled");

			if (this.options.type === "submit") {
				this.el.disabled = false;
			}
		},


		/**
		 * Purge all event listeners and remove the component from the dom
		 */
		destroy: function () {

			// Unsubscribe all listeners to click and submit events
			this.clickEvent.unsubscribeAll();
			this.submitEvent.unsubscribeAll();

			// Purge element (remove listeners on el and childNodes recursively)
			util.Event.purgeElement(this.el, true);

			// Remove from DOM
			if (Dom.inDocument(this.el)) {
				this.el.parentNode.removeChild(this.el);
			}

		}


	});

})();
(function () {

	var lang = YAHOO.lang, Event = YAHOO.util.Event, Dom = YAHOO.util.Dom;


	inputEx.FileField = function (options) {
		inputEx.FileField.superclass.constructor.call(this, options);
	};

	lang.extend(inputEx.FileField, inputEx.Field, {

		/**
		 * Adds size and accept options
		 * @method setOptions
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.FileField.superclass.setOptions.call(this, options);
			this.options.size = options.size;
			this.options.accept = options.accept;
		},


		/**
		 * Render an 'INPUT' DOM node
		 */
		renderComponent: function () {

			// Attributes of the input field
			var attributes = {};
			attributes.id = this.divEl.id ? this.divEl.id + '-field' : ("_inputex_fileid" + (inputEx.FileField._id_count++));
			attributes.type = "file";
			attributes.multiple = "true"
			if (this.options.name) attributes.name = this.options.name;
			if (this.options.size) attributes.size = this.options.size;
			if (this.options.accept) attributes.accept = this.options.accept;

			// Create the node
			this.el = inputEx.cn('input', attributes);
			this.el.setAttribute("name", "files[]");

			// Append it to the main element
			this.fieldContainer.appendChild(this.el);
		},

		/**
		 * Register the change, focus and blur events
		 */

		/*initEvents: function() {
		 Event.addListener(this.el, "change", this.onChange, this, true);

		 if (YAHOO.env.ua.ie){ // refer to inputEx-95
		 var field = this.el;
		 new YAHOO.util.KeyListener(this.el, {keys:[13]}, {fn:function(){
		 field.blur();
		 field.focus();
		 }}).enable();
		 }

		 Event.addFocusListener(this.el, this.onFocus, this, true);
		 Event.addBlurListener(this.el, this.onBlur, this, true);
		 Event.addListener(this.el, "keypress", this.onKeyPress, this, true);
		 Event.addListener(this.el, "keyup", this.onKeyUp, this, true);
		 },*/

		/**
		 * Return the file value
		 * @param {File} The file value
		 */
		getValue: function () {
			var value;
			value = this.el.files;
			return value;
		},

		/**
		 * Function to set the value
		 * @param {String} value The new value
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {
			// + check : if Null or Undefined we put '' in the stringField
			//this.el.value = ( lang.isNull(value) || lang.isUndefined(value) ) ? '' : value;

			// call parent class method to set style and fire updatedEvt
			inputEx.FileField.superclass.setValue.call(this, value, sendUpdatedEvt);
		},

		/**
		 * Disable the field
		 */
		disable: function () {
			this.el.disabled = true;
		},

		/**
		 * Enable the field
		 */
		enable: function () {
			this.el.disabled = false;
		},

		/**
		 * Set the focus to this field
		 */
		focus: function () {
			// Can't use lang.isFunction because IE >= 6 would say focus is not a function (IE says it's an object) !!
			if (!!this.el && !lang.isUndefined(this.el.focus)) {
				this.el.focus();
			}
		},


		/**
		 * Display the type invite after setting the class
		 */
		setClassFromState: function () {
			inputEx.FileField.superclass.setClassFromState.call(this);
		},

		/**
		 * Clear the typeInvite when the field gains focus
		 */
		onFocus: function (e) {
			inputEx.FileField.superclass.onFocus.call(this, e);
		}
	});


//	Register this class as "file" type
	inputEx.registerType("file", inputEx.FileField);


})();
(function () {

	var lang = YAHOO.lang, Event = YAHOO.util.Event, Dom = YAHOO.util.Dom;

	/**
	 * Basic string field (equivalent to the input type "text")
	 * @class inputEx.StringField
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options Added options:
	 * <ul>
	 *      <li>regexp: regular expression used to validate (otherwise it always validate)</li>
	 *   <li>size: size attribute of the input</li>
	 *   <li>maxLength: maximum size of the string field (no message display, uses the maxlength html attribute)</li>
	 *   <li>minLength: minimum size of the string field (will display an error message if shorter)</li>
	 *   <li>typeInvite: string displayed when the field is empty</li>
	 *   <li>readonly: set the field as readonly</li>
	 * </ul>
	 */
	inputEx.StringField = function (options) {
		inputEx.StringField.superclass.constructor.call(this, options);

		if (this.options.typeInvite) {
			this.updateTypeInvite();
		}
	};

	lang.extend(inputEx.StringField, inputEx.Field, {
		/**
		 * Set the default values of the options
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.StringField.superclass.setOptions.call(this, options);

			this.options.regexp = options.regexp;
			this.options.size = options.size;
			this.options.maxLength = options.maxLength;
			this.options.minLength = options.minLength;
			this.options.typeInvite = options.typeInvite;
			this.options.readonly = options.readonly;
			this.options.autocomplete = lang.isUndefined(options.autocomplete) ?
				inputEx.browserAutocomplete :
				(options.autocomplete === false || options.autocomplete === "off") ? false : true;
			this.options.trim = (options.trim === true) ? true : false;
		},


		/**
		 * Render an 'INPUT' DOM node
		 */
		renderComponent: function () {

			// This element wraps the input node in a float: none div
			this.wrapEl = inputEx.cn('div', {className: 'inputEx-StringField-wrapper'});

			// Attributes of the input field
			var attributes = {};
			attributes.type = 'text';
			attributes.id = this.divEl.id ? this.divEl.id + '-field' : YAHOO.util.Dom.generateId();
			if (this.options.size) {
				attributes.size = this.options.size;
			}
			if (this.options.name) {
				attributes.name = this.options.name;
			}
			if (this.options.readonly) {
				attributes.readonly = 'readonly';
			}

			if (this.options.maxLength) {
				attributes.maxLength = this.options.maxLength;
			}
			attributes.autocomplete = this.options.autocomplete ? 'on' : 'off';

			// Create the node
			this.el = inputEx.cn('input', attributes);

			// Append it to the main element
			this.wrapEl.appendChild(this.el);
			this.fieldContainer.appendChild(this.wrapEl);
		},

		/**
		 * Register the change, focus and blur events
		 */
		initEvents: function () {
			Event.addListener(this.el, "change", this.onChange, this, true);

			if (YAHOO.env.ua.ie) { // refer to inputEx-95
				var field = this.el;
				new YAHOO.util.KeyListener(this.el, {keys: [13]}, {fn: function () {
					field.blur();
					field.focus();
				}}).enable();
			}

			Event.addFocusListener(this.el, this.onFocus, this, true);
			Event.addBlurListener(this.el, this.onBlur, this, true);
			Event.addListener(this.el, "keypress", this.onKeyPress, this, true);
			Event.addListener(this.el, "keyup", this.onKeyUp, this, true);
		},

		/**
		 * Return the string value
		 * @param {String} The string value
		 */
		getValue: function () {

			var value;

			value = (this.options.typeInvite && this.el.value == this.options.typeInvite) ? '' : this.el.value;

			if (this.options.trim) {
				value = YAHOO.lang.trim(value);
			}

			return value;
		},

		/**
		 * Function to set the value
		 * @param {String} value The new value
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {
			// + check : if Null or Undefined we put '' in the stringField
			this.el.value = ( lang.isNull(value) || lang.isUndefined(value) ) ? '' : value;

			// call parent class method to set style and fire updatedEvt
			inputEx.StringField.superclass.setValue.call(this, value, sendUpdatedEvt);
		},

		/**
		 * Uses the optional regexp to validate the field value
		 */
		validate: function () {
			var val = this.getValue();

			// empty field
			if (val === '') {
				// validate only if not required
				return !this.options.required;
			}

			// Check regex matching and minLength (both used in password field...)
			var result = true;

			// if we are using a regular expression
			if (this.options.regexp) {
				result = result && val.match(this.options.regexp);
			}
			if (this.options.minLength) {
				result = result && val.length >= this.options.minLength;
			}
			return result;
		},

		/**
		 * Disable the field
		 */
		disable: function () {
			this.el.disabled = true;
		},

		/**
		 * Enable the field
		 */
		enable: function () {
			this.el.disabled = false;
		},

		/**
		 * Set the focus to this field
		 */
		focus: function () {
			// Can't use lang.isFunction because IE >= 6 would say focus is not a function (IE says it's an object) !!
			if (!!this.el && !lang.isUndefined(this.el.focus)) {
				this.el.focus();
			}
		},

		/**
		 * Add the minLength string message handling
		 */
		getStateString: function (state) {
			if (state == inputEx.stateInvalid && this.options.minLength && this.el.value.length < this.options.minLength) {
				return inputEx.messages.stringTooShort[0] + this.options.minLength + inputEx.messages.stringTooShort[1];
			}
			return inputEx.StringField.superclass.getStateString.call(this, state);
		},

		/**
		 * Display the type invite after setting the class
		 */
		setClassFromState: function () {
			inputEx.StringField.superclass.setClassFromState.call(this);

			// display/mask typeInvite
			if (this.options.typeInvite) {
				this.updateTypeInvite();
			}
		},

		updateTypeInvite: function () {

			// field not focused
			if (!Dom.hasClass(this.divEl, "inputEx-focused")) {

				// show type invite if field is empty
				if (this.isEmpty()) {
					Dom.addClass(this.divEl, "inputEx-typeInvite");
					this.el.value = this.options.typeInvite;

					// important for setValue to work with typeInvite
				} else {
					Dom.removeClass(this.divEl, "inputEx-typeInvite");
				}

				// field focused : remove type invite
			} else {
				if (Dom.hasClass(this.divEl, "inputEx-typeInvite")) {
					// remove text
					this.el.value = "";

					// remove the "empty" state and class
					this.previousState = null;
					Dom.removeClass(this.divEl, "inputEx-typeInvite");
				}
			}
		},

		/**
		 * Clear the typeInvite when the field gains focus
		 */
		onFocus: function (e) {
			inputEx.StringField.superclass.onFocus.call(this, e);

			if (this.options.typeInvite) {
				this.updateTypeInvite();
			}
		},

		onKeyPress: function (e) {
			// override me
		},

		onKeyUp: function (e) {
			// override me
			//
			//   example :
			//
			//   lang.later(0, this, this.setClassFromState);
			//
			//     -> Set style immediatly when typing in the field
			//     -> Call setClassFromState escaping the stack (after the event has been fully treated, because the value has to be updated)
		}

	});


	inputEx.messages.stringTooShort = ["This field should contain at least ", " numbers or characters"];

// Register this class as "string" type
	inputEx.registerType("string", inputEx.StringField, [
		{ type: 'string', label: 'Type invite', name: 'typeInvite', value: ''},
		{ type: 'integer', label: 'Size', name: 'size', value: 20},
		{ type: 'integer', label: 'Min. length', name: 'minLength', value: 0}
	]);

})();

(function () {

	// shortcuts
	var lang = YAHOO.lang;


	inputEx.mixin.choice = {

		/**
		 * Add a choice
		 * @param {Object} config An object describing the choice to add (e.g. { value: 'second' [, label: 'Second' [, position: 1 || after: 'First' || before: 'Third']] })
		 */
		addChoice: function (config) {

			var choice, position, that;

			// allow config not to be an object, just a value -> convert it in a standard config object
			if (!lang.isObject(config)) {
				config = { value: config };
			}

			choice = {
				value: config.value,
				label: lang.isString(config.label) ? config.label : "" + config.value,
				visible: true
			};

			// Create DOM <option> node
			choice.node = this.createChoiceNode(choice);

			// Get choice's position
			//   -> don't pass config.value to getChoicePosition !!!
			//     (we search position of existing choice, whereas config.value is a property of new choice to be created...)
			position = this.getChoicePosition({ position: config.position, label: config.before || config.after });

			if (position === -1) { //  (default is at the end)
				position = this.choicesList.length;

			} else if (lang.isString(config.after)) {
				// +1 to insert "after" position (not "at" position)
				position += 1;
			}


			// Insert choice in list at position
			this.choicesList.splice(position, 0, choice);

			// Append <option> node in DOM
			this.appendChoiceNode(choice.node, position);

			// Select new choice
			if (!!config.selected) {

				// setTimeout for IE6 (let time to create dom option)
				that = this;
				setTimeout(function () {
					that.setValue(choice.value);
				}, 0);

			}

			// Return generated choice
			return choice;

		},

		/**
		 * Remove a choice
		 * @param {Object} config An object targeting the choice to remove (e.g. { position : 1 } || { value: 'second' } || { label: 'Second' })
		 */
		removeChoice: function (config) {

			var position, choice;

			// Get choice's position
			position = this.getChoicePosition(config);

			if (position === -1) {
				throw new Error("SelectField : invalid or missing position, label or value in removeChoice");
			}

			// Choice to remove
			choice = this.choicesList[position];

			// Clear if removing selected choice
			if (this.getValue() === choice.value) {
				this.clear();
			}

			// Remove choice in list at position
			this.choicesList.splice(position, 1); // remove 1 element at position

			// Remove node from DOM
			this.removeChoiceNode(choice.node);

		},

		/**
		 * Hide a choice
		 * @param {Object} config An object targeting the choice to hide (e.g. { position : 1 } || { value: 'second' } || { label: 'Second' })
		 */
		hideChoice: function (config) {

			var position, choice;

			position = this.getChoicePosition(config);

			if (position !== -1) {

				choice = this.choicesList[position];

				// test if visible first in case we try to hide twice or more...
				if (choice.visible) {

					choice.visible = false;

					// Clear if hiding selected choice
					if (this.getValue() === choice.value) {
						this.clear();
					}

					// Remove from DOM
					this.removeChoiceNode(choice.node);

				}

			}

		},

		/**
		 * Show a choice
		 * @param {Object} config An object targeting the choice to show (e.g. { position : 1 } || { value: 'second' } || { label: 'Second' })
		 */
		showChoice: function (config) {

			var position, choice;

			position = this.getChoicePosition(config);

			if (position !== -1) {

				choice = this.choicesList[position];

				if (!choice.visible) {

					choice.visible = true;
					this.appendChoiceNode(choice.node, position);

				}

			}

		},

		/**
		 * Disable a choice
		 * @param {Object} config An object targeting the choice to disable (e.g. { position : 1 } || { value: 'second' } || { label: 'Second' })
		 */
		disableChoice: function (config, unselect) {

			var position, choice;

			// Should we unselect choice if disabling selected choice
			if (lang.isUndefined(unselect) || !lang.isBoolean(unselect)) {
				unselect = true;
			}

			position = this.getChoicePosition(config);

			if (position !== -1) {

				choice = this.choicesList[position];

				this.disableChoiceNode(choice.node);

				// Clear if disabling selected choice
				if (unselect && this.getValue() === choice.value) {
					this.clear();
				}

			}

		},

		/**
		 * Enable a choice
		 * @param {Object} config An object targeting the choice to enable (e.g. { position : 1 } || { value: 'second' } || { label: 'Second' })
		 */
		enableChoice: function (config) {

			var position, choice;

			position = this.getChoicePosition(config);

			if (position !== -1) {

				choice = this.choicesList[position];

				this.enableChoiceNode(choice.node);

			}

		},

		/**
		 * Get the position of a choice in choicesList (NOT in the DOM)
		 * @param {Object} config An object targeting the choice (e.g. { position : 1 } || { value: 'second' } || { label: 'Second' })
		 */
		getChoicePosition: function (config) {

			var nbChoices, position = -1;

			nbChoices = this.choicesList.length;

			// Handle position
			if (lang.isNumber(config.position) && config.position >= 0 && config.position < nbChoices) {

				position = parseInt(config.position, 10);

			} else if (!lang.isUndefined(config.value)) {

				// get position of choice with value === config.value
				position = inputEx.indexOf(config.value, this.choicesList, function (value, opt) {
					return opt.value === value;
				});

			} else if (lang.isString(config.label)) {

				// get position of choice with label === config.label
				position = inputEx.indexOf(config.label, this.choicesList, function (label, opt) {
					return opt.label === label;
				});

			}

			return position;
		}

	};

}());
(function () {

	var Event = YAHOO.util.Event, lang = YAHOO.lang;

	/**
	 * Create a select field
	 * @class inputEx.SelectField
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options Added options:
	 * <ul>
	 *    <li>choices: contains the list of choices configs ([{value:'usa'}, {value:'fr', label:'France'}])</li>
	 * </ul>
	 */
	inputEx.SelectField = function (options) {
		inputEx.SelectField.superclass.constructor.call(this, options);
	};

	lang.extend(inputEx.SelectField, inputEx.Field, {

		/**
		 * Set the default values of the options
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {

			var i, length;

			inputEx.SelectField.superclass.setOptions.call(this, options);

			this.options.choices = lang.isArray(options.choices) ? options.choices : [];

			// Retro-compatibility with old pattern (changed since 2010-06-30)
			if (lang.isArray(options.selectValues)) {

				for (i = 0, length = options.selectValues.length; i < length; i += 1) {

					this.options.choices.push({
						value: options.selectValues[i],
						label: "" + ((options.selectOptions && !lang.isUndefined(options.selectOptions[i])) ? options.selectOptions[i] : options.selectValues[i])
					});

				}
			}

		},

		/**
		 * Build a select tag with options
		 */
		renderComponent: function () {

			var i, length;

			// create DOM <select> node
			this.el = inputEx.cn('select', {

				id: this.divEl.id ? this.divEl.id + '-field' : YAHOO.util.Dom.generateId(),
				name: this.options.name || ''

			});

			// list of choices (e.g. [{ label: "France", value:"fr", node:<DOM-node>, visible:true }, {...}, ...])
			this.choicesList = [];

			// add choices
			for (i = 0, length = this.options.choices.length; i < length; i += 1) {
				this.addChoice(this.options.choices[i]);
			}

			// append <select> to DOM tree
			this.fieldContainer.appendChild(this.el);
		},

		/**
		 * Register the "change" event
		 */
		initEvents: function () {
			Event.addListener(this.el, "change", this.onChange, this, true);
			Event.addFocusListener(this.el, this.onFocus, this, true);
			Event.addBlurListener(this.el, this.onBlur, this, true);
		},

		/**
		 * Set the value
		 * @param {String} value The value to set
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {

			var i, length, choice, firstIndexAvailable, choiceFound = false;

			for (i = 0, length = this.choicesList.length; i < length; i += 1) {

				if (this.choicesList[i].visible) {

					choice = this.choicesList[i];

					if (value === choice.value) {

						choice.node.selected = "selected";
						choiceFound = true;
						break; // choice node already found

					} else if (lang.isUndefined(firstIndexAvailable)) {

						firstIndexAvailable = i;
					}

				}

			}

			// select value from first choice available when
			// value not matching any visible choice
			//
			// if no choice available (-> firstIndexAvailable is undefined), skip value setting
			if (!choiceFound && !lang.isUndefined(firstIndexAvailable)) {

				choice = this.choicesList[firstIndexAvailable];
				choice.node.selected = "selected";
				value = choice.value;

			}

			// Call Field.setValue to set class and fire updated event
			inputEx.SelectField.superclass.setValue.call(this, value, sendUpdatedEvt);
		},

		/**
		 * Return the value
		 * @return {Any} the selected value
		 */
		getValue: function () {

			var choiceIndex;

			if (this.el.selectedIndex >= 0) {

				choiceIndex = inputEx.indexOf(this.el.childNodes[this.el.selectedIndex], this.choicesList, function (node, choice) {
					return node === choice.node;
				});

				return this.choicesList[choiceIndex].value;

			} else {

				return "";

			}
		},

		/**
		 * Disable the field
		 */
		disable: function () {
			this.el.disabled = true;
		},

		/**
		 * Enable the field
		 */
		enable: function () {
			this.el.disabled = false;
		},

		createChoiceNode: function (choice) {

			return inputEx.cn('option', {value: choice.value}, null, choice.label);

		},

		removeChoiceNode: function (node) {

			// remove from selector
			//
			//   -> style.display = 'none' would work only on FF (when node is an <option>)
			//   -> other browsers (IE, Chrome...) require to remove <option> node from DOM
			//
			this.el.removeChild(node);

		},

		disableChoiceNode: function (node) {

			node.disabled = "disabled";

		},

		enableChoiceNode: function (node) {

			node.removeAttribute("disabled");

		},

		/**
		 * Attach an <option> node to the <select> at the specified position
		 * @param {HTMLElement} node The <option> node to attach to the <select>
		 * @param {Int} position The position of the choice in choicesList (may not be the "real" position in DOM)
		 */
		appendChoiceNode: function (node, position) {

			var domPosition, i;

			// Compute real DOM position (since previous choices in choicesList may be hidden)
			domPosition = 0;

			for (i = 0; i < position; i += 1) {

				if (this.choicesList[i].visible) {

					domPosition += 1;

				}

			}

			// Insert in DOM
			if (domPosition < this.el.childNodes.length) {

				YAHOO.util.Dom.insertBefore(node, this.el.childNodes[domPosition]);

			} else {

				this.el.appendChild(node);

			}
		}

	});

	// Augment prototype with choice mixin (functions : addChoice, removeChoice, etc.)
	lang.augmentObject(inputEx.SelectField.prototype, inputEx.mixin.choice);


	// Register this class as "select" type
	inputEx.registerType("select", inputEx.SelectField, [
		{
			type: 'list',
			name: 'choices',
			label: 'Choices',
			elementType: {
				type: 'group',
				fields: [
					{ label: 'Value', name: 'value', value: '' }, // not required to allow '' value (which is default)
					{ label: 'Label', name: 'label' } // optional : if left empty, label is same as value
				]
			},
			value: [],
			required: true
		}
	]);

}());
(function () {

	/**
	 * Field that adds the email regexp for validation. Result is always lower case.
	 * @class inputEx.EmailField
	 * @extends inputEx.StringField
	 * @constructor
	 * @param {Object} options inputEx.Field options object
	 */
	inputEx.EmailField = function (options) {
		inputEx.EmailField.superclass.constructor.call(this, options);
	};
	YAHOO.lang.extend(inputEx.EmailField, inputEx.StringField, {

		/**
		 * Set the email regexp and invalid message
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.EmailField.superclass.setOptions.call(this, options);

			// Overwrite options
			this.options.messages.invalid = inputEx.messages.invalidEmail;
			this.options.regexp = inputEx.regexps.email;

			// Validate the domain name ( false by default )
			this.options.fixdomain = (YAHOO.lang.isUndefined(options.fixdomain) ? false : !!options.fixdomain);
		},

		validateDomain: function () {

			var i, j, val, domain, domainList, domainListLength, groupDomain, groupDomainLength;

			val = this.getValue();
			domain = val.split('@')[1];

			// List of bad emails (only the first one in each array is the valid one)
			domainList = [

				// gmail.com
				["gmail.com", "gmail.com.br", "_gmail.com", "g-mail.com", "g.mail.com", "g_mail.com", "gamail.com", "gamil.com", "gemail.com", "ggmail.com", "gimail.com", "gmai.com", "gmail.cim", "gmail.co", "gmaill.com", "gmain.com", "gmaio.com", "gmal.com", "gmali.com", "gmeil.com", "gmial.com", "gmil.com", "gtmail.com", "igmail.com", "gmail.fr"],

				// hotmail.co.uk
				["hotmail.co.uk", "hotmail.com.uk"],

				// hotmail.com
				["hotmail.com", "hotmail.com.br", "hotmail.br", "0hotmail.com", "8hotmail.com", "_hotmail.com", "ahotmail.com", "ghotmail.com", "gotmail.com", "hatmail.com", "hhotmail.com", "ho0tmail.com", "hogmail.com", "hoimail.com", "hoitmail.com", "homail.com", "homtail.com", "hootmail.com", "hopmail.com", "hoptmail.com", "hormail.com", "hot.mail.com", "hot_mail.com", "hotail.com", "hotamail.com", "hotamil.com", "hotemail.com", "hotimail.com", "hotlmail.com", "hotmaail.com", "hotmael.com", "hotmai.com", "hotmaial.com", "hotmaiil.com", "hotmail.acom", "hotmail.bom", "hotmail.ccom", "hotmail.cm", "hotmail.co", "hotmail.coml", "hotmail.comm", "hotmail.con", "hotmail.coom", "hotmail.copm", "hotmail.cpm", "hotmail.lcom", "hotmail.ocm", "hotmail.om", "hotmail.xom", "hotmail2.com", "hotmail_.com", "hotmailc.com", "hotmaill.com", "hotmailo.com", "hotmaio.com", "hotmaiol.com", "hotmais.com", "hotmal.com", "hotmall.com", "hotmamil.com", "hotmaol.com", "hotmayl.com", "hotmeil.com", "hotmial.com", "hotmil.com", "hotmmail.com", "hotmnail.com", "hotmsil.com", "hotnail.com", "hotomail.com", "hottmail.com", "hotymail.com", "hoymail.com", "hptmail.com", "htmail.com", "htomail.com", "ohotmail.com", "otmail.com", "rotmail.com", "shotmail.com", "hotmain.com"],

				// hotmail.fr
				["hotmail.fr", "hotmail.ffr", "hotmail.frr", "hotmail.fr.br", "hotmail.br", "0hotmail.fr", "8hotmail.fr", "_hotmail.fr", "ahotmail.fr", "ghotmail.fr", "gotmail.fr", "hatmail.fr", "hhotmail.fr", "ho0tmail.fr", "hogmail.fr", "hoimail.fr", "hoitmail.fr", "homail.fr", "homtail.fr", "hootmail.fr", "hopmail.fr", "hoptmail.fr", "hormail.fr", "hot.mail.fr", "hot_mail.fr", "hotail.fr", "hotamail.fr", "hotamil.fr", "hotemail.fr", "hotimail.fr", "hotlmail.fr", "hotmaail.fr", "hotmael.fr", "hotmai.fr", "hotmaial.fr", "hotmaiil.fr", "hotmail.frl", "hotmail.frm", "hotmail2.fr", "hotmail_.fr", "hotmailc.fr", "hotmaill.fr", "hotmailo.fr", "hotmaio.fr", "hotmaiol.fr", "hotmais.fr", "hotmal.fr", "hotmall.fr", "hotmamil.fr", "hotmaol.fr", "hotmayl.fr", "hotmeil.fr", "hotmial.fr", "hotmil.fr", "hotmmail.fr", "hotmnail.fr", "hotmsil.fr", "hotnail.fr", "hotomail.fr", "hottmail.fr", "hotymail.fr", "hoymail.fr", "hptmail.fr", "htmail.fr", "htomail.fr", "ohotmail.fr", "otmail.fr", "rotmail.fr", "shotmail.fr", "hotmain.fr"],

				// yahoo.co.in
				["yahoo.co.in", "yaho.co.in", "yahoo.co.cn", "yahoo.co.n", "yahoo.co.on", "yahoo.coin", "yahoo.com.in", "yahoo.cos.in", "yahoo.oc.in", "yaoo.co.in", "yhoo.co.in"],

				// yahoo.com.br
				["yahoo.com.br", "1yahoo.com.br", "5yahoo.com.br", "_yahoo.com.br", "ayhoo.com.br", "tahoo.com.br", "uahoo.com.br", "yagoo.com.br", "yahho.com.br", "yaho.com.br", "yahoo.cm.br", "yahoo.co.br", "yahoo.com.ar", "yahoo.com.b", "yahoo.com.be", "yahoo.com.ber", "yahoo.com.bl", "yahoo.com.brr", "yahoo.com.brv", "yahoo.com.bt", "yahoo.com.nr", "yahoo.coml.br", "yahoo.con.br", "yahoo.om.br", "yahool.com.br", "yahooo.com.br", "yahoou.com.br", "yaoo.com.br", "yaroo.com.br", "yhaoo.com.br", "yhoo.com.br", "yuhoo.com.br"],

				// yahoo.com
				["yahoo.com", "yahoomail.com", "_yahoo.com", "ahoo.com", "ayhoo.com", "eyahoo.com", "hahoo.com", "sahoo.com", "yahho.com", "yaho.com", "yahol.com", "yahoo.co", "yahoo.con", "yahoo.vom", "yahoo0.com", "yahoo1.com", "yahool.com", "yahooo.com", "yahoou.com", "yahoow.com", "yahopo.com", "yaloo.com", "yaoo.com", "yaroo.com", "yayoo.com", "yhaoo.com", "yhoo.com", "yohoo.com"],

				// yahoo.fr
				["yahoo.fr", "yahoomail.fr", "_yahoo.fr", "ahoo.fr", "ayhoo.fr", "eyahoo.fr", "hahoo.fr", "sahoo.fr", "yahho.fr", "yaho.fr", "yahol.fr", "yahoo.co", "yahoo.con", "yahoo.vom", "yahoo0.fr", "yahoo1.fr", "yahool.fr", "yahooo.fr", "yahoou.fr", "yahoow.fr", "yahopo.fr", "yaloo.fr", "yaoo.fr", "yaroo.fr", "yayoo.fr", "yhaoo.fr", "yhoo.fr", "yohoo.fr"],

				// wanadoo.fr
				["wanadoo.fr", "wanadoo.frr", "wanadoo.ffr", "wanado.fr", "wanadou.fr", "wanadop.fr", "wandoo.fr", "wanaoo.fr", "wannadoo.fr", "wanadoo.com", "wananadoo.fr", "wanadoo.fe", "wanaddo.fr", "wanadoo.orange", "waqnadoo.fr", "wandaoo.fr", "wannado.fr"],

				// msn.com
				["msn.com", "mns.com", "msn.co"],

				// aol.com
				["aol.com", "aoel.com", "aol.co"]
			];

			// Loop 1
			for (i = 0, domainListLength = domainList.length; i < domainListLength; i++) {
				groupDomain = domainList[i];

				// Loop 2
				for (j = 0, groupDomainLength = groupDomain.length; j < groupDomainLength; j++) {

					// First domain of array
					if (groupDomain.indexOf(domain) === 0) {

						// If domain matches the first value of the array it means its valid
						if (domain === groupDomain[j]) {
							return true;
						}
					}
					else if (domain === groupDomain[j]) {
						var linkId = YAHOO.util.Dom.generateId();
						var that = this;

						// Add a listener to the link to allow the user to replace his bad email by clicking the link
						YAHOO.util.Event.addListener(linkId, 'click', function (e) {
							YAHOO.util.Event.stopEvent(e);
							var reg = new RegExp(domain, "i");
							var fixedVal = val.replace(reg, groupDomain[0]);
							that.setValue(fixedVal);
						});

						// Display the message with the link
						this.options.messages.invalid = inputEx.messages.didYouMeant + "<a href='' id='" + linkId + "' style='color:blue;'>@" + groupDomain[0] + " ?</a>";

						// field isnt valid
						return false;
					}
				}
			}

			// field is valid
			return true;
		},

		validate: function () {
			var result = inputEx.EmailField.superclass.validate.call(this);

			// If we want the domain validation
			if (!!this.options.fixdomain) {
				this.options.messages.invalid = inputEx.messages.invalidEmail;
				return result && this.validateDomain();
			} else {
				return result;
			}
		},

		/**
		 * Set the value to lower case since email have no case
		 * @return {String} The email string
		 */
		getValue: function () {

			var value;

			value = inputEx.EmailField.superclass.getValue.call(this);

			return inputEx.removeAccents(value.toLowerCase());
		}

	});

// Specific message for the email field
	inputEx.messages.invalidEmail = "Invalid email, ex: sample@test.com";

	inputEx.messages.didYouMeant = "Did you mean : ";

// Register this class as "email" type
	inputEx.registerType("email", inputEx.EmailField, []);

})();
(function () {

	var lang = YAHOO.lang;

	/**
	 * Adds an url regexp, and display the favicon at this url
	 * @class inputEx.UrlField
	 * @extends inputEx.StringField
	 * @constructor
	 * @param {Object} options inputEx.Field options object
	 * <ul>
	 *   <li>favicon: boolean whether the domain favicon.ico should be displayed or not (default is true, except for https)</li>
	 * </ul>
	 */
	inputEx.UrlField = function (options) {
		inputEx.UrlField.superclass.constructor.call(this, options);
	};

	lang.extend(inputEx.UrlField, inputEx.StringField, {

		/**
		 * Adds the invalid Url message
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.UrlField.superclass.setOptions.call(this, options);

			this.options.className = options.className ? options.className : "inputEx-Field inputEx-UrlField";
			this.options.messages.invalid = inputEx.messages.invalidUrl;
			this.options.favicon = lang.isUndefined(options.favicon) ? (("https:" == document.location.protocol) ? false : true) : options.favicon;
			this.options.size = options.size || 50;

			// validate with url regexp
			this.options.regexp = inputEx.regexps.url;
		},

		/**
		 * Adds a img tag before the field to display the favicon
		 */
		render: function () {
			inputEx.UrlField.superclass.render.call(this);
			this.el.size = this.options.size;

			if (!this.options.favicon) {
				YAHOO.util.Dom.addClass(this.el, 'nofavicon');
			}

			// Create the favicon image tag
			if (this.options.favicon) {
				this.favicon = inputEx.cn('img', {src: inputEx.spacerUrl});
				this.fieldContainer.insertBefore(this.favicon, this.fieldContainer.childNodes[0]);

				// focus field when clicking on favicon
				YAHOO.util.Event.addListener(this.favicon, "click", function () {
					this.focus();
				}, this, true);
			}
		},

		setClassFromState: function () {
			inputEx.UrlField.superclass.setClassFromState.call(this);

			if (this.options.favicon) {
				// try to update with url only if valid url (else pass null to display inputEx.spacerUrl)
				this.updateFavicon((this.previousState == inputEx.stateValid) ? this.getValue() : null);
			}
		},


		updateFavicon: function (url) {
			var newSrc = url ? url.match(/https?:\/\/[^\/]*/) + '/favicon.ico' : inputEx.spacerUrl;
			if (newSrc != this.favicon.src) {

				// Hide the favicon
				inputEx.sn(this.favicon, null, {visibility: 'hidden'});

				// Change the src
				this.favicon.src = newSrc;

				// Set the timer to launch displayFavicon in 1s
				if (this.timer) {
					clearTimeout(this.timer);
				}
				var that = this;
				this.timer = setTimeout(function () {
					that.displayFavicon();
				}, 1000);
			}
		},

		/**
		 * Display the favicon if the icon was found (use of the naturalWidth property)
		 */
		displayFavicon: function () {
			inputEx.sn(this.favicon, null, {visibility: (this.favicon.naturalWidth != 0) ? 'visible' : 'hidden'});
		}


	});

	inputEx.messages.invalidUrl = "Invalid URL, ex: http://www.test.com";


// Register this class as "url" type
	inputEx.registerType("url", inputEx.UrlField, [
		{ type: 'boolean', label: 'Display favicon', name: 'favicon', value: true}
	]);

})();
(function () {

	var lang = YAHOO.lang, Event = YAHOO.util.Event, Dom = YAHOO.util.Dom;

	/**
	 * Meta field to create a list of other fields
	 * @class inputEx.ListField
	 * @extends inputEx.Field
	 * @constructor
	 * @param options Added options:
	 * <ul>
	 *   <li>sortable: Add arrows to sort the items if true (default false)</li>
	 *   <li>elementType: an element type definition (default is {type: 'string'})</li>
	 *   <li>useButtons: use buttons instead of links (default false)</li>
	 *   <li>unique: require values to be unique (default false)</li>
	 *   <li>listAddLabel: if useButtons is false, text to add an item</li>
	 *   <li>listRemoveLabel: if useButtons is false, text to remove an item</li>
	 *   <li>maxItems: maximum number of items (leave undefined if no maximum, default)</li>
	 *   <li>minItems: minimum number of items to validate (leave undefined if no minimum, default)</li>
	 * </ul>
	 */
	inputEx.ListField = function (options) {

		/**
		 * List of all the subField instances
		 */
		this.subFields = [];

		inputEx.ListField.superclass.constructor.call(this, options);
	};
	lang.extend(inputEx.ListField, inputEx.Field, {

		/**
		 * Set the ListField classname
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.ListField.superclass.setOptions.call(this, options);

			this.options.className = options.className ? options.className : 'inputEx-Field inputEx-ListField';

			this.options.sortable = lang.isUndefined(options.sortable) ? false : options.sortable;
			this.options.elementType = options.elementType || {type: 'string'};
			this.options.useButtons = lang.isUndefined(options.useButtons) ? false : options.useButtons;
			this.options.unique = lang.isUndefined(options.unique) ? false : options.unique;

			this.options.listAddLabel = options.listAddLabel || inputEx.messages.listAddLink;
			this.options.listRemoveLabel = options.listRemoveLabel || inputEx.messages.listRemoveLink;

			this.options.maxItems = options.maxItems;
			this.options.minItems = options.minItems;
		},

		/**
		 * Render the addButton
		 */
		renderComponent: function () {

			// Add element button
			if (this.options.useButtons) {
				this.addButton = inputEx.cn('img', {src: inputEx.spacerUrl, className: 'inputEx-ListField-addButton'});
				this.fieldContainer.appendChild(this.addButton);
			}

			// List label
			this.fieldContainer.appendChild(inputEx.cn('span', null, {marginLeft: "4px"}, this.options.listLabel));

			// Div element to contain the children
			this.childContainer = inputEx.cn('div', {className: 'inputEx-ListField-childContainer'});
			this.fieldContainer.appendChild(this.childContainer);

			// Add link
			if (!this.options.useButtons) {
				this.addButton = inputEx.cn('a', {className: 'inputEx-List-link'}, null, this.options.listAddLabel);
				this.fieldContainer.appendChild(this.addButton);
			}
		},

		/**
		 * Handle the click event on the add button
		 */
		initEvents: function () {
			Event.addListener(this.addButton, 'click', this.onAddButton, this, true);
		},

		/**
		 * Validate each field
		 * @returns {Boolean} true if all fields validate, required fields are not empty and unique constraint (if specified) is not violated
		 */
		validate: function () {

			var response = true;

			var uniques = {}; // Hash for unique values option
			var l = this.subFields.length;

			// Validate maxItems / minItems
			if (lang.isNumber(this.options.minItems) && l < this.options.minItems) {
				response = false;
			}
			if (lang.isNumber(this.options.maxItems) && l > this.options.maxItems) {
				response = false;
			}

			// Validate all the sub fields
			for (var i = 0; i < l && response; i++) {
				var input = this.subFields[i];
				input.setClassFromState(); // update field classes (mark invalid fields...)
				var state = input.getState();
				if (state == inputEx.stateRequired || state == inputEx.stateInvalid) {
					response = false; // but keep looping on fields to set classes
				}
				if (this.options.unique) {
					var hash = lang.dump(input.getValue());
					if (uniques[hash]) {
						response = false;    // not unique
					} else {
						uniques[hash] = true;
					}
				}
			}
			return response;
		},

		/**
		 * Set the value of all the subfields
		 * @param {Array} value The list of values to set
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {

			if (!lang.isArray(value)) {
				throw new Error("inputEx.ListField.setValue expected an array, got " + (typeof value));
			}

			// Set the values (and add the lines if necessary)
			for (var i = 0; i < value.length; i++) {
				if (i == this.subFields.length) {
					this.addElement(value[i]);
				}
				else {
					this.subFields[i].setValue(value[i], false);
				}
			}

			// Remove additional subFields
			var additionalElements = this.subFields.length - value.length;
			if (additionalElements > 0) {
				for (i = 0; i < additionalElements; i++) {
					this.removeElement(value.length);
				}
			}

			inputEx.ListField.superclass.setValue.call(this, value, sendUpdatedEvt);
		},

		/**
		 * Return the array of values
		 * @return {Array} The array
		 */
		getValue: function () {
			var values = [];
			for (var i = 0; i < this.subFields.length; i++) {
				values[i] = this.subFields[i].getValue();
			}
			return values;
		},

		/**
		 * Adds an element
		 * @param {Any} The initial value of the subfield to create
		 * @return {inputEx.Field} SubField added instance
		 */
		addElement: function (value) {

			// Render the subField
			var subFieldEl = this.renderSubField(value);

			// Adds it to the local list
			this.subFields.push(subFieldEl);

			return subFieldEl;
		},

		/**
		 * Add a new element to the list and fire updated event
		 * @param {Event} e The original click event
		 */
		onAddButton: function (e) {
			Event.stopEvent(e);

			// Prevent adding a new field if already at maxItems
			if (lang.isNumber(this.options.maxItems) && this.subFields.length >= this.options.maxItems) {
				return;
			}

			// Add a field with no value:
			var subFieldEl = this.addElement();

			// Focus on this field
			subFieldEl.focus();

			// Fire updated !
			this.fireUpdatedEvt();
		},

		/**
		 * Adds a new line to the List Field
		 * @param {Any} The initial value of the subfield to create
		 * @return  {inputEx.Field} instance of the created field (inputEx.Field or derivative)
		 */
		renderSubField: function (value) {

			// Div that wraps the deleteButton + the subField
			var newDiv = inputEx.cn('div'), delButton;

			// Delete button
			if (this.options.useButtons) {
				delButton = inputEx.cn('img', {src: inputEx.spacerUrl, className: 'inputEx-ListField-delButton'});
				Event.addListener(delButton, 'click', this.onDelete, this, true);
				newDiv.appendChild(delButton);
			}

			// Instantiate the new subField
			var opts = lang.merge({}, this.options.elementType);

			// Retro-compatibility with deprecated inputParams Object : TODO -> remove
			if (lang.isObject(opts.inputParams) && !lang.isUndefined(value)) {
				opts.inputParams.value = value;

				// New prefered way to set options of a field
			} else if (!lang.isUndefined(value)) {
				opts.value = value;
			}

			var el = inputEx(opts, this);

			var subFieldEl = el.getEl();
			Dom.setStyle(subFieldEl, 'margin-left', '4px');
			Dom.setStyle(subFieldEl, 'float', 'left');
			newDiv.appendChild(subFieldEl);

			// Subscribe the onChange event to resend it
			el.updatedEvt.subscribe(this.onChange, this, true);

			// Arrows to order:
			if (this.options.sortable) {
				var arrowUp = inputEx.cn('div', {className: 'inputEx-ListField-Arrow inputEx-ListField-ArrowUp'});
				Event.addListener(arrowUp, 'click', this.onArrowUp, this, true);
				var arrowDown = inputEx.cn('div', {className: 'inputEx-ListField-Arrow inputEx-ListField-ArrowDown'});
				Event.addListener(arrowDown, 'click', this.onArrowDown, this, true);
				newDiv.appendChild(arrowUp);
				newDiv.appendChild(arrowDown);
			}

			// Delete link
			if (!this.options.useButtons) {
				delButton = inputEx.cn('a', {className: 'inputEx-List-link'}, null, this.options.listRemoveLabel);
				Event.addListener(delButton, 'click', this.onDelete, this, true);
				newDiv.appendChild(delButton);
			}

			// Line breaker
			newDiv.appendChild(inputEx.cn('div', null, {clear: "both"}));

			this.childContainer.appendChild(newDiv);

			return el;
		},

		/**
		 * Switch a subField with its previous one
		 * Called when the user clicked on the up arrow of a sortable list
		 * @param {Event} e Original click event
		 */
		onArrowUp: function (e) {
			var childElement = Event.getTarget(e).parentNode;

			var previousChildNode = null;
			var nodeIndex = -1;
			for (var i = 1; i < childElement.parentNode.childNodes.length; i++) {
				var el = childElement.parentNode.childNodes[i];
				if (el == childElement) {
					previousChildNode = childElement.parentNode.childNodes[i - 1];
					nodeIndex = i;
					break;
				}
			}

			if (previousChildNode) {
				// Remove the line
				var removedEl = this.childContainer.removeChild(childElement);

				// Adds it before the previousChildNode
				var insertedEl = this.childContainer.insertBefore(removedEl, previousChildNode);

				// Swap this.subFields elements (i,i-1)
				var temp = this.subFields[nodeIndex];
				this.subFields[nodeIndex] = this.subFields[nodeIndex - 1];
				this.subFields[nodeIndex - 1] = temp;

				// Color Animation
				if (this.arrowAnim) {
					this.arrowAnim.stop(true);
				}
				this.arrowAnim = new YAHOO.util.ColorAnim(insertedEl, {backgroundColor: { from: '#eeee33', to: '#eeeeee' }}, 0.4);
				this.arrowAnim.onComplete.subscribe(function () {
					Dom.setStyle(insertedEl, 'background-color', '');
				});
				this.arrowAnim.animate();

				// Fire updated !
				this.fireUpdatedEvt();
			}
		},

		/**
		 * Switch a subField with its next one
		 * Called when the user clicked on the down arrow of a sortable list
		 * @param {Event} e Original click event
		 */
		onArrowDown: function (e) {
			var childElement = Event.getTarget(e).parentNode;

			var nodeIndex = -1;
			var nextChildNode = null;
			for (var i = 0; i < childElement.parentNode.childNodes.length; i++) {
				var el = childElement.parentNode.childNodes[i];
				if (el == childElement) {
					nextChildNode = childElement.parentNode.childNodes[i + 1];
					nodeIndex = i;
					break;
				}
			}

			if (nextChildNode) {
				// Remove the line
				var removedEl = this.childContainer.removeChild(childElement);
				// Adds it after the nextChildNode
				var insertedEl = Dom.insertAfter(removedEl, nextChildNode);

				// Swap this.subFields elements (i,i+1)
				var temp = this.subFields[nodeIndex];
				this.subFields[nodeIndex] = this.subFields[nodeIndex + 1];
				this.subFields[nodeIndex + 1] = temp;

				// Color Animation
				if (this.arrowAnim) {
					this.arrowAnim.stop(true);
				}
				this.arrowAnim = new YAHOO.util.ColorAnim(insertedEl, {backgroundColor: { from: '#eeee33', to: '#eeeeee' }}, 1);
				this.arrowAnim.onComplete.subscribe(function () {
					Dom.setStyle(insertedEl, 'background-color', '');
				});
				this.arrowAnim.animate();

				// Fire updated !
				this.fireUpdatedEvt();
			}
		},

		/**
		 * Called when the user clicked on a delete button.
		 * @param {Event} e The original click event
		 */
		onDelete: function (e) {

			Event.stopEvent(e);

			// Prevent removing a field if already at minItems
			if (lang.isNumber(this.options.minItems) && this.subFields.length <= this.options.minItems) {
				return;
			}

			// Get the wrapping div element
			var elementDiv = Event.getTarget(e).parentNode;

			// Get the index of the subField
			var index = -1;

			var subFieldEl = elementDiv.childNodes[this.options.useButtons ? 1 : 0];
			for (var i = 0; i < this.subFields.length; i++) {
				if (this.subFields[i].getEl() == subFieldEl) {
					index = i;
					break;
				}
			}

			// Remove it
			if (index != -1) {
				this.removeElement(index);
			}

			// Fire the updated event
			this.fireUpdatedEvt();
		},

		/**
		 * Remove the line from the dom and the subField from the list.
		 * @param {integer} index The index of the element to remove
		 */
		removeElement: function (index) {
			var elementDiv = this.subFields[index].getEl().parentNode;

			this.subFields[index] = undefined;
			this.subFields = inputEx.compactArray(this.subFields);

			// Remove the element
			elementDiv.parentNode.removeChild(elementDiv);
		}

	});

// Register this class as "list" type
	inputEx.registerType("list", inputEx.ListField, [
		{ type: 'string', label: 'List label', name: 'listLabel', value: ''},
		{ type: 'type', label: 'List element type', required: true, name: 'elementType' }
	]);


	inputEx.messages.listAddLink = "Add";
	inputEx.messages.listRemoveLink = "remove";

})();
(function () {

	var lang = YAHOO.lang, Event = YAHOO.util.Event, Dom = YAHOO.util.Dom;

	/**
	 * Create a checkbox.
	 * @class inputEx.CheckBox
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options Added options for CheckBoxes:
	 * <ul>
	 *   <li>sentValues: 2D vector of values for checked/unchecked states (default is [true, false])</li>
	 * </ul>
	 */
	inputEx.CheckBox = function (options) {
		inputEx.CheckBox.superclass.constructor.call(this, options);
	};

	lang.extend(inputEx.CheckBox, inputEx.Field, {

		/**
		 * Adds the CheckBox specific options
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.CheckBox.superclass.setOptions.call(this, options);

			// Overwrite options:
			this.options.className = options.className ? options.className : 'inputEx-Field inputEx-CheckBox';

			this.options.rightLabel = options.rightLabel || '';

			// Added options
			this.sentValues = options.sentValues || [true, false];
			this.options.sentValues = this.sentValues; // for compatibility
			this.checkedValue = this.sentValues[0];
			this.uncheckedValue = this.sentValues[1];
		},

		/**
		 * Render the checkbox and the hidden field
		 */
		renderComponent: function () {

			var checkBoxId = this.divEl.id ? this.divEl.id + '-field' : YAHOO.util.Dom.generateId();
			this.el = inputEx.cn('input', { id: checkBoxId, type: 'checkbox' });

			this.fieldContainer.appendChild(this.el);

			this.rightLabelEl = inputEx.cn('label', {"for": checkBoxId, className: 'inputEx-CheckBox-rightLabel'}, null, this.options.rightLabel);
			this.fieldContainer.appendChild(this.rightLabelEl);

			// Keep state of checkbox in a hidden field (format : this.checkedValue or this.uncheckedValue)
			// This is useful for non-javascript form submit (it allows custom checked/unchecked values to be submitted)
			this.hiddenEl = inputEx.cn('input', {type: 'hidden', name: this.options.name || '', value: this.uncheckedValue});
			this.fieldContainer.appendChild(this.hiddenEl);
		},

		/**
		 * Clear the previous events and listen for the "change" event
		 */
		initEvents: function () {

			// Awful Hack to work in IE6 and below (the checkbox doesn't fire the change event)
			// It seems IE 8 removed this behavior from IE7 so it only works with IE 7 ??
			/*if( YAHOO.env.ua.ie && parseInt(YAHOO.env.ua.ie,10) != 7 ) {
			 Event.addListener(this.el, "click", function() { this.fireUpdatedEvt(); }, this, true);
			 }*/
			if (YAHOO.env.ua.ie) {
				Event.addListener(this.el, "click", function (e) {
					YAHOO.lang.later(10, this, function () {
						this.onChange(e);
					});
				}, this, true);
			} else {
				Event.addListener(this.el, "change", this.onChange, this, true);
			}

			Event.addFocusListener(this.el, this.onFocus, this, true);
			Event.addBlurListener(this.el, this.onBlur, this, true);
		},

		/**
		 * Function called when the checkbox is toggled
		 * @param {Event} e The original 'change' event
		 */
		onChange: function (e) {
			this.hiddenEl.value = this.el.checked ? this.checkedValue : this.uncheckedValue;

			inputEx.CheckBox.superclass.onChange.call(this, e);
		},

		/**
		 * Get the state value
		 * @return {Any} one of [checkedValue,uncheckedValue]
		 */
		getValue: function () {
			return this.el.checked ? this.checkedValue : this.uncheckedValue;
		},

		/**
		 * Set the value of the checkedbox
		 * @param {Any} value The value schould be one of [checkedValue,uncheckedValue]
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {
			if (value === this.checkedValue || (typeof(value) == 'string' && typeof(this.checkedValue) == 'boolean' &&
				value === String(this.checkedValue))) {
				this.hiddenEl.value = this.checkedValue;

				// check checkbox (all browsers)
				this.el.checked = true;

				// hacks for IE6, because input is not operational at init,
				// so "this.el.checked = true" would work for default values !
				// (but still work for later setValue calls)
				if (YAHOO.env.ua.ie === 6) {
					this.el.setAttribute("defaultChecked", "checked"); // for IE6
				}
			}
			else {
				// DEBUG :
				/*if (value!==this.uncheckedValue && lang.isObject(console) && lang.isFunction(console.log) ) {
				 console.log("inputEx.CheckBox: value is *"+value+"*, schould be in ["+this.checkedValue+","+this.uncheckedValue+"]");
				 }*/
				this.hiddenEl.value = this.uncheckedValue;

				// uncheck checkbox (all browsers)
				this.el.checked = false;

				// hacks for IE6, because input is not operational at init,
				// so "this.el.checked = false" would work for default values !
				// (but still work for later setValue calls)
				if (YAHOO.env.ua.ie === 6) {
					this.el.removeAttribute("defaultChecked"); // for IE6
				}
			}

			// Call Field.setValue to set class and fire updated event
			inputEx.CheckBox.superclass.setValue.call(this, value, sendUpdatedEvt);
		},

		/**
		 * Disable the field
		 */
		disable: function () {
			this.el.disabled = true;
		},

		/**
		 * Enable the field
		 */
		enable: function () {
			this.el.disabled = false;
		}

	});

// Register this class as "boolean" type
	inputEx.registerType("boolean", inputEx.CheckBox, [
		{type: 'string', label: 'Right Label', name: 'rightLabel'}
	]);

})();
(function () {

	var Event = YAHOO.util.Event;

	/**
	 * Create a textarea input
	 * @class inputEx.Textarea
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options Added options:
	 * <ul>
	 *       <li>rows: rows attribute</li>
	 *       <li>cols: cols attribute</li>
	 * </ul>
	 */
	inputEx.Textarea = function (options) {
		inputEx.Textarea.superclass.constructor.call(this, options);
	};
	YAHOO.lang.extend(inputEx.Textarea, inputEx.StringField, {

		/**
		 * Set the specific options (rows and cols)
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.Textarea.superclass.setOptions.call(this, options);
			this.options.rows = options.rows || 6;
			this.options.cols = options.cols || 23;

			// warning : readonly option doesn't work on IE < 8
			this.options.readonly = !!options.readonly;
		},

		/**
		 * Render an 'INPUT' DOM node
		 */
		renderComponent: function () {

			// This element wraps the input node in a float: none div
			this.wrapEl = inputEx.cn('div', {className: 'inputEx-StringField-wrapper'});

			// Attributes of the input field
			var attributes = {};
			attributes.id = this.divEl.id ? this.divEl.id + '-field' : YAHOO.util.Dom.generateId();
			attributes.rows = this.options.rows;
			attributes.cols = this.options.cols;
			if (this.options.name) attributes.name = this.options.name;
			if (this.options.readonly) attributes.readonly = 'readonly';

			//if(this.options.maxLength) attributes.maxLength = this.options.maxLength;

			// Create the node
			this.el = inputEx.cn('textarea', attributes, null, this.options.value);

			// Append it to the main element
			this.wrapEl.appendChild(this.el);
			this.fieldContainer.appendChild(this.wrapEl);
		},

		/**
		 * Uses the optional regexp to validate the field value
		 */
		validate: function () {
			var previous = inputEx.Textarea.superclass.validate.call(this);

			// emulate maxLength property for textarea
			//   -> user can still type but field is invalid
			if (this.options.maxLength) {
				previous = previous && this.getValue().length <= this.options.maxLength;
			}

			return previous;
		},

		/**
		 * Add the minLength string message handling
		 */
		getStateString: function (state) {
			if (state == inputEx.stateInvalid && this.options.minLength && this.el.value.length < this.options.minLength) {
				return inputEx.messages.stringTooShort[0] + this.options.minLength + inputEx.messages.stringTooShort[1];

				// Add message too long
			} else if (state == inputEx.stateInvalid && this.options.maxLength && this.el.value.length > this.options.maxLength) {
				return inputEx.messages.stringTooLong[0] + this.options.maxLength + inputEx.messages.stringTooLong[1];
			}
			return inputEx.Textarea.superclass.getStateString.call(this, state);
		},


		/**
		 * Insert text at the current cursor position
		 * @param {String} text Text to insert
		 */
		insert: function (text) {

			var sel, startPos, endPos;

			//IE support
			if (document.selection) {
				this.el.focus();
				sel = document.selection.createRange();
				sel.text = text;
			}
			//Mozilla/Firefox/Netscape 7+ support
			else if (this.el.selectionStart || this.el.selectionStart == '0') {
				startPos = this.el.selectionStart;
				endPos = this.el.selectionEnd;
				this.el.value = this.el.value.substring(0, startPos) + text + this.el.value.substring(endPos, this.el.value.length);
			}
			else {
				this.el.value += text;
			}
		}

	});

	inputEx.messages.stringTooLong = ["This field should contain at most ", " numbers or characters"];

// Register this class as "text" type
	inputEx.registerType("text", inputEx.Textarea, [
		{ type: 'integer', label: 'Rows', name: 'rows', value: 6 },
		{ type: 'integer', label: 'Cols', name: 'cols', value: 23 }
	]);

})();
(function () {

	var lang = YAHOO.lang, Event = YAHOO.util.Event, Dom = YAHOO.util.Dom, CSS_PREFIX = 'inputEx-InPlaceEdit-';

	/**
	 * Meta field providing in place editing (the editor appears when you click on the formatted value).
	 * @class inputEx.InPlaceEdit
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options Added options:
	 * <ul>
	 *   <li>visu</li>
	 *   <li>editorField</li>
	 *   <li>animColors</li>
	 * </ul>
	 */
	inputEx.InPlaceEdit = function (options) {
		inputEx.InPlaceEdit.superclass.constructor.call(this, options);
	};

	lang.extend(inputEx.InPlaceEdit, inputEx.Field, {
		/**
		 * Set the default values of the options
		 * @param {Object} options Options object as passed to the constructor
		 */
		setOptions: function (options) {
			inputEx.InPlaceEdit.superclass.setOptions.call(this, options);

			this.options.visu = options.visu;

			this.options.editorField = options.editorField;

			this.options.buttonTypes = options.buttonTypes || {ok: "submit", cancel: "link"};

			this.options.animColors = options.animColors || null;
		},

		/**
		 * Override renderComponent to create 2 divs: the visualization one, and the edit in place form
		 */
		renderComponent: function () {
			this.renderVisuDiv();
			this.renderEditor();
		},

		/**
		 * Render the editor
		 */
		renderEditor: function () {

			this.editorContainer = inputEx.cn('div', {className: CSS_PREFIX + 'editor'}, {display: 'none'});

			// Render the editor field
			this.editorField = inputEx(this.options.editorField, this);
			var editorFieldEl = this.editorField.getEl();

			this.editorContainer.appendChild(editorFieldEl);
			Dom.addClass(editorFieldEl, CSS_PREFIX + 'editorDiv');

			this.okButton = new inputEx.widget.Button({
				type: this.options.buttonTypes.ok,
				parentEl: this.editorContainer,
				value: inputEx.messages.okEditor,
				className: "inputEx-Button " + CSS_PREFIX + 'OkButton',
				onClick: {fn: this.onOkEditor, scope: this}
			});

			this.cancelLink = new inputEx.widget.Button({
				type: this.options.buttonTypes.cancel,
				parentEl: this.editorContainer,
				value: inputEx.messages.cancelEditor,
				className: "inputEx-Button " + CSS_PREFIX + 'CancelLink',
				onClick: {fn: this.onCancelEditor, scope: this}
			});

			// Line breaker ()
			this.editorContainer.appendChild(inputEx.cn('div', null, {clear: 'both'}));

			this.fieldContainer.appendChild(this.editorContainer);

		},

		/**
		 * Set the color when hovering the field
		 * @param {Event} e The original mouseover event
		 */
		onVisuMouseOver: function (e) {
			if (this.colorAnim) {
				this.colorAnim.stop(true);
			}
			inputEx.sn(this.formattedContainer, null, {backgroundColor: this.options.animColors.from });
		},

		/**
		 * Start the color animation when hovering the field
		 * @param {Event} e The original mouseout event
		 */
		onVisuMouseOut: function (e) {
			// Start animation
			if (this.colorAnim) {
				this.colorAnim.stop(true);
			}
			this.colorAnim = new YAHOO.util.ColorAnim(this.formattedContainer, {backgroundColor: this.options.animColors}, 1);
			this.colorAnim.onComplete.subscribe(function () {
				Dom.setStyle(this.formattedContainer, 'background-color', '');
			}, this, true);
			this.colorAnim.animate();
		},

		/**
		 * Create the div that will contain the visualization of the value
		 */
		renderVisuDiv: function () {
			this.formattedContainer = inputEx.cn('div', {className: 'inputEx-InPlaceEdit-visu'});

			if (lang.isFunction(this.options.formatDom)) {
				this.formattedContainer.appendChild(this.options.formatDom(this.options.value));
			}
			else if (lang.isFunction(this.options.formatValue)) {
				this.formattedContainer.innerHTML = this.options.formatValue(this.options.value);
			}
			else {
				this.formattedContainer.innerHTML = lang.isUndefined(this.options.value) ? inputEx.messages.emptyInPlaceEdit : this.options.value;
			}

			this.fieldContainer.appendChild(this.formattedContainer);

		},

		/**
		 * Adds the events for the editor and color animations
		 */
		initEvents: function () {
			Event.addListener(this.formattedContainer, "click", this.openEditor, this, true);

			// For color animation (if specified)
			if (this.options.animColors) {
				Event.addListener(this.formattedContainer, 'mouseover', this.onVisuMouseOver, this, true);
				Event.addListener(this.formattedContainer, 'mouseout', this.onVisuMouseOut, this, true);
			}

			if (this.editorField.el) {
				// Register some listeners
				Event.addListener(this.editorField.el, "keyup", this.onKeyUp, this, true);
				Event.addListener(this.editorField.el, "keydown", this.onKeyDown, this, true);
			}
		},

		/**
		 * Handle some keys events to close the editor
		 * @param {Event} e The original keyup event
		 */
		onKeyUp: function (e) {
			// Enter
			if (e.keyCode == 13) {
				this.onOkEditor(e);
			}
			// Escape
			if (e.keyCode == 27) {
				this.onCancelEditor(e);
			}
		},

		/**
		 * Handle the tabulation key to close the editor
		 * @param {Event} e The original keydown event
		 */
		onKeyDown: function (e) {
			// Tab
			if (e.keyCode == 9) {
				this.onOkEditor(e);
			}
		},

		/**
		 * Validate the editor (ok button, enter key or tabulation key)
		 */
		onOkEditor: function (e) {
			Event.stopEvent(e);

			var newValue = this.editorField.getValue();
			this.setValue(newValue);

			this.editorContainer.style.display = 'none';
			this.formattedContainer.style.display = '';

			var that = this;
			setTimeout(function () {
				that.updatedEvt.fire(newValue);
			}, 50);
		},


		/**
		 * Close the editor on cancel (cancel button, blur event or escape key)
		 * @param {Event} e The original event (click, blur or keydown)
		 */
		onCancelEditor: function (e) {
			Event.stopEvent(e);
			this.editorContainer.style.display = 'none';
			this.formattedContainer.style.display = '';
		},

		/**
		 * Display the editor
		 */
		openEditor: function () {
			var value = this.getValue();
			this.editorContainer.style.display = '';
			this.formattedContainer.style.display = 'none';

			if (!lang.isUndefined(value)) {
				this.editorField.setValue(value);
			}

			// Set focus in the element !
			this.editorField.focus();

			// Select the content
			if (this.editorField.el && lang.isFunction(this.editorField.el.setSelectionRange) && (!!value && !!value.length)) {
				this.editorField.el.setSelectionRange(0, value.length);
			}

		},

		/**
		 * Returned the previously stored value
		 * @return {Any} The value of the subfield
		 */
		getValue: function () {
			var editorOpened = (this.editorContainer.style.display == '');
			return editorOpened ? this.editorField.getValue() : this.value;
		},

		/**
		 * Set the value and update the display
		 * @param {Any} value The value to set
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {
			// Store the value
			this.value = value;

			if (lang.isUndefined(value) || value == "") {
				inputEx.renderVisu(this.options.visu, inputEx.messages.emptyInPlaceEdit, this.formattedContainer);
			}
			else {
				inputEx.renderVisu(this.options.visu, this.value, this.formattedContainer);
			}

			// If the editor is opened, update it
			if (this.editorContainer.style.display == '') {
				this.editorField.setValue(value);
			}

			inputEx.InPlaceEdit.superclass.setValue.call(this, value, sendUpdatedEvt);
		},

		/**
		 * Close the editor when calling the close function on this field
		 */
		close: function () {
			this.editorContainer.style.display = 'none';
			this.formattedContainer.style.display = '';
		}

	});

	inputEx.messages.emptyInPlaceEdit = "(click to edit)";
	inputEx.messages.cancelEditor = "cancel";
	inputEx.messages.okEditor = "Ok";

// Register this class as "inplaceedit" type
	inputEx.registerType("inplaceedit", inputEx.InPlaceEdit, [
		{ type: 'type', label: 'Editor', name: 'editorField'}
	]);

})();
(function () {

	var Event = YAHOO.util.Event, Dom = YAHOO.util.Dom, lang = YAHOO.lang;

	/**
	 * TypeField is a field to create fields. The user can create any value he wants by switching fields.
	 * @class inputEx.TypeField
	 * @extends inputEx.Field
	 * @constructor
	 * @param {Object} options  Standard inputEx options definition
	 */
	inputEx.TypeField = function (options) {
		inputEx.TypeField.superclass.constructor.call(this, options);

		// Build the updateFieldValue
		this.updateFieldValue();
	};

	lang.extend(inputEx.TypeField, inputEx.Field, {

		/**
		 * Render the TypeField: create a button with a property panel that contains the field options
		 */
		renderComponent: function () {
			// DIV element to wrap the Field "default value"
			this.fieldValueWrapper = inputEx.cn('div', {className: "inputEx-TypeField-FieldValueWrapper"});
			this.fieldContainer.appendChild(this.fieldValueWrapper);

			// Render the popup that will contain the property form
			this.propertyPanel = inputEx.cn('div', {className: "inputEx-TypeField-PropertiesPanel"}, {display: 'none'});

			// The list of all inputEx declared types to be used in the "type" selector
			var selectOptions = [];
			for (var key in inputEx.typeClasses) {
				if (inputEx.typeClasses.hasOwnProperty(key)) {
					selectOptions.push({ value: key });
				}
			}
			this.typeSelect = new inputEx.SelectField({label: "Type", choices: selectOptions, parentEl: this.propertyPanel});

			// DIV element to wrap the options group
			this.groupOptionsWrapper = inputEx.cn('div');
			this.propertyPanel.appendChild(this.groupOptionsWrapper);

			// Button to switch the panel
			this.button = inputEx.cn('div', {className: "inputEx-TypeField-EditButton"});
			this.button.appendChild(this.propertyPanel);
			this.fieldContainer.appendChild(this.button);

			// Build the groupOptions
			this.rebuildGroupOptions();
		},

		/**
		 * Adds 2 event listeners:
		 *  - on the button to toggel the propertiesPanel
		 */
		initEvents: function () {
			inputEx.TypeField.superclass.initEvents.call(this);

			// "Toggle the properties panel" button :
			Event.addListener(this.button, 'click', this.onTogglePropertiesPanel, this, true);

			// Prevent the button to receive a "click" event if the propertyPanel doesn't catch it
			Event.addListener(this.propertyPanel, 'click', function (e) {
				Event.stopPropagation(e);
			}, this, true);

			// Listen the "type" selector to update the groupOptions
			// Hack the type selector to rebuild the group option
			this.typeSelect.updatedEvt.subscribe(this.rebuildGroupOptions, this, true);
		},

		/**
		 * Regenerate the property form
		 */
		rebuildGroupOptions: function () {
			try {

				// Save the previous value:
				var previousVal = null;

				// Close a previously created group
				if (this.group) {
					previousVal = this.group.getValue();
					this.group.close();
					this.group.destroy();
					this.groupOptionsWrapper.innerHTML = "";
				}

				// Get value is directly the class !!
				var classO = inputEx.getFieldClass(this.typeSelect.getValue());

				// Instanciate the group
				var groupParams = {fields: classO.groupOptions, parentEl: this.groupOptionsWrapper};
				this.group = new inputEx.Group(groupParams);

				// Set the previous name/label
				if (previousVal) {
					this.group.setValue({
						name: previousVal.name,
						label: previousVal.label
					});
				}

				// Register the updated event
				this.group.updatedEvt.subscribe(this.onChangeGroupOptions, this, true);

				// Create the value field
				this.updateFieldValue();

			} catch (ex) {
				if (YAHOO.lang.isObject(window["console"]) && YAHOO.lang.isFunction(window["console"]["log"])) {
					console.log("inputEx.TypeField.rebuildGroupOptions: ", ex);
				}
			}

		},

		/**
		 * Toggle the property panel
		 */
		onTogglePropertiesPanel: function () {
			if (this.propertyPanel.style.display == 'none') {
				this.propertyPanel.style.display = '';
				Dom.addClass(this.button, "opened");
			} else {
				this.propertyPanel.style.display = 'none';
				Dom.removeClass(this.button, "opened");
			}
		},

		/**
		 * Update the fieldValue with the changed properties
		 */
		onChangeGroupOptions: function () {

			// Update the field value
			this.updateFieldValue();

			// Fire updatedEvt
			this.fireUpdatedEvt();
		},

		/**
		 * Update the fieldValue
		 */
		updateFieldValue: function () {
			try {
				// Close previous field
				if (this.fieldValue) {
					this.fieldValue.close();
					this.fieldValue.destroy();
					delete this.fieldValue;
					this.fieldValueWrapper.innerHTML = '';
				}

				// Re-build the fieldValue
				var fieldOptions = this.group.getValue();

				fieldOptions.type = this.getValue().type;
				fieldOptions.parentEl = this.fieldValueWrapper;

				this.fieldValue = inputEx(fieldOptions, this);

				// Refire the event when the fieldValue is updated
				this.fieldValue.updatedEvt.subscribe(this.fireUpdatedEvt, this, true);
			}
			catch (ex) {
				console.log("Error while updateFieldValue", ex.message);
			}
		},


		/**
		 * Set the value of the label, typeProperties and group
		 * @param {Object} value Type object configuration
		 * @param {boolean} [sendUpdatedEvt] (optional) Wether this setValue should fire the updatedEvt or not (default is true, pass false to NOT send the event)
		 */
		setValue: function (value, sendUpdatedEvt) {

			// Set type in property panel
			this.typeSelect.setValue(value.type, false);

			// Rebuild the panel propertues
			this.rebuildGroupOptions();

			// Set the parameters value

			// Retro-compatibility with deprecated inputParams Object
			if (lang.isObject(value.inputParams)) {
				this.group.setValue(value.inputParams, false);

				// New prefered way to describe a field
			} else {
				this.group.setValue(value, false);
			}

			// Rebuild the fieldValue
			this.updateFieldValue();

			// Set field value : TODO -> fix it for default value (because updateFieldValue is called after first setValue)

			// Retro-compatibility with deprecated inputParams Object
			if (lang.isObject(value.inputParams) && !lang.isUndefined(value.inputParams.value)) {
				this.fieldValue.setValue(value.inputParams.value);

				// New prefered way to describe a field
			} else if (!lang.isUndefined(value.value)) {
				this.fieldValue.setValue(value.value);
			}

			if (sendUpdatedEvt !== false) {
				// fire update event
				this.fireUpdatedEvt();
			}
		},

		/**
		 * Return the config for a entry in an Group
		 * @return {Object} Type object configuration
		 */
		getValue: function () {

			var getDefaultValueForField = function (classObj, paramName) {
				var i, length = classObj.groupOptions.length, f;

				for (i = 0; i < length; i++) {
					f = classObj.groupOptions[i];

					// Retro-compatibility with deprecated inputParams Object
					if (lang.isObject(f.inputParams) && f.inputParams.name == paramName) {
						return f.inputParams.value;

						// New prefered way to use field options
					} else if (f.name == paramName) {
						return f.value;
					}
				}
				return undefined;
			};


			// The field parameters
			var fieldParams = this.group.getValue();
			var classObj = inputEx.getFieldClass(this.typeSelect.getValue());

			// + default values
			for (var key in fieldParams) {
				if (fieldParams.hasOwnProperty(key)) {
					var value1 = getDefaultValueForField(classObj, key);
					var value2 = fieldParams[key];
					if (value1 == value2) {
						fieldParams[key] = undefined;
					}
				}
			}

			// The field type
			fieldParams.type = this.typeSelect.getValue();

			// The value defined by the fieldValue
			if (this.fieldValue) fieldParams.value = this.fieldValue.getValue();

			return fieldParams;
		}

	});


// Register this class as "type" type
	inputEx.registerType("type", inputEx.TypeField, []);

})();