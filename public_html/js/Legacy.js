
var util = YAHOO.util, lang = YAHOO.lang;
var Event = util.Event, Dom = util.Dom, Connect = util.Connect, widget = YAHOO.widget;

workbench_work_parent = function()
{
	// Replaced original JsonRpc with custom NodeConnector
	// this.adapter = options.adapter || WireIt.WiringEditor.adapters.JsonRpc;
	if (wbConType==0){
		this.adapter = WireIt.adapters.TSConnector;
	}else{
		this.adapter = WireIt.adapters.NodeConnector;
	}

	this.renderSavedStatus();
};

workbench_work_parent.prototype =
{

	/**
	 * loading data from the sqlspaces
	 */
	tsLoad: function (e) {
//        	btnSpin("WiringEditor-loadButton");
		setTimeout(function(){
			$.mobile.loading('show');
		}, 1);

		var self = e.data;

		actualTable=0;
		// fetch the available (i.e. stored earlier) workflows from the sqlspaces
		var editor = self;
		self.adapter.getLoadableWirings(function (wirings) {

			console.log("getLoadableWirings");
			console.log(wirings);

			if (wirings == null) {
				wirings = [];
			}

			//reset variables for proper sorting
			actualTable=0;
			sortCat="";

			//change order, newest first
			wirings.reverse();

			var saveids = [];

			var height = ((wirings.length * 15) <= (window.innerHeight / 2)) ? (wirings.length * 15) : (window.innerHeight / 2);
			// minimal size
			if (height < 60){
				height = 60;
			}

			var header = "<p style='font-style:italic;margin-bottom:3px'>Please select one of the following workflows...</p><br />" +
					"<div style=\"float:left;\">" +
					"<div style=\"border:2px solid gray\" class='tableSwitchBtn' onclick='changeTable(0)'>named saves</div>" +
					"<div style=\"border:2px solid lightgray\" class='tableSwitchBtn' onclick='changeTable(1)'>autosaves</div>" +
					"</div>" +
					"<div style=\"clear:both\" /><br />"
				;


			header += "<div id='wiringsIndex' style='display:none;'></div>";

			// create a table for displaying the available stored workflows
			// table properties
			var tableOWN = "<table style=\"cursor:pointer;width:100%;\" class=\"loadTable\" border='0'>";
			tableOWN +=
				// table header properties
				"<tr style='font-weight:bold;border-bottom: 1px solid gray;'>" +
					"<th onclick='sortTable(this)' width='10%'>Index</th>" +
					"<th onclick='sortTable(this)' width='20%'>Name</th>" +
					"<th onclick='sortTable(this)' width='20%'>Description</th>" +
					"<th onclick='sortTable(this)' width='25%'>Date</th>" +
					"<th onclick='sortTable(this)' width='15%'>Edit</th>" +
					"<th onclick='sortTable(this)' width='10%'>Delete</th>" +
					"</tr>" +
					"<tr><td colspan='6'><div style='height:" + height + "px; overflow:auto'>" +
					// new table in main table, for overflow
					"<table border='0' width='100%'>";

			// table rows result table (all tuples)
			var counter = 0;
			for (var i = 0; i < wirings.length; i++) {
				var wiring = wirings[i];
				var saveid = wiring.saveid;
				saveids.push(saveid);
				if (wiring.name != "autosave"){
					// distinguish colored / white line
					var rowStyle = "";
					if(counter%2==0){
						rowStyle = "style='background:lightgray'";//#CAE1FF'";
					}
					tableOWN +=    "<tr " + rowStyle + "onClick=\"javascript:highlightLoadSelection(this)\" indexid='"+i+"' loadid='" + (counter+1) + "' name='loadSelection'>"
						+ "<td class=\"trIndex\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='10%'>" + (counter + 1) + "</td>"
						+ "<td class=\"trName\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='20%'>" + wiring['name'] + "</td>"
						+ "<td class=\"trDescription\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" style='' width='20%'>" + wiring['description']
						+ "<td class=\"trDate\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='25%'>" + parseDate(wiring['date']) + "</td>"
						+ "<td class=\"trEdit\" id='"+saveid+"' saveid=\""+saveid+"\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='15%'>rename</td>"
						+ "<td class=\"trDelete\" id='del"+saveid+"'saveid=\""+saveid+"\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='10%'>x</td>"
						+ "</td></tr>";
					counter++;
				}
			}
			tableOWN += "</table></div></td></tr>";
			tableOWN += "</tbody></table>";

			var tableAUTO = "<table style=\"display:none;cursor:pointer;width:100%;\"class=\"loadTable\" border='0' width='100%' style=\"display:\">";
			tableAUTO +=
				// table header properties
				"<tr style='font-weight:bold;border-bottom: 1px solid gray;'>" +
					"<th onclick='sortTable(this)' width='10%'>Index</th>" +
					"<th onclick='sortTable(this)' width='20%'>Name</th>" +
					"<th onclick='sortTable(this)' width='20%'>Description</th>" +
					"<th onclick='sortTable(this)' width='25%'>Date</th>" +
					"<th onclick='sortTable(this)' width='15%'>Edit</th>" +
					"<th onclick='sortTable(this)' width='10%'>Delete</th>" +
					"</tr>" +
					"<tr><td colspan='6'><div style='height:" + height + "px; overflow:auto'>" +
					// new table in main table, for overflow
					"<table border='0' width='100%'>";

			// table rows result table (all tuples)
			counter = 0;
			for (var i = 0; i < wirings.length; i++) {
				var wiring = wirings[i];
				if (wiring.name == "autosave"){
					var saveid = wiring.saveid;
					// distinguish colored / white line
					var rowStyle = "";
					if(i%2==0){
						rowStyle = "style='background:lightgray'"//#CAE1FF'";
					}
					tableAUTO +=    "<tr " + rowStyle + "onClick=\"javascript:highlightLoadSelection(this)\" indexid='"+i+"' loadid='" + (counter+1) + "' name='loadSelection'>" +
						"<td class=\"trIndex\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='10%'>"
						+ (counter + 1) + "</td>" +
						"<td class=\"trName\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='20%'>"
						+ wiring['name'] + "</td>" +
						"<td onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" class=\"trDescription\" width='20%'>"
						+ wiring['description'] +"</td>"
						+ "<td class=\"trDate\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='25%'>" + parseDate(wiring['date']) + "</td>"
						+ "<td class=\"trEdit\" id='"+saveid+"' saveid=\""+saveid+"\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='15%'>rename</td>"
						+ "<td class=\"trDelete\" id='del"+saveid+"'saveid=\""+saveid+"\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='10%'>x</td>"
						+ "</tr>";
					counter++;
				}
			}

			tableAUTO += "</table></div></td></tr>";

			tableAUTO += "</tbody></table>";

			var tables = "<div style=\"width:100%\">" +
				tableOWN +
				tableAUTO +
				"</div><br/>";


			var selectedWiring;

			var buttons = "<button data-inline='true' id='loadButton'>Load</button>" +
				"<button data-inline='true' id='importButton'>Import from JSON</button>";


			var bodyContent = header +
				tables +
				"<p><label for='wfselection' style='font-style: italic'>Selected Workflow:</label><br/><input size='3' maxlength='10' onkeyup='this.setAttribute(\"loadid\", this.value, 0), highlightLoadSelection(this)' loadid='' type='integer' name='wfselection' id='wfselectionInput' /></p>";

			bodyContent += buttons;

			$("#loadDialogContent").html(bodyContent);

			$("#loadButton").on('click', function () {
				// editor.onSaveWiring.call(editor);
				var selection = document.getElementById("wfselectionInput").getAttribute('indexid'); //value;inEl.getAttribute('loadid')
				var selectedIndex = parseInt(selection);// - 1;
				var selectedWiring = wirings[selectedIndex];
				console.log("selectedWiring");
				console.log(selectedWiring);
				var workflow = selectedWiring['wiring'];
				// call actual loading
				editor.tsLoadPipe(workflow);
				$("#loadDialog").dialog('close');


				// this is a hack to show the loading wheel for a while
				//   so that we can update the wires etc. before the user interacts with anything
				setTimeout(function(){
					$.mobile.loading('show');
				}, 1);
				setTimeout(function(){
					$.mobile.loading('hide');
				}, 1500);

			});
			$("#importButton").on('click', function () {

				var workflow = prompt("Please supply a workflow in JSON format.", "");

				if(workflow == null) return;

				try {

					JSON.parse(workflow);
					editor.tsLoadPipe(workflow);
					$("#loadDialog").dialog('close');
				} catch (e) {
					alert("No valid JSON. \n" + e);
				}
			});


			self.adapter.getOwnedSaves(function(ownerIds){
				for (var i = 0; i < saveids.length; i++)
				{
					var id = saveids[i];
					var el = document.getElementById(id);
					var id2 = "del"+saveids[i];
					var el2 = document.getElementById(id2);

					if(commonValue(ownerIds,[id])){
						//if save belongs to user enable editing / delete

						//Event.addListener(el, "mousedown", function(e)
						$(el).on('vmousedown', function(e)
						{
							editor.renderRenameDialog(e.target);
						}, this, true);

//						Event.addListener(el2, "mousedown", function(e)
						$(el).on('vmousedown', function(e)
						{
							deleteSave(e.target);
						}, this, true);
					}else{
						el.style.color = "gray";
						el2.style.color = "gray";
					}
				}
			});

			$("#loadDialog").trigger("create");
			$.mobile.changePage("#loadDialog", {role: "dialog"});

			//btnSpin("WiringEditor-loadButton");
			setTimeout(function(){
				$.mobile.loading('hide');
			}, 1);
		});

	},

	/**
	 * Loading the actual wiring that came from the sqlspaces
	 * @param wiring
	 */
	tsLoadPipe: function (wiring) {
		console.log("tsLoadPipe");
		console.log(wiring);
		wiring = YAHOO.lang.JSON.parse(wiring);

		if (!this.isSaved()) {
			if (!confirm("Warning: Your work is not saved yet ! Press ok to continue anyway.")) {
				return;
			}
		}

//		try {

			this.preventLayerChangedEvent = true;

			// TODO: check if current wiring is saved...
			this.layer.clear();

//			this.propertiesForm.setValue(wiring.properties, false); // the false tells inputEx to NOT fire the updatedEvt

			if (lang.isArray(wiring.modules)) {

				// Containers
				for (i = 0; i < wiring.modules.length; i++) {
					var m = wiring.modules[i];
					if (this.modulesByName[m.name]) {
						var baseContainerConfig = this.modulesByName[m.name].container;
						YAHOO.lang.augmentObject(m.config, baseContainerConfig);
						m.config.title = m.name;
						var container = this.layer.addContainer(m.config);
						Dom.addClass(container.el, "WiringEditor-module-" + m.name);
						container.setValue(m.value);
					}
					else {
						throw new Error("WiringEditor: module '" + m.name + "' not found !");
					}
				}

				// Wires
				if (lang.isArray(wiring.wires)) {
					for (i = 0; i < wiring.wires.length; i++) {
						// On doit chercher dans la liste des terminaux de chacun des modules l'index des terminaux...
						this.layer.addWire(wiring.wires[i]);
					}
				}
			}

			this.markSaved();

			this.preventLayerChangedEvent = false;

//		}
//		catch (ex) {
//			this.alert(ex);
//			if (window.console && YAHOO.lang.isFunction(console.log)) {
//				console.log(ex);
//			}
//		}
	},

	/**
	 * @method renderSavedStatus
	 */
	renderSavedStatus: function () {
//		this.savedStatusEl = WireIt.cn('div', {className: 'savedStatus', title: 'Not saved', id: 'saveIndicator'}, {display: 'none'}, "*");
		this.savedStatusEl = $("#saveIndicator");
	},
	/**
	 * Hide the save indicator
	 */
	markSaved: function () {
//		this.savedStatusEl.style.display = 'none';
		this.savedStatusEl.hide();
	},

	setSavedWfId: function (wfId) {
		// this.savedWfId = wfId;
		this.savedStatusEl.savedWfId = wfId;
		console.log("WfId: " + this.savedStatusEl.savedWfId);
	},

	getSavedWfId: function () {
//            if (this.savedWfId == undefined) {
//		        this.savedWfId = '';
//	        }
//            return this.savedWfId;
		if (this.savedStatusEl.savedWfId == undefined) {
			this.savedStatusEl.savedWfId = '';
		}

		console.log("get WfId " + this.savedStatusEl.savedWfId);
		return this.savedStatusEl.savedWfId;
	},

	/**
	 * Show the save indicator
	 */
	markUnsaved: function () {
		console.log(this.savedStatusEl);
		this.savedStatusEl.css("display", "inline-block");
//		this.savedStatusEl.style.display = '';
//            this.savedWfId = '';
		this.savedStatusEl.savedWfId = '';

		console.log("mark unsaved + WfId ");
	},

	/**
	 * Is saved ?
	 */
	isSaved: function () {
//		return (this.savedStatusEl.style.display == 'none');
		return (this.savedStatusEl.css("display") == 'none');
	},


	onSave: function(e){
		var self = e.data;
		self.renderSaveDialog();
	},

	/**
	 * Render save dialog
	 */
	renderSaveDialog: function () {
		var editor = this;

		var grpDiv = "";
		var grpIds;
		editor.adapter.getUserGroups(function(grps){
			grpIds=grps;
			if(grpIds.length >= 1){
				editor.adapter.getGroupNames(grps, function(grpNames){
					grpDiv+="<div id='userGroupDiv' >";
					for(var i=0;i<grpIds.length;i++){
						grpDiv+="<input disabled checked type='checkbox' class='userGrpsCb' id='"+grpIds[i]+"'>"+grpNames[i]+"</input>";
					}
					grpDiv+="</div>";
					console.log('if');
					build(true);
				});
			}else{
				console.log('else');
				build(false);
			}
		});

		function build(showGrpOpts){

//	             var handleCancel = function () {
//                     this.cancel();
//                 };

			editor.currentWiring = editor.getValue();

			var bodyContents =  "<br /><p style='font-style: italic'>Please enter some workflow information:</p><br />" +
				"<p><label for='wfname'>Workflow Name:</label><br/><input type='text' name='wfname' id='wfnameInput' size='40' /></p><br />" +
				"<p><label for='wfdesc'>Workflow Description:</label><br/><textarea name='wfdesc' id='wfdescInput' cols='40' rows='5'></textarea></p><br /><br />";




//                "<p style='text-align: right'><label for='wfcb'>save as template&nbsp;</label><input type='checkbox' name='wfcb' id='wfcbInput' /></p> +"

			if(showGrpOpts){
				bodyContents +=
					"<p>" +
						"<label style='font-style:italic' for='saveAsPublicCheckbox'>make public?&nbsp;</label><br />" +
						"<input onClick='toggleUserGrpsActive()' type='checkbox' name='saveAsPublicCheckbox' id='saveAsPublicCheckbox' /><br/>" +
						"</p><br/> "
						+ grpDiv + "<br/>"     }

			bodyContents += "<fieldset>";
			bodyContents += "<button data-inline='true' data-theme='b' id='saveDialogOK'>Save</button>";
			bodyContents += "<button data-inline='true' id='saveDialogExport'>Export</button>";
//                bodyContents += "<button id='saveDialogCancel'>Cancel</button>";
			bodyContents += "<fieldset>";


			$("#saveDialogContent").html(bodyContents);

			$("#saveDialogOK").on('click', function () {
				console.log("save");
				editor.onSaveWiring.call(editor);
//                         editor.saveDialog.hide();
			});
			$("#saveDialogExport").on('click', function () {
				editor.onExportWorkflow();
			});
//                $("#saveDialogCancel").on('click', function(){
//                    handleCancel.call(editor);
//                });

//            var isTemplate = document.getElementById("WiringEditor-expertModeButton-button").getAttribute("status");
			var isTemplate = false;
//            if(isTemplate == "active" && isTemplate != null){
//                var editEls = document.getElementsByClassName("editCheckBox");
//                for(var x=0;x<editEls.length;x++){
//                    if(editEls[x].checked==true){
//                        document.getElementById('wfcbInput').checked = true;
//                    }
//                }
//            }

//                $("#anyDialog").addClass("transparent_background");
			$("#saveDialog").trigger('create');
			$.mobile.changePage("#saveDialog");
		}

	},

	/**
	 * onSaveWiring method
	 */
	onSaveWiring: function () {
		var shortname = document.getElementById("wfnameInput").value;
		var description = document.getElementById("wfdescInput").value;

		var saveAsTemplate = false;
//            if (document.getElementById('wfcbInput').checked){
//                saveAsTemplate = true;
//            }

		var saveAsPublic = false;
		var userGrpIds;
		var sharing = "user";
		var publicCheckbox = document.getElementById('saveAsPublicCheckbox');
		if (publicCheckbox!=null && publicCheckbox.checked){
			saveAsPublic = true;
			sharing = "public";
			userGrpIds = getSelectedUserGroups();
		}

		var value;
//		if(saveAsTemplate){
//			value = this.getTemplateValue();
//		}else{

		// if the jquerymobile dialog is in the way we get wrong coordinates for the container
		//   therefore we have to get the wiring before the dialog opens
			value = this.currentWiring; //this.getValue();
//		}
//console.log("wiring value");
//		console.log(value);
		//
//		var tempSavedWiring = {name: value.name, working: value.working, language: this.options.languageName };
		var tempSavedWiring = {name: value.name, working: value.working, language: "SISOB Language" };


		/*
		 * TODO error handling
		 * short names should be unique
		 */

		/*
		 this.adapter.saveWiringNew(tempSavedWiring, {
		 success: this.saveModuleSuccess,
		 failure: this.saveModuleFailure,
		 scope: this
		 }, inputValues);
		 */

		this.adapter.saveWiringExtended(tempSavedWiring, {
			"shortname": shortname,
			"description": description,
			"username": this.loginName,
			"sharing": sharing,
			"groups": userGrpIds,
			"template": saveAsTemplate  // true/false, s.o.
		}, {
			success: this.saveModuleSuccess,
			failure: this.saveModuleFailure,
			scope: this
		});


		$("#saveDialog").dialog("close");
	},
	/**
	 * This method return a wiring within the given vocabulary described by the modules list
	 * @method getValue
	 */
	getValue: function () {

		var i;
		var obj = {modules: [], wires: [], properties: null};
console.log("getValue");
		for (i = 0; i < this.layer.containers.length; i++) {
			obj.modules.push({name: this.layer.containers[i].title, value: this.layer.containers[i].getValue(), config: this.layer.containers[i].getConfig()});
			console.log(this.layer.containers[i].getConfig());
		}

		for (i = 0; i < this.layer.wires.length; i++) {
			var wire = this.layer.wires[i];
			var wireObj = wire.getConfig();
			wireObj.src = {moduleId: WireIt.indexOf(wire.terminal1.container, this.layer.containers), terminal: wire.terminal1.name };
			wireObj.tgt = {moduleId: WireIt.indexOf(wire.terminal2.container, this.layer.containers), terminal: wire.terminal2.name };
			obj.wires.push(wireObj);
		}

		return {
			name: "", // JADO not used anyways
			working: obj
		};
	},

	/**
	 * saveModule success callback
	 * @method saveModuleSuccess
	 */
	saveModuleSuccess: function (o) {

		this.markSaved();
		this.setSavedWfId(o["saveid"]);

		// TODO: call a saveModuleSuccess callback...
	},

	/**
	 * saveModule failure callback
	 * @method saveModuleFailure
	 */
	saveModuleFailure: function (errorStr) {

		//JADO TODO: rewrite alert
		this.alert("Unable to save the wiring : " + errorStr);
	},

	/**
	 * Load earlier results
	 */
	onLoadResults: function (e) {
		var wiringEditor = e.data;

		setTimeout(function(){
			$.mobile.loading('show');
		}, 1);
		wiringEditor.loadResults();
	},

	/**
	 * loading old results
	 */
	loadResults: function () {
		console.log("loadResults");
		// fetch the available (i.e. stored earlier) workflows from the sqlspaces
		var editor = this;
		console.log(editor);
		if (!editor.loadResultsDialogOpen) {
			console.log("resultsDialogNotOpenYet");
			editor.loadResultsDialogOpen = true;
			//stop spinner
			setTimeout(function(){
				$.mobile.loading('show');
			}, 1);

			this.adapter.getLoadableResults(function (results) {
				console.log("getLoadableResults");

				if (results == null) {
					results = [];
				}
				//
				actualTable = 0;
				sortCat = "";

				//Newest first
				results.reverse();

				var height = ((results.length * 15) <= (window.innerHeight / 2)) ? (results.length * 15) : (window.innerHeight / 2);
				// minimal size
				if (height < 60){
					height = 60;
				}

				// create a table for displaying the available stored workflows
				// table properties
				var table = "<br /><table class=\"loadTable\" style=\"cursor:pointer\" border='0' width='100%'>";

				table +=
					// table header properties
					"<tr style='font-weight:bold;border-bottom: 1px solid gray;'>" +
						"<th onclick='sortTable(this)' width='10%'>Index</th>" +
						"<th onclick='sortTable(this)' width='20%'>Name</th>" +
						"<th onclick='sortTable(this)' width='25%'>Description</th>" +
						"<th onclick='sortTable(this)' width='22%'>Date</th>" +
						"<th onclick='sortTable(this)' width='13%'>Edit</th>" +
						"<th onclick='sortTable(this)' width='10%'>Delete</th>" +
						"</tr>" +
						"<tr><td colspan='6'><div style='height:" + height + "px; overflow:auto'>" +
						// new table in main table, for overflow
						"<table border='0' width='100%'>";

				var runids = [];
				// table rows result table (all tuples)
				var counter=0;
				for (var i = 0; i < results.length; i++) {
					var result = results[i];
					runids.push(result.runid);
					// + 3 columns
					// distinguish colored / white line
					var rowStyle = "";
					if(i%2==0){
						rowStyle = "style='background:lightgray'"//#CAE1FF'";
					}
					table +=    "<tr " + rowStyle + " onClick=\"javascript:highlightLoadSelection(this)\" indexid='"+i+"' loadid='" + (counter+1) + "' name='loadSelection'>" +
						"<td  onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='10%' class='trIndex' >" + (i + 1) + "</td>" +
						"<td  id='name"+result.runid+"' onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='20%' class='trName' wf=\""+result.runid+"\">" + result.runname + "</td>" +
						"<td  id='description"+result.runid+"' onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='25%' class='trDescription' wf=\""+result.runid+"\">" + result.rundescription + "</td>" +
						"<td  id='date"+result.runid+"' onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='22%' class='trDate' wf=\""+result.runid+"\">" + parseDate(result.rundate) + "</td>"
						+ "<td class=\"trEdit\" id='edit"+result.runid+"' wf=\""+result.runid+"\" onmouseover=\"javascript:hoverLoadTableEl(this)\" onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='13%'>rename</td>"
						+ "<td class=\"trDelete\" id='del"+result.runid+"'wf='"+result.runid+"' onmouseover='javascript:hoverLoadTableEl(this)' onmouseout=\"javascript:resetHoverLoadTableEl(this)\" width='10%'>x</td>"

					"</tr>";
					counter++;
				}

				table += "</table></div></td></tr>";

				table += "</tbody></table><br/>";

				var selectedWiring;

				var buttons = "<button data-inline='true' id='loadPrevButton'>Load</button>";


				var bodyContent = "<p style='font-style:italic;'>Please select one of the following runs to load its results...</p>" +
					table +
					"<p><label for='wfselection'>Selected run:</label><br/><input size='3' maxlength='10' onkeyup='this.setAttribute(\"loadid\", this.value, 0), highlightLoadSelection(this)' loadid='' type='integer' name='wfselection' id='wfselectionInput' /></p>";


				bodyContent += buttons;

				$("#loadPreviousResultsDialogContent").html(bodyContent);

				$("#loadPreviousResultsDialog").bind("pagehide",function(){
					editor.loadResultsDialogOpen = false;
				});

				$("#loadPrevButton").on('click', function(){
					// editor.onSaveWiring.call(editor);
					var selection = document.getElementById("wfselectionInput").value;
					var selectedIndex = parseInt(selection) - 1;
					var selectedWiring = results[selectedIndex];
					// call actual loading
					editor.loadResult(selectedWiring);
					$("#loadPreviousResultsDialog").dialog("close");
					editor.loadResultsDialogOpen = false;
					$("#right").panel("open");
				});



				editor.adapter.getOwnedRuns(function(ownerIds){
					console.log("getOwnedRuns")
					console.log(ownerIds);

//                    	alert(ownerIds)
					for (var i = 0; i < runids.length; i++)
					{
						var id = "edit"+runids[i];
						var el = document.getElementById(id);
						var id2 = "del"+runids[i];
						var el2 = document.getElementById(id2);

						if(commonValue(ownerIds,[runids[i]])){
							//if save belogs to user enable editing / delete
							Event.addListener(el, "vmousedown", function(e)
							{
								renameResult(e.target);
							}, this, true);

							Event.addListener(el2, "vmousedown", function(e)
							{
								deleteRun(e.target);
							}, this, true);
						}else{
							el.style.color = "gray";
							el2.style.color = "gray";
						}
					}
				});

				$("#loadPreviousResultsDialog").trigger("create");
				$.mobile.changePage("#loadPreviousResultsDialog", {role: "dialog"});

				editor.loadResultsDialogOpen = true;

				//stop spinner
				setTimeout(function(){
					$.mobile.loading('hide');
				}, 1);
			});

		}

	},

	/**
	 * Do the actual loading of some old result
	 * @param runId
	 */
	loadResult: function(info) {
		var editor = this;
		this.adapter.getResult(info, function (resultinfo) {
			// console.log('now I should jump in on ' + JSON.stringify(resultinfo));
			var resultInfo = {
				"runid" : resultinfo.runid,
				"rundate" : resultinfo.rundate,
				"links" : resultinfo.resultlinks,
				"name" : resultinfo.runname,
				"description" : resultinfo.rundescription
			};
			
			editor.displayResults(resultInfo);
			if (resultinfo.wfwiring) {
				editor.tsLoadPipe(resultinfo.wfwiring);
			}
		});
	},

	/**
	 * Call the execution of the wiring
	 */
	onExecute: function (e) {

		$("#right").panel("open");

		var wiringEditor = this;


		if(wiringEditor.layer.containers.length < 1 )
		{
//			console.log("not executing empty workflow");
			$("#infoTexts").prepend("<div class='wf_empty'>Workflow is empty, nothing to execute!</div>");
		}
		else
		{
			// remove warnings but not results
			$("#infoTexts wf_empty").remove();


			for(var i=0;i<wiringEditor.layer.containers.length;++i)
			{
				wiringEditor.layer.containers[i].colorContainerDefault();
			}


			wiringEditor.execute();
		}
	},

	/**
	 * Execute the current module
	 */
	execute: function () {

		var self = this;

		// run ID of current execution
		var runId = calculateWorkflowID();

		var value = this.getValue();

		console.log("execute:");
		console.log(value);

		self.tempSavedWiring = {name: value.name, working: value.working, language: "SISOB Language" };
		console.log(self.tempSavedWiring);

		var sendExecutionRequest = function () {
			self.adapter.executeWiring(
				runId,
				self.tempSavedWiring,
				{
					"saveid": self.getSavedWfId(),
					"username": self.loginName
				},
				{
					agent: function (data) {
						self.gotAgentRunStatusChange(data);
					},
					run: function (data) {
						self.gotRunStatusChange(data);
					},
					scope: self
				},
				{
					success: self.executeModuleSuccess, // TODO
					failure: self.executeModuleFailure, // TODO
					scope: self
				});
		};

		self.startSpinner(runId);

		// automatic saving of the current wiring
		if (self.getSavedWfId() == '') {
			self.adapter.saveWiringExtended(this.tempSavedWiring, {
				"shortname": "autosave",
				"description": "Automatically saved on " + new Date().toLocaleString() + ".",
				"username": this.loginName,
				"sharing": "user"
			}, {
				success: function (param) {
					console.log("autosaved with id " + param["saveid"]);
					self.setSavedWfId(param["saveid"]);
					sendExecutionRequest();
				},
				failure: self.executeModuleFailure, // TODO
				scope: self
			});
		} else if (self.getSavedWfId()) {
			sendExecutionRequest();
		}
	},

	executeModuleSuccess: function (params) {
		// TODO
		// this.startMonitoring(params["runid"]);
	},

	executeModuleFailure: function () {
		// TODO
	},
	//Agent
	gotAgentRunStatusChange: function(data) {

		var monitored = false;

		// we are currently monitoring this wf
		for (var i = 0; !monitored && i < this.currentRunIds.length; i++) {
			if (this.currentRunIds[i] == data.runid) {
				monitored = true;
			}
		}

		if (monitored) {

			console.log('is monitored')

			// this.currentRunProgress is set to 0 in startSpinner
			console.log(this.currentRunProgress);



			// find container matching agent instance and give it a colored border according to agent state
			var containerToHandle = this.getContainerByAgentInstanceId(data.instanceid);

			if (containerToHandle) {

				if(!this.highlighted){
					this.highlighted=true;
				}

				console.log('trying to color for ' + data.status);


				switch (data.status){
					//waiting
					case (1):
						if (containerToHandle.colorContainerWaiting) {
							containerToHandle.colorContainerWaiting();
						} else {
							containerToHandle.grey();
						}
						break;
					//working
					case (2):
						if (containerToHandle.colorContainerWorking) {
							containerToHandle.colorContainerWorking();
						} else {
							containerToHandle.yellow();
						}
						break;
					//finished
					case (3):
						this.currentRunProgress++;

						if (containerToHandle.colorContainerDone) {
							containerToHandle.colorContainerDone();
						} else {
							containerToHandle.green();
						}
						break;
					//error
					case (5):
						this.currentRunProgress++;

						if (containerToHandle.colorContainerError) {
							containerToHandle.colorContainerError();
						} else {
							containerToHandle.red();
						}
						break;
				}
			}

			document.getElementById("spinnerText").innerHTML = "... ("+ this.currentRunProgress + "/"+this.currentRunSteps+")";

		}

	},

	/**
	 * get corresponding gui element for an agent instance
	 * @param inID String consisting of posX + posY + firstLetter and last letter of the agentsname
	 * @return {*} returns the container matching the agent id
	 */
	getContainerByAgentInstanceId: function(inID){

		var agentContainerPos = inID.substr(0,inID.length-2);

		for (var i = 0; i < this.layer.containers.length; i++) {
			//var containerPosX = this.layer.containers[i].getXY()[0];
			//var containerPosY= this.layer.containers[i].getXY()[1];
			var containerPos = this.layer.containers[i].getXY().toString().replace(",","");//containerPosX.toString() + containerPosY.toString();

			if (containerPos == agentContainerPos){
				//  alert("match");
				return this.layer.containers[i];
			}
		}
	},

	startSpinner: function(runId) {

		if (!this.currentRunIds) {
			this.currentRunIds = [];
		}

		var startSpinner = false;

		if (this.currentRunIds.length == 0) {
			startSpinner = true;
		}

//            this.currentRunIds.push({"runid" : runId, "cbid" : callbackId});
		this.currentRunIds.push(runId);


		this.currentRunSteps = this.layer.containers.length;
		this.currentRunProgress = 0;


		if (startSpinner) {
			var spinner = new Spinner({
				lines: 15, // The number of lines to draw
				length: 1, // The length of each line
				width: 4, // The line thickness
				radius: 9, // The radius of the inner circle
				rotate: 0, // The rotation offset
				color: '#000', // #rgb or #rrggbb
				speed: 1.1, // Rounds per second
				trail: 60, // Afterglow percentage
				shadow: false, // Whether to render a shadow
				hwaccel: true, // Whether to use hardware acceleration
				className: 'spinner', // The CSS class to assign to the spinner
				zIndex: 2e9, // The z-index (defaults to 2000000000)
				top: '0', // Top position relative to parent in px
				left: '0' // Left position relative to parent in px
			}).spin(document.getElementById("spinnerGraphics"));

			document.getElementById("spinnerText").innerHTML = "Executing...";
		}
	},

	gotRunStatusChange: function(data) {

		//alert("run status changed: " + data.status)

		var index = -1;

		// we are currently monitoring this wf
		for (var i = 0; index < 0 && i < this.currentRunIds.length; i++) {
			if (this.currentRunIds[i] == data.runid) {
				index = i;
			}
		}

		if (index > -1) {
			if (Number(data.status) == 3 || Number(data.status) == 5) {
				// remove ID from the list of monitored ids
				this.currentRunIds.splice(index, 1);

				// handle results or errors depending on state
				if (Number(data.status) == 3) {
					this.handleResults(data.runid, data.rundate);
				} else {
					this.handleErrorResults(data.runid, data.rundate);
				}

				// remove spinner of no more workflows currently monitored
				if (this.currentRunIds.length == 0) {
					document.getElementById("spinnerGraphics").removeChild(document.getElementById("spinnerGraphics").firstChild);
					document.getElementById("spinnerText").innerHTML = "";
				}

			}
		}
	},

	handleResults: function (runId, runDate) {
		var self = this;
		var callbacks = {
			success : function(results) {
				if (results) {
					var links = [];
					for (var i = 0; i < results.length; i++) {
						links.push(results[i].resultinfo);
					}
					var resultInfo = {
						"runid" : runId,
						"rundate" : runDate,
						"links" : links
					};
					this.displayResults(resultInfo);

				} else {
					// TODO: handle no results; does not make sense yet...
				}
			},
			scope : this
		};
		this.adapter.getResults(runId, callbacks);
	},

	displayResults: function (resultInfo) {
		var htmlArray = [];
		htmlArray.push("<div class='Workbench-result' id='run" + resultInfo.runid + "'>");
		htmlArray.push('<span>');

		htmlArray.push("Result for analysis run");
		if (resultInfo.name && resultInfo.description) {
			htmlArray.push(" <div class=\"nameResult\" id=\""+ resultInfo.runid +"\">" + resultInfo.name + "</div>");
			htmlArray.push(" <div class=\"descriptionResult\">"+ resultInfo.description +"</div>");
		} else {
			htmlArray.push(" <div class=\"nameResult\" id=\""+ resultInfo.runid +"\"></div>");
			htmlArray.push(" <div class=\"descriptionResult\"></div>");
		}
		htmlArray.push(" executed on ");
		htmlArray.push(parseDate(resultInfo.rundate));
		htmlArray.push(" <div class=\"renameResult\" wf='"+ resultInfo.runid +"' onclick=\"renameResult(this)\">rename</div>");
		htmlArray.push(" / ");
		htmlArray.push(" <div class=\"discardResult\" wf='"+ resultInfo.runid +"' onclick=\"deleteRun(this)\">discard</div>");

		htmlArray.push("<ul>");
		for (var i = 0; i < resultInfo.links.length; i++) {
			htmlArray.push("<li style='margin-top: 10px;'><a data-role='button' data-theme='b' data-mini='true' data-icon='forward' href=\"" + resultInfo.links[i] + "\" target=\"_blank\">Result link</a></li>");
		}
		htmlArray.push("</ul>");
		htmlArray.push('</span>');
		htmlArray.push('</div>');
		// add new results on top
		var infoText = [htmlArray.join("")];
		infoText.push(document.getElementById("infoTexts").innerHTML);
		document.getElementById("infoTexts").innerHTML = infoText.join("");

		$("#infoTexts").trigger("create");
	},

	handleErrorResults: function(runId, runDate) {
		var self = this;
		var callbacks = {
			success : function(errors) {
				var errorMessages = [];
				for (var i = 0; i < errors.length; i++) {
					errorMessages.push({
						"component" : errors[i].agentid,
						"instance" : errors[i].instanceid,
						"message" : errors[i].errormessage
					});
				}
				this.displayErrorResults(runId, runDate, errorMessages);
			},
			scope : this
		};
		this.adapter.getErrorResults(runId, callbacks);
	},

	displayErrorResults: function(runId, runDate, errorMessages) {
		var htmlArray = [];
		htmlArray.push('<div class="Workbench-result">')
		htmlArray.push('<span>');
		htmlArray.push("Workflow executed on ");
//            htmlArray.push(runId);
		htmlArray.push(parseDate(runDate));
		htmlArray.push(" stopped with errors:");
		htmlArray.push("<ul>");
		for (var i = 0; i < errorMessages.length; i++) {
			htmlArray.push("<li>" + errorMessages[i]["component"] + " : " + errorMessages[i]["instance"] + " : " + errorMessages[i]["message"] + "</li>");
		}
		htmlArray.push("</ul>");
		htmlArray.push('</span>');
		htmlArray.push('</div>');
		// add new results on top
		var infoText = [htmlArray.join("")];
		infoText.push(document.getElementById("infoTexts").innerHTML);
		document.getElementById("infoTexts").innerHTML = infoText.join("");
	},

	/**
	 * Leave the session
	 */
	onLogout: function (e) {
		var wiringEditor = e.data;
		wiringEditor.logout();
	},

	/**
	 * Log out of the current session
	 */
	logout: function () {
		SC.socket.emit('logout');
	},

	onExportWorkflow: function () {

		var wiring;
//            if (document.getElementById('WiringEditor-expertModeButton-button').getAttribute('status') == "active"){
//                wiring = this.getTemplateValue();
//            }
//            else{
//                wiring = this.getValue();
//            }
		wiring = this.currentWiring; //this.getValue();

		var exportString = YAHOO.lang.JSON.stringify(wiring.working);

		alert(exportString);
	},
};













///////////////////////////////////////// COLLIDE CODE??? //////////

function checkProperties(obj){
	for(var prop in obj){
		console.log(prop + ': ' + obj[prop]);
	}
}
var loadResultDialogOpen = false;
//////////// rename Workflow / Result /////////////
function renameResult(el) {

	var params = {
	};
	var oldName = "";
	var oldDescription = "";

	//rename in "load results"
	if(loadResultDialogOpen){
		params.id = el.getAttribute("wf");
		oldName = el.parentNode.getElementsByClassName("trName")[0].innerHTML;
		oldDescription = el.parentNode.getElementsByClassName("trDescription")[0].innerHTML;
	}else{
		//rename in right "results"
		params.id = el.parentNode.getElementsByClassName("nameResult")[0].id;
		oldName = el.parentNode.getElementsByClassName("nameResult")[0].innerHTML;
		oldDescription = el.parentNode.getElementsByClassName("descriptionResult")[0].innerHTML;
	}

	var grpDiv = "";
	var grpIds;
	WireIt.adapters.NodeConnector.getUserGroups(function(grps){
		grpIds=grps;
		if(grpIds.length >= 1){
			WireIt.adapters.NodeConnector.getGroupNames(grps, function(grpNames){
				grpDiv+="<div id='userGroupDiv' >";
				for(var i=0;i<grpIds.length;i++){
					grpDiv+="<input disabled checked type='checkbox' class='userGrpsCb' id='"+grpIds[i]+"'>"+grpNames[i]+"</input>";
				}
				grpDiv+="</div>";
				build();
			});
		}else{
			build();

		}
	});

	function build(){

		this.renameDialog = new YAHOO.widget.Dialog('WiringEditor-saveDialog', {
			fixedcenter: true,
			draggable: true,
			width: '500px',
			visible: false,
			modal: true
		});

		var renameDialogButtons = [
			{
				text: "Ok",
				handler: function () {
					// renameAutosave(inEl);
					params.name = document.getElementById("wfnameInput").value;
					params.description = document.getElementById("wfdescInput").value;
					if (params.name != oldName || params.description != oldDescription) {
						renameRun(params);
					}
					this.cancel();
				}
			}, {
				text: "Cancel",
				handler: function() {
					this.cancel();
				}
			}
		];

		var displayName = "new name";
		var displayDescription = "new description";

		if (oldName.trim() != "") {
			displayName = oldName;
		}
		if (oldDescription.trim() != "") {
			displayDescription = oldDescription;
		}

		this.renameDialog.cfg.queueProperty("buttons", renameDialogButtons);
		this.renameDialog.setHeader("Rename Run...");
		this.renameDialog.setBody("<br /><p style='font-style: italic'>Please enter some run information:</p><br />" +
			// "<p><label for='wfname'>Workflow Name:</label><br/><input type='text' name='wfname' id='wfnameInput' size='40' value='"+inEl.parentNode.getElementsByClassName("trName")[0].innerHTML+"' /></p><br />" +
			// "<p><label for='wfdesc'>Workflow Description:</label><br/><textarea name='wfdesc' id='wfdescInput' cols='40' rows='5'>"+inEl.parentNode.getElementsByClassName("trDescription")[0].innerHTML+"</textarea></p>"
			"<p><label for='wfname'>Run Name:</label><br/><input type='text' name='wfname' id='wfnameInput' size='40' value='" + displayName + "' /></p><br />" +
			"<p><label for='wfdesc'>Run Description:</label><br/><textarea name='wfdesc' id='wfdescInput' cols='40' rows='5'>" + displayDescription + "</textarea></p>"
			+

			"<br/><br/><label style='font-style:italic' for='saveAsPublicCheckbox'>make public?&nbsp;</label><br />" +
			"<input onClick='toggleUserGrpsActive()' type='checkbox' name='saveAsPublicCheckbox' id='saveAsPublicCheckbox' /><br/>" +
			"</p><br/> "
			+ grpDiv + "<br/>"
		);

		this.renameDialog.postmethod = "none";
		this.renameDialog.render(document.body);

		this.renameDialog.show();

		function renameRun(params) {
			if(document.getElementById('saveAsPublicCheckbox').checked){
				params.ifPublic = true;
				params.groups = getSelectedUserGroups();
			}
			WireIt.adapters.NodeConnector.renameRun(params, function(response) {
				var id = response.id;
				//change in load-list
				if(loadResultDialogOpen){
					document.getElementById('name'+id).innerHTML = response.name;
					document.getElementById('description'+id).innerHTML = response.description;
				}
				//change in left result-list
				if(document.getElementById(response.id)!=null){
					var newNameDiv = document.createElement("div");
					var nameDiv = document.getElementById(id);
					newNameDiv.innerHTML = response.name + "&nbsp;";
					newNameDiv.id = nameDiv.id;
					newNameDiv.description = nameDiv.description;
					newNameDiv.className = nameDiv.className;
					nameDiv.parentNode.replaceChild(newNameDiv, nameDiv);

					var descriptionDiv = document.getElementById(response.id).parentNode.getElementsByClassName("descriptionResult")[0];
					var newdescriptionDiv = document.createElement("div");
					newdescriptionDiv.innerHTML = response.description + "&nbsp;";
					newdescriptionDiv.className = descriptionDiv.className;
					descriptionDiv.parentNode.replaceChild(newdescriptionDiv, descriptionDiv);
				}
			});
		}
	}


}

function renameAutosave(el) {
	var params = {};
	params.id = el.getAttribute("saveid");
	params.name = document.getElementById("wfnameInput").value;//window.prompt("enter new name: ");
	params.description = document.getElementById("wfdescInput").value;//window.prompt("enter new description: ");

	if(document.getElementById('saveAsPublicCheckbox').checked){
		params.ifPublic = true;
		params.groups = getSelectedUserGroups();
	}

	if(params.id && params.name && params.description) {
		WireIt.adapters.NodeConnector.renameAutosave(params, function(response) {
			var el = document.getElementById(response.id).parentNode;
			var nameEl = el.getElementsByClassName("trName")[0];
			var descriptionEl = el.getElementsByClassName("trDescription")[0];
			nameEl.innerHTML = response.name;
			descriptionEl.innerHTML = response.description;
		});
	}


}

///////////////DIALOG COLORS///////////////
//Table
var listColorTRbg1 = "lightgray";
var listColorTRbg2 = "";
var listColorTRfont = "black";

var listColorTRactiveBg = "darkblue";//active selection
var listColorTRactiveFont = "white";

var listColorTRbgActive = "#CAE1FF";//hover
var listColorTRfontActive = "black";

var listColorTH = "black";
var listColorTHactive = "darkblue";
//Buttons
var switchBTNborder = "2px solid lightgray";
var switchBTNborderActive = "2px solid gray";
//////////////////////////////////////////


function highlightLoadSelection(inEl){
	//gewaehlter Index
	var loadId = parseInt(inEl.getAttribute('loadid'));

	var indexid = inEl.getAttribute('indexid');
	document.getElementById('wfselectionInput').setAttribute("indexid", indexid, 0);

	var selections = inEl.parentNode.childNodes;//getElementsByName('loadSelection'); //aus mgl. elementen
	if(inEl.getAttribute("id") == "wfselectionInput"){
		selections = inEl.parentNode.parentNode.getElementsByClassName("loadTable")[actualTable].getElementsByTagName("tbody")[0].getElementsByTagName("tbody")[0].childNodes;
	}
	actualTableEls = selections;
	var maxlength = selections.length; //und deren anzahl
	//index speichern , zum sp??teren abmarkieren
	if(!this.lastLoadIndex){
		this.lastLoadIndex = -1;
	}
	//nur fuer gueltigen index
	if (loadId <= maxlength && loadId >= 0){
		//alten index abmarkieren
		var listItemToHandle;
		for (var i = 0; i< maxlength; i++){
			if (parseInt(selections[i].getAttribute('loadid'))==parseInt(this.lastLoadIndex)){
				listItemToHandle = selections[i];
				listItemToHandle.style.color=listColorTRfont;
				if(i%2==0){
					listItemToHandle.style.background = listColorTRbg1;
				}else{
					listItemToHandle.style.background = listColorTRbg2;
				}

			}
		}
		//neuen Index markieren
		this.lastLoadIndex = loadId;
		for (var i = 0; i< maxlength; i++){
			if (parseInt(selections[i].getAttribute('loadid'))==this.lastLoadIndex){
				listItemToHandle = selections[i];
			}
		}
		//gew??hlten index anzeigen und sichern
		document.getElementById('wfselectionInput').value = loadId;
		//gew??hlten index fokussieren
		listItemToHandle.style.background=listColorTRactiveBg;//'#CAE1FF';
		listItemToHandle.style.color=listColorTRactiveFont;
		rowStyleTmp[0] = listItemToHandle.style.color;
		rowStyleTmp[1] = listItemToHandle.style.background;

	}
	//aktuelle Auswahl loeschen
	else{
		//alten index abmarkieren
		var listItemToHandle;
		for (var i = 0; i< maxlength; i++){
			if (parseInt(selections[i].getAttribute('loadid'))==parseInt(this.lastLoadIndex)){
				listItemToHandle = selections[i];
				listItemToHandle.style.color=listColorTRfont;
				if(i%2==0){
					listItemToHandle.style.background = listColorTRbg1;
				}else{
					listItemToHandle.style.background = listColorTRbg2;
				}

			}
		}
	}
}

var actualTable = 0;
var actualTableEls;
function changeTable(int){
	document.getElementById('wfselectionInput').value = "";
	try{
		colorTableList(actualTableEls);
	}
	catch(e){}
	actualTable = int;
	var els = document.getElementsByClassName("tableSwitchBtn");
	for (var i = 0; i < els.length; i++){
		els[i].style.border = switchBTNborder;
	}
	els[int].style.border = switchBTNborderActive;

	var tbls = document.getElementsByClassName("loadTable");
	for(var i = 0; i < tbls.length; i++){
		tbls[i].style.display = "none";
		if(i == int){tbls[i].style.display = "";}
	}
}

function calculateWorkflowID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}


function parseDate (dateString) {
	var year = Number(dateString.substring(0,4));
	var month = Number(dateString.substring(4,6)) - 1;
	var day = Number(dateString.substring(6,8));
	var hours = Number(dateString.substring(8,10));
	var minutes = Number(dateString.substring(10,12));
	var seconds = Number(dateString.substring(12,14));
	var date = new Date();
	date.setUTCFullYear(year);
	date.setUTCMonth(month);
	date.setUTCDate(day);
	date.setUTCHours(hours);
	date.setUTCMinutes(minutes);
	date.setUTCSeconds(seconds);
	return date;
}

//////////////////////TOOLTIP/////////////////////////////
var ttTimer = null;

var rowStyleTmp = [];
rowStyleTmp[0] = "";
rowStyleTmp[1] = "";

function hoverLoadTableEl(inEl){
	if(inEl!=undefined&&inEl!=null) {
		//	optics
		rowStyleTmp[0] = inEl.parentNode.style.color;
		rowStyleTmp[1] = inEl.parentNode.style.background;
		inEl.parentNode.style.color = listColorTRfontActive;
		inEl.parentNode.style.background = listColorTRbgActive;
		// 	tooltip
		var text = inEl.innerHTML;
		tooltipHover(inEl, text);
	}
}

function tooltipHover(inEl, text) {
	if(inEl!=undefined&&inEl!=null) {
		if(!tooltipDisplayed) {
			//start Timer
			ttTimer = setTimeout("createDescriptionTooltip(\"" + escape(text) + "\")",500);
			//track mouse pos
			YAHOO.util.Event.addListener(inEl, 'mousemove', function(e){
				cX = YAHOO.util.Event.getXY(e)[0];
				cY = YAHOO.util.Event.getXY(e)[1];
			}, this, true);
		}
	}
}

function resetHoverLoadTableEl(inEl) {
	// font back to normal
	if(inEl!=undefined&&inEl!=null) {
		inEl.parentNode.style.color = rowStyleTmp[0];
		inEl.parentNode.style.background = rowStyleTmp[1];
	}

	tooltipHoverReset(inEl);
}

function tooltipHoverReset(inEl) {
	if(inEl!=undefined&&inEl!=null) {
		clearTimeout(ttTimer);
		// reset functiontimer
		if(ttTimer!=null) {
			ttTimer=null;
		}
		// delete Tooltip
		if(document.getElementById("loadTableDescriptionTooltip")) {
			document.getElementsByTagName("body")[0].removeChild(document.getElementById("loadTableDescriptionTooltip"));
		}
		tooltipDisplayed = false;
	}
}

var cX = 0;
var cY = 0;

var tooltipDisplayed = false;

function createDescriptionTooltip(text){
	if(ttTimer!=null){
		ttTimer=null;
	}
	if(document.getElementById("loadTableDescriptionTooltip")){
		document.getElementsByTagName("body")[0].removeChild(document.getElementById("loadTableDescriptionTooltip"));
	}
	//create new text node
	var tooltip=document.createElement("div");
	tooltip.id="loadTableDescriptionTooltip";
	tooltip.style.opacity = "0";
	tooltip.style.color = "black";
	tooltip.style.background = "white";
	tooltip.style.left = (cX + 10) + "px";
	tooltip.style.top = (cY + 10) + "px";

	var node=document.createTextNode(unescape(text));
	tooltip.appendChild(node);
	document.getElementsByTagName("body")[0].appendChild(tooltip);
	tooltipDisplayed = true;
	fade("loadTableDescriptionTooltip");
}
////////////////////////////////////////////////////

var sortCat = "";

function sortTable(inTableHeaderEl){
	document.getElementById('wfselectionInput').value = "";

	var key = inTableHeaderEl.innerHTML; //th-value as selector
	var table = inTableHeaderEl.parentNode.parentNode.getElementsByTagName("tbody")[0];
	var className = "tr"+key;

	var elementsToSort = table.getElementsByClassName(className);
	var sorted = new Array(elementsToSort.length);

	if(sortCat == key){
		for(var i=0;i<elementsToSort.length; i++){
			var tr = elementsToSort[i].parentNode;
			sorted[((sorted.length-i)-1)] = tr;
		}
	}

	if(sortCat != key){

		var numericSort = checkifnumbers(elementsToSort);

		//for all items
		for(var i=0;i<elementsToSort.length; i++){
			var tr = elementsToSort[i].parentNode;
			var td = elementsToSort[i];

			//get right place
			for(var j=0; j<sorted.length; j++){

				if(numericSort){
					//if "occupied"
					if(sorted[j] && parseFloat(sorted[j].getElementsByClassName(className)[0].innerHTML) > parseFloat(td.innerHTML)){
						//"get space"
						for (k=(sorted.length-1); k > j; k--){
							sorted[k] = sorted[k-1];
						}
						//row in
						sorted[j] = tr;
						break;
					}
				}

				if(!numericSort){
					//if "occupied"
					if(sorted[j] && sorted[j].getElementsByClassName(className)[0].innerHTML > td.innerHTML){
						//"get space"
						for (k=(sorted.length-1); k > j; k--){
							sorted[k] = sorted[k-1];
						}
						//row in
						sorted[j] = tr;
						break;
					}
				}

				//if "empty"
				if(!sorted[j]){
					//row in
					sorted[j] = tr;
					break;
				}
			}
		}
	}

	//"refresh" table
	while(table.childNodes.length > 0){
		table.removeChild(table.childNodes[0]);
	}
	for(var i=0; i<sorted.length; i++){
		/*console.log(i+" : "+sorted[i] +" : " + sorted[i].getElementsByClassName(key)[0].innerHTML);*/
		table.appendChild(sorted[i]);
	}

	//col
	ths = inTableHeaderEl.parentNode.childNodes;
	for(var m = 0; m < ths.length; m++){
		ths[m].style.color = listColorTH;
	}
	inTableHeaderEl.style.color = listColorTHactive;

	sortCat = key;
	colorTableList(table.childNodes);
}


function colorTableList(inArray){
	for(var i = 0; i < inArray.length; i++){
		inArray[i].style.color=listColorTRfont;
		if(i%2==0){
			inArray[i].style.background = listColorTRbg1;
		}else{
			inArray[i].style.background = listColorTRbg2;
		}
	}
}

function checkifnumbers(inEls){
	for (var i = 0; i < inEls.length; i++){
		if(!parseInt(inEls[i].innerHTML[0])&&inEls[i].innerHTML[0]!="0"){
			//alert("string");
			if(inEls[i].innerHTML[0]!="."){
				return false;
			}
			if(inEls[i].innerHTML[0]=="."){
				if(!parseFloat(inEls[i].innerHTML)){
					return false;
				}
			}
		}
	}
	//alert("number");
	return true;
}

function parseDate (dateString) {
	var year = Number(dateString.substring(0,4));
	var month = Number(dateString.substring(4,6)) - 1;
	var day = Number(dateString.substring(6,8));
	var hours = Number(dateString.substring(8,10));
	var minutes = Number(dateString.substring(10,12));
	var seconds = Number(dateString.substring(12,14));
	var date = new Date();
	date.setUTCFullYear(year);
	date.setUTCMonth(month);
	date.setUTCDate(day);
	date.setUTCHours(hours);
	date.setUTCMinutes(minutes);
	date.setUTCSeconds(seconds);
	return date;
}

/////// Fade ///////////
var TimeToFade = 400.0;

function fade(eid) {
	var element = document.getElementById(eid);

	if(element == null)
		return;

	if(element.FadeState == null) {
		if(element.style.opacity == null || element.style.opacity == '' || element.style.opacity == '1') {
			element.FadeState = 2;
		} else {
			element.FadeState = -2;
		}
	}

	if(element.FadeState == 1 || element.FadeState == -1) {
		element.FadeState = element.FadeState == 1 ? -1 : 1;
		element.FadeTimeLeft = TimeToFade - element.FadeTimeLeft;
	} else {
		element.FadeState = element.FadeState == 2 ? -1 : 1;
		element.FadeTimeLeft = TimeToFade;
		setTimeout("animateFade(" + new Date().getTime() + ",'" + eid + "')", 33);
	}
}

function animateFade(lastTick, eid) {
	var curTick = new Date().getTime();
	var elapsedTicks = curTick - lastTick;

	var element = document.getElementById(eid);

	if(element) {
		if(element.FadeTimeLeft <= elapsedTicks) {
			element.style.opacity = element.FadeState == 1 ? '1' : '0';
			element.style.filter = 'alpha(opacity = '
				+ (element.FadeState == 1 ? '100' : '0') + ')';
			element.FadeState = element.FadeState == 1 ? 2 : -2;
			return;
		}

		element.FadeTimeLeft -= elapsedTicks;
		var newOpVal = element.FadeTimeLeft / TimeToFade;
		if(element.FadeState == 1)
			newOpVal = 1 - newOpVal;

		element.style.opacity = newOpVal;
		element.style.filter = 'alpha(opacity = ' + (newOpVal*100) + ')';

		setTimeout("animateFade(" + curTick + ",'" + eid + "')", 33);
	}
}

/**
 * @method: toggles a spinner-graphic for a button
 * @param btnId {String}: the ID of the button to select
 */
function btnSpin(btnId){

	//the btn is a div in a div
	//parent
	var el = document.getElementById(btnId);
	//button
	var btn = document.getElementById(btnId+"-button");

	if(!el.spinning){
		el.spinning = true;
		this.btnBG = btn.style.background; //save original bg
		btn.style.background = "transparent";
		spin(el);
	}
	else{
		el.spinning = false;
		stopSpinner();
		btn.style.background = this.btnBG;
	}

	function spin(elem){
		if(!this.spinner2){
			this.spinner2 = new Spinner({
				lines: 15, // The number of lines to draw
				length: 1, // The length of each line
				width: 3, // The line thickness
				radius: 8, // The radius of the inner circle
				rotate: 0, // The rotation offset
				color: '#333333', // #rgb or #rrggbb
				speed: 2, // Rounds per second
				trail: 60, // Afterglow percentage
				shadow: false, // Whether to render a shadow
				hwaccel: true, // Whether to use hardware acceleration
				className: 'spinner2', // The CSS class to assign to the spinner
				zIndex: 2e9, // The z-index (defaults to 2000000000)
				top: '0', // Top position relative to parent in px
				left: '0' // Left position relative to parent in px
			});
		}
		this.spinner2.spin(elem);
	}

	function stopSpinner(){
		this.spinner2.stop();
	}
}

function toggleUserGrpsActive(){
	var cbs = document.getElementsByClassName('userGrpsCb');
	if(cbs.length > 0){
		if(cbs[0].disabled){
			for(var i = 0; i<cbs.length;i++){
				cbs[i].disabled = false;
			}
		}else{
			for(var i = 0; i<cbs.length;i++){
				cbs[i].disabled = true;
			}
		}
	}
}

function getSelectedUserGroups(){
	var cbs = document.getElementsByClassName('userGrpsCb');
	var grps=[];
	if(cbs.length > 0){
		for(var i = 0; i<cbs.length;i++){
			if(cbs[i].checked){
				grps.push(cbs[i].id);
			}
		}
	}
	return grps;
}

function deleteSave(el){
	var id = el.getAttribute("saveid");
	var params = {};
	params.saveId = id;

	WireIt.adapters.NodeConnector.getRunNamesForSave(id, function(names){
		var msg = "Do you really wish to delete this save?:\n" + el.parentNode.getElementsByClassName("trName")[0].innerHTML;
		if(names.length>0){
			msg+="and all corresponding runs:";
			msg+=names.toString();
		}
		var sure = window.confirm(msg);
		if(params.saveId!=null&&params.saveId!=undefined&&sure){
			WireIt.adapters.NodeConnector.deleteSave(params, function(response) {
				if(response.ok){
					var tr = document.getElementById('del'+response.saveId).parentNode;
					var tableBody = tr.parentNode;
					tableBody.removeChild(tr);
					colorTableList(tableBody.childNodes);
				}
			});
		}
	});

}

function deleteRun(el){
	var params = {};
	params.runId = el.getAttribute("wf");
	var sure = window.confirm("Do you really wish to delete this run?");
	if(params.runId!=null&&params.runId!=undefined&&sure){
		WireIt.adapters.NodeConnector.deleteRun(params, function(response) {
			if(response.ok){
				var td = document.getElementById('del'+response.runId);
				if(td!=null){
					var tr = td.parentNode;
					var tableBody = tr.parentNode;
					tableBody.removeChild(tr);
					colorTableList(tableBody.childNodes);
				}
				var infoLink = document.getElementById('run'+response.runId);
				if(infoLink!=null){
					infoLink.parentNode.removeChild(infoLink);
				}
			}
		});
	}

}

var commonValue = function(inArray1, inArray2)
{
	if(typeof(inArray1) != "object"||typeof(inArray2) != "object"){
		return false;
	}

	var array2 = inArray2;
//	console.log("comparing " + this + " (" +this.length+ ") to " + inArray + " (" +inArray.length + ")");

	for (var x = 0; x < inArray1.length; x++)
	{
		for (var j = 0; j < array2.length; j++){
			if (inArray1[x] == array2[j]){
				return true;
			}
		}
	}
	return false;
}

adminBtnReady = false;