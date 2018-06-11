
var GLOBAL_WORKBENCH = null;
var GLOBAL_USER = null;

var GLOBAL_WORKBENCH_LOADING_VISIBLE = false;
function showLoadingSisob(show)
{
	if(show)
	{
		if( GLOBAL_WORKBENCH_LOADING_VISIBLE) return;

			msgText = "Loading SISOB workbench...",
			textVisible = "Loading...",
			textonly = "Loading...";
			html = "<span class='ui-bar ui-shadow ui-overlay-d ui-corner-all'><img height='40px' src='logos/logo-SISOB-wb.svg'>"
				+ "<div class='ui-icon-loading' style='margin: 0 auto .625em; filter: Alpha(Opacity=75); opacity: .75; -webkit-border-radius: 2.25em; border-radius: 2.25em; width: 46px; height:46px;'></div><h2>workbench is loading ...</h2></span>"
			;

		setTimeout(function(){
		$.mobile.loading( "show", {
			text: msgText,
			textVisible: textVisible,
			textonly: textonly,
			theme: "a",
			html: html
		});
		}, 1);

	}
	else
	{
		if( !GLOBAL_WORKBENCH_LOADING_VISIBLE) return;

		setTimeout(function(){
			$.mobile.loading('hide');
		}, 1);
	}

	GLOBAL_WORKBENCH_LOADING_VISIBLE = show;
}

function prepareWorkbench(user) {
	console.log("prepareWorkbench");

	var analysis = {
		languageName:"SISOB Analysis",
		modules:[{
			"name" : "Direct Uploader",
			"category" : "Input",
			"container" : {
				"xtype" : "WireIt.SISOBContainer",
				"outputs": [{"name":"out_1","label":"uploaded data"}],
				"fields" : [ {
					"type" : "file",
					"label" : "Select File",
					"name" : "files",
					"required" : true
				},{
					"type" : "boolean",
					"label": "Handle as text?",
					"name" : "text",
					"value": true
				} ],
				"descriptionText" : "'Handle as text?' determines if the data is handled as text or as binary. If the input is a text file (like most network formats), please check it. In doubt please leave it unchecked.",
				"legend" : "This agent will upload a file or a data folder from your local file system, please think of the format conversion into a SISOB format."
			}}]
	};

	showLoadingSisob(true);


	GLOBAL_USER = user;

	SC.sendRequest('getFilterDescriptions', buildInterface);



	function buildInterface(modules) {
		console.log("buildInterface");

		var menuItem = $("#menuLoad")[0]; // we could use any item here that is rendered in renderMenus
		if(menuItem != null)
		{
			console.log("workbench already initialised.");
			showLoadingSisob(false);
			return;
		}

		showLoadingSisob(true);

		for (var i = 0; i < modules.length; i++) {
			analysis.modules.push(modules[i]);
		}

		setTimeout(function(){

			GLOBAL_WORKBENCH = new SISOB.Workbench(analysis, GLOBAL_USER);

			showLoadingSisob(false);
		}, 1);

	}

}





/************ WORKBENCH ***************/

SISOB = function(){

	Workbench = function(analysis, user)
	{

		this.loginName = user.id;
		this.user = user;

		this.options = {};

		var self = this;

		var touch = (('ontouchstart' in window) || (navigator.msMaxTouchPoints > 0));
		this.isTouchDevice = touch;


	// only for demo purposes
		touch = true;

//		console.log(navigator.userAgent.toLowerCase());

		if( navigator.userAgent.toLowerCase().indexOf('firefox') > -1
		&& touch)
		{
			// if firefox and touch device
			this.options.tapToConnect = true;
			$("#headerText").append("FOX");
		}
		else
		{
			$("#headerText").append( touch ? "(T)" : "(NT)"); // Touch NoTouch
		}

		SISOB.Workbench.superclass.constructor.call(this);

		this.modules = analysis.modules;
		this.modulesByName = [];
		for (var i = 0; i < this.modules.length; i++) {
			var m = this.modules[i];
			this.modulesByName[m.name] = m;
		}

		// containers are in this.layer.containers
//		this.containers = [];

		this.layer = new WireIt.Layer({});
		$(".WireIt-Layer").hide();
		this.layer.eventChanged.subscribe(this.onLayerChanged, this, true);

		this.resizeWorkbench();

		this.renderMenus();
		this.buildModulesList();

		// create the search bar for the modules
		$("#moduleSearch").listview().listview("refresh");
		$("#addPanel form").submit(function(){
			// get first visible module (which is the first in the list of matches if there are multiple)
			var modName = $("#moduleSearch li:visible").data("module-name");
			console.log(modName);
			var module = self.modulesByName[modName];
			if(module)
			{
				var event = {};event.data = [self, module, 'auto submit'];
				self.moduleClick(event);
			}
		});

		$(window).resize(this.resizeWorkbench);


		$(".WireIt-Layer").show();

		var touchMove = function (e) {
//			$target.css({'webkitTransform':'scale(' + data.scale + ',' + data.scale + ')'});

			if(e.targetTouches.length < 2){
				 return;
			}

			e.preventDefault();

			var a = e.targetTouches[0];
			var b = e.targetTouches[1];

			var yDiff = Math.abs(a.clientY- b.clientY);
			var xDiff = Math.abs(a.clientX- b.clientX);
			var distance = Math.sqrt(yDiff*yDiff+xDiff*xDiff);

			// just for testing treat 500 as zoom 1
			var zoom = distance/500;
			console.log("distance " + distance);
			console.log(e);


//			var zoom = event.gesture.scale;
//			var headerHeight = $('[data-role=header]').outerHeight();
//			var footerHeight = $('[data-role=footer]').outerHeight();
//			var panelHeight = $('.ui-panel').height() +2 ; // 2px there is a gap on chrome otherwise
//
//			var newPanelHeight = window.innerHeight - headerHeight - footerHeight;
//			var newContentHeight = newPanelHeight / zoom - 5; // 5 is margin
//
			$('.WireIt-Layer').css({
				'zoom' : zoom
			});
		};

//		document.addEventListener('touchmove', touchMove, true);
//
//		self.zoom = 1.0;
//
//		$("#zoomPlus").on("click", function(e)
//		{
//			var layer = $('.WireIt-Layer');
//			var width = layer.width();
//			var height = layer.height();
//
//			self.zoom += 0.1;
//
////			layer.css({'-webkit-transform': 'scale(' + 2.0 + ')'});
//			layer.css({'zoom': self.zoom});
//			layer.css({'-moz-transform': 'scale(' + self.zoom + ')'});
//			layer.css({'height': height});
//			layer.css({'width': width});
//		});
//		$("#zoomMinus").on("click", function(e)
//		{
//			var layer = $('.WireIt-Layer');
//			var width = layer.width();
//			var height = layer.height();
//
//			self.zoom -= 0.1;
//
////			layer.css({'-webkit-transform': 'scale(' + 2.0 + ')'});
//			layer.css({'zoom': self.zoom});
//			layer.css({'-moz-transform': 'scale(' + self.zoom + ')'});
//			layer.css({'height': height/self.zoom});
//			layer.css({'width': width/self.zoom});
//		});
//		$(".WireIt-Layer").get(0).addEventListener('touchmove', touchMove);
//		$(".WireIt-Layer").on("touchmove", touchMove).on("touchstart", touchStart);

	};

	YAHOO.lang.extend(Workbench, workbench_work_parent, {
//	Workbench.prototype = {

		resizeWorkbench: function(){


			var headerHeight = $('[data-role=header]').outerHeight();
			var footerHeight = $('[data-role=footer]').outerHeight();
			var panelHeight = $('.ui-panel').height();

			var newPanelHeight = window.innerHeight - headerHeight - footerHeight;
			var newContentHeight = newPanelHeight -10;

			console.log("resizeWorkbench " + newPanelHeight);

			$('.ui-panel').css({
				'top': headerHeight,
				'min-height': newPanelHeight,
				'height' : newPanelHeight,
				'overflow-x' : 'none',
				'overflow-y' : 'auto'
			});

			// also need to set that for the inner panel
			// (otherwise uncollapsing categories for the modules will change the height and it will add space below the workflow canvas)
			$('.ui-panel-inner').css({
				'min-height' : newPanelHeight,
				'height' : newPanelHeight
			});

			// new height for center we do not use the zoom factor here
			$('#center').css({
				'height' : newPanelHeight-5
			});

			$('.WireIt-Layer').css({
				'height' : newContentHeight
			});


		},

		renderMenus: function(){

			var self = this;

			var menuList = $("#menuList");
			menuList.append("<li data-role='divider' data-theme='b'>Workflow</li>");

			//uncomment to have "new" in the menu which clears the workflow
//			menuList.append("<li id='menuNew'><a href='#'>New</a></li>");
//			$('#menuNew').on("click", function(){
//
//				if(!self.isSaved()
//					&& GLOBAL_WORKBENCH.layer.containers.length > 0)
//				{
//					var r=confirm("You have NOT saved your workflow and will lose the data! Do you still want to create a new workflow?");
//					if (r==true)
//					{
//						self.layer.clear();
//					}
//					else
//					{
//						return;
//					}
//				}
//				self.layer.clear();
//			});

			menuList.append("<li id='menuLoad'><a href='#'>Load</a></li>");
			$('#menuLoad').on("click", this, this.tsLoad);

			menuList.append("<li id='menuSave'><a href='#'>Save</a></li>");
			$('#menuSave').on("click", this, this.onSave);

			menuList.append("<li id='menuExecuteMenu' class='menuExecute'><a href='#'>Execute</a></li>");
			//there are two menuExecute, the button in the header and in the menu
			//  jquery adds the handler to both
//			$(".menuExecute").on("click", function(){
//				$("#popupMenu").popup('close');
//				self.onExecute.call(self);
//			});

			$("#menuExecuteHeader").on("click", function(){
				try{
				SC.socket.emit('statistics', { username: self.loginName, action: 'menuExecuteHeader' });
				}catch(err){}
				self.onExecute.call(self);
			});
			$("#menuExecuteMenu").on("click", function(){
				try{
				SC.socket.emit('statistics', { username: self.loginName, action: 'menuExecuteMenu' });
				}catch(err){}
				$("#popupMenu").popup('close');
				self.onExecute.call(self);
			});


			menuList.append("<li id='menuLoadPrev'><a href='#'>Previous Results</a></li>");
			$("#menuLoadPrev").on("click", function(){
				self.loadResults.call(self);
			});



//			$("#menuList").append("<li data-role='divider' data-theme='b'>Reports</li>");
//			$("#menuList").append("<li id='menuLoadResults'><a href='#'>Load Previous Results</a></li>");
//			$("#menuLoadResults").on("click", this, this.onLoadResults);
			$("#btnLoadPreviousResults").on("click", this, this.onLoadResults);


			/** Admin Button **/
//			$("#menuList").append("<li data-role='divider' data-theme='b'>Admin</li>");

			menuList.append("<li id='WiringEditor-adminButton' style='display: none;'><a href='#'>Administration</a></li>");


			// tsss wer hat denn den Admin Button hack gemacht?
			//   das handling sollte in socket.io gemacht werden wo der user gesendet wird und dann an die workbench uebergen
			//  ob es ein admin user ist oder nicht
			//admin btn
//             var adminButton = new widget.Button({label:"Administration", id: "WiringEditor-adminButton", container: toolbar});
//             adminButton.setStyle("display", "none");
			adminBtnReady = true;

			menuList.append("<li data-role='divider' data-theme='b'>Workbench</li>");

			menuList.append("<li id='menuAbout'><a href='#aboutDialog' data-rel='dialog'>About</a></li>");

			menuList.append("<li id='menuLogout'><a href='/logout' rel='external'>Logout ("+this.user.username+")</a></li>");


			menuList.listview().listview("refresh");

		},

		/**
		 * Build the left menu on the left
		 * @method buildModulesList
		 */
		buildModulesList: function () {
			console.log("buildModulesList");

//			for(var i=0;i<FILTERORDER.length;i++)
//			{
//				this.createCategory(FILTERORDER[i]);
//			}


			var modules = this.modules;

			console.log("count " + this.modules.length);

            modules = sortModules(modules);

//			modules.sort(function(a,b){
//				if( a.name.toLowerCase() < b.name.toLowerCase() ) return -1;
//				if(a.name.toLowerCase() > b.name.toLowerCase() ) return 1;
//				return 0;
//			});
//			console.log(modules);

			for (var i = 0; i < modules.length; i++) {
				this.addModuleToList(modules[i]);
			}

			var self = this;
//                accept: '.sisobDraggable',

			$(".WireIt-Layer").droppable( {drop: function(event, ui){

				console.log(ui);
				if(ui.helper.data("dropit") != true)
				{
					console.log("not dropping, was just a scroll");
					return;
				}


				var layerPos = Dom.getXY(self.layer.el);

				var posX = event.pageX - layerPos[0] + self.layer.el.scrollLeft;
				var posY = event.pageY - layerPos[1] + self.layer.el.scrollTop;

//				console.log(layerPos);
//				console.log("scrollTop " + self.layer.el.scrollLeft);
//				console.log("scrollLeft " + self.layer.el.scrollTop);
//				console.log("drop posX " + posX + " posY " + posY);

				// we 'abuse' the id to store the name of the module
				//  and get the module from the internal array
				//
				// The drop event is also fired when we move existing elements around the canvas.
				// in this case the name/module are not set and the if statements avoid adding a new container when just moving an existing one around

				//could/should we use jqueries data() instead?
				var name = ui.draggable[0].id;
				if(name)
				{
					var module = self.modulesByName[name];
					if(module){
						self.addModule(module, [posX,posY]);
					}
				}

			},
				accept: '.sisobDraggable'
			});

            function sortModules(modules){

                // extract names and categories from module list
                var missingCategories = [];
                console.log('Before sorting: ' + categories);
                var names = [];
                for (var k = 0; k < modules.length; k++){
                    if (!arrayContains(names, modules[k].name)) {
                        names.push(modules[k].name);
                    }
                    if (!arrayContains(missingCategories, modules[k].category.toString()) && !arrayContains(FILTERORDER, modules[k].category.toString())) {
                        missingCategories.push(modules[k].category.toString());
                    }
                }
                // sort names and categories alphabetically
                names.sort();
                missingCategories.sort();
                var categories = missingCategories;
                if (FILTERORDER) {
                    categories = FILTERORDER.concat(missingCategories);
                }
                // create sorted array
                var sorted = [];
                for (var i = 0; i < categories.length; i++) {
                    for (var j = 0; j < names.length; j++) {
                        for (var k = 0; k < modules.length; k++) {
                            if (modules[k].category.toString() === categories[i] && modules[k].name === names[j]) {
                                sorted.push(modules[k]);
                            }
                        }
                    }
                }
                return sorted;

                function arrayContains(array, element) {
                    for (var i = 0; i < array.length; i++) {
                        if (array[i] === element) {
                            return true;
                        }
                    }
                    return false;
                }

            }

		},


		// creates a new category (category is the name)
		createCategory: function(category)
		{
			var categoryId = "module-category-" + category.replace(/\s+/g, '-');
			// id of the list within the category to which we append the modules
			var listCategoryId = "list-" + categoryId;

			var elements = "<div id='"+categoryId+"' data-mini='true' data-role='collapsible' data-collapsed-icon='arrow-r' data-expanded-icon='arrow-d' ";
			if( category.indexOf("Input")>-1 )
			{
				elements += "data-collapsed='false' ";
				elements += "data-theme='a' ";
			}
			else if( category.indexOf("Graph Visualizations")>-1
				|| category.indexOf("Statistical Visualizations") > -1
				|| category.indexOf("Output") > -1)
			{
				// color but don't open
				elements += "data-theme='a' ";
			}
			else{
				elements += "data-theme='b' ";
			}
			elements += "data-content-theme='d' data-inset='false'><h3>"
				+category
				+"</h3><ul class='"+listCategoryId+"' data-role='listview'></ul></div>";


			$(".addContainer").append(elements);

			$("."+listCategoryId).trigger("create")
				.listview().listview("refresh");
		},

		/**
		 * Add a module definition to the left list
		 */
		addModuleToList: function (module) {
//
//			try {
//				var div = WireIt.cn('div', {className: "WiringEditor-module",
//					onmouseover: "javascript:tooltipHover(this, this.short)",
//					onmouseout: "javascript:tooltipHoverReset(this)"});

//                if (module.container.descriptionText) {
//            		div.long = module.container.descriptionText;
//                }
//            	if (module.container.legend) {
//            		div.short = module.container.legend;
//            	}
//                if (module.container.icon) {
//                    div.appendChild(WireIt.cn('img', {src: module.container.icon}));
//                }
//                div.appendChild(WireIt.cn('span', null, null, module.name));

				var category = module.category || "main";


				var categoryId = "module-category-" + category.replace(/\s+/g, '-');
				// id of the list within the category to which we append the modules
				var listCategoryId = "list-" + categoryId;
				var cat = $("#"+categoryId).get(0);

				// check if the category already exists, otherwise create it
				if (!cat) {
					this.createCategory(category);
				}

				var idname = module.name.replace(/\s+/g, '-');
//                $("#"+newId).after("<li data-icon='plus' id='"+idname+"'><a href='#'>"+module.name+"</a><a href='#'>&nbsp</a></li>");

				var itemText = "<li data-icon='plus' id='"+module.name+"' class='"+idname+" sisobDraggable' style='z-index: 99;'>"
					+ "<a title=\'" + module.container.legend + "\' href='#'>"+module.name+"</a>"
					+  " <a href='#' >Add</a>"
					+ "</li>";

				$("."+listCategoryId).append(itemText).trigger("create")
				.listview().listview("refresh");

				$("."+idname)
					.on("click", [this, module], this.moduleClick);


				var autoIdname = "auto_"+idname;
				$("#moduleSearch")
					.append("<li  id='"+autoIdname+"' class='ui-screen-hidden' data-icon='plus'><a href='#'>"+module.name+"</a><a href='#' >Add</a></li>");
				$("#"+autoIdname).data("module-name", module.name);


				$("#"+autoIdname).on("click", [this, module], this.moduleClick);

				$("."+idname).draggable( {appendTo: 'body', containment: 'document', helper: 'clone', cursor: 'move',

					start: function(event, ui)
					{
						this.myHelper = ui.helper;
						ui.helper.hide();
						this.wasOutsidePanel = false;
					},

					drag: function(event, ui){

						if(event.pageX < 200 && !this.wasOutsidePanel)
						{
							if(this.lastY){
								var scrollY = event.pageY - this.lastY;
								scrollY *= -1; // natural scrolling, reverse direction
//								console.log(scrollY);

								var panel = $("#addPanel").first().get(0);
								var currentScroll = panel.scrollTop;
								if( currentScroll + scrollY < 0)
								{
									panel.scrollTop = 0;
								}else
								{
									panel.scrollTop += scrollY;
								}
							}
						}else
						{
							this.wasOutsidePanel = true;
							ui.helper.show();
							ui.helper.data("dropit", true);
						}

						this.lastY = event.pageY;
					}
				});

				$("#"+categoryId).collapsible();

//			} catch (ex) {
//				console.log(ex);
//			}
		},


	moduleClick: function (event)
	{
		var self = event.data[0];
		var module = event.data[1];

		// position element on canvas
		var posX = 100; // 100 is arbitrary
		var posY =  20; // 20 is arbitrary

		// if there has been an element added before, place new element below
		if( self.lastAddedElement != null)
		{
			var elem = $("#"+self.lastAddedElement.el.id);
			var pos = elem.position();
			var height = elem.height();
			if( typeof pos != 'undefined' && typeof height != 'undefined')
			{
				posX = pos.left + self.layer.el.scrollLeft;
				posY = pos.top + height + self.layer.el.scrollTop + 50;
			}
		}

		var container = self.addModule(module, [posX, posY]);

		var jContainer = $(container.el);

		var layerHeight = $('.WireIt-Layer').height();
//		console.log(container.position[1]);
//		console.log(jContainer.height());
//		console.log(layerHeight);
		var st = container.position[1] + jContainer.height();
		st = container.position[1];
		console.log(st);
		if(st < 5){
			st=5;
		}
		console.log(self.layer.el.scrollTop);
		self.layer.el.scrollTop = st;
	},



		/**
		 * add a module at the given pos
		 */
		addModule: function (module, pos) {

			if(pos[0]<5){ pos[0]=5;} //5 is arbitrary to give it some margin
			if(pos[1]<5){pos[1]=5;}

//			try {
				var containerConfig = module.container;
				containerConfig.position = pos;
				containerConfig.title = module.name;

				var container = this.layer.addContainer(containerConfig);

				var jContainer = $(container.el);

				//JADO
//				console.log(this.lastAddedElement);
				this.lastAddedElement = container;

				// Adding the category CSS class name
				var category = module.category || "main";
//				Dom.addClass(container.el, "WiringEditor-module-category-" + category.replace(/ /g, '-'));
				jContainer.addClass("sisob-module-category-" + category.replace(/ /g, '-'));

				// Adding the module CSS class name
//				Dom.addClass(container.el, "WiringEditor-module-" + module.name.replace(/ /g, '-'));
				jContainer.addClass("sisob-module-" + module.name.replace(/ /g, '-'));

				return container;
	},

	onLayerChanged: function () {
//		console.log("changed");
		if (!this.preventLayerChangedEvent) {
			this.markUnsaved();
			if (this.currentRunIds && this.currentRunIds.length==0 && this.highlighted) {
				this.decolorAllContainers();
				this.highlighted = false;
			}
		}
	},



		connectTerminals: function (sourceTerminal, targetTerminal) {
			console.log("connectTerminals");
			if(sourceTerminal == null || targetTerminal == null)
			{
				console.log("terminal null");
				return;
			}

			var i;

			// Don't create the wire if it already exists between the 2 terminals !!
			var termAlreadyConnected = false;
			for (i = 0; i < sourceTerminal.wires.length; i++) {
				if (sourceTerminal.wires[i].terminal1 == sourceTerminal) {
					if (sourceTerminal.wires[i].terminal2 == targetTerminal) {
						termAlreadyConnected = true;
						break;
					}
				}
				else if (sourceTerminal.wires[i].terminal2 == sourceTerminal) {
					if (sourceTerminal.wires[i].terminal1 == targetTerminal) {
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

			var parentEl = sourceTerminal.parentEl.parentNode;
			if (sourceTerminal.container) {
				parentEl = sourceTerminal.container.layer.el;
			}

			// Switch the order of the terminals if tgt as the "alwaysSrc" property
			var term1 = sourceTerminal;
			var term2 = targetTerminal;
			if (term2.alwaysSrc) {
				term1 = targetTerminal;
				term2 = sourceTerminal;
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



	});

	return {Workbench:Workbench};
}();




