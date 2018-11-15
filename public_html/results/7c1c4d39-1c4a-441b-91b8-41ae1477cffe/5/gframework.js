/**
 * @author alfredo ramos, henrik detjen
 */
var framework = new VisualizationFramework();
var engine = new VisualizationEngine(framework);

function executeVisualization() {
	
	visualize('0.json');
}

function visualize(datafile) {
	d3.json(datafile,function(jsonfile) {
        if (framework.initialize(jsonfile)) {
		    	engine.initialize();
							engine.start(function() {
								framework.afterEngineStarted();
							});
						} else {
							alert('Unable to initialize the visualization due to a problem in the input data.')
						}
					});
}

// JavaScript library for manipulating the user interface
function VisualizationFramework(params) {
	/**
	 * GUI related Options
	 */
	// state flags
	var frameworkInitialized = false;
	var toolbarInitialized = false;
	var sidePanelOpen = false;
	
	// the svg canvas
	var canvas;
	// canvas dimensions
	var canvasWidth = 1280;
	var canvasHeight = 720;
	
	// the node notation
	var nodeNotation = '.node';
	// the edge notation
	var edgeNotation = '.edge';
	// the label notation
	var labelNotation = '.label';
	
	// the node set
	var nodeset;
	// the edge set
	var edgeset;

	// measures
	var nodeMeasures;
    var edgeMeasures;

    //properties
    var nodeproperties;
    var edgeproperties;

	
	
	/**
	 * Node Attributes ( = merged properties and measures )
	 * 
	 * measure: { "title":"Degree
	 * Centrality","description":"none","class":"node","property":"dc","type":"double" }
	 * property: { "weight":["string"] }
	 * 
	 * properties are merged into measure format!
	 * 
	 */
	var nodeAttributes;
	function initNodeAttibutes() { // called in initialize()
		if (nodeproperties == undefined) {
			nodeproperties = [];
		}
		nodeAttributes = [];
		for ( var i = 0; i < nodeproperties.length; i++) {
			var nodeProperty = nodeproperties[i];
			var title = nodeProperty.property;
			if (nodeProperty.title) {
				title = nodeProperty.title;
			}
			var attribute = {
				title : title,
				description : "none",
				class : "node",
				property : nodeProperty.property,
				type : nodeProperty.parsingtype
			};
			nodeAttributes.push(attribute);
		}
	}

	/** Edge Attributes ( = merged properties and measures ) - same as nodes * */
	var edgeAttributes;
	function initEdgeAttibutes() { // called in initialize()
		if (edgeproperties == undefined) {
			edgeproperties = [];
		}
		edgeAttributes = [];
		for ( var i = 0; i < edgeproperties.length; i++) {
			var edgeProperty = edgeproperties[i];
			var title = edgeProperty.property;
			if (edgeProperty.title) {
				title = edgeProperty.title;
			}
			var attribute = {
				title: title,
				description: "none",
				class: "edge",
				property: edgeProperty.property,
				type: edgeProperty.parsingtype
			};
			edgeAttributes.push(attribute);
		}
	}
	// helper s.a.

	/**
	 * @param attributeValue
	 * @param context
	 *            'node' for node attribute / 'edge' for edge attribute
	 * @returns
	 */
	function getAttributeType(context, attributeProperty) {
		var attributes;
		if (context == 'edge')
			attributes = edgeAttributes;
		if (context == 'node')
			attributes = nodeAttributes;
		if (attributes) {
			for ( var i = 0; i < attributes.length; i++) {
				if (attributes[i].property == attributeProperty) {
					return attributes[i].type;
				}
			}
		}
		return "string";
	}
	/**
	 * @param context -
	 *            "node" / "edeg"
	 * @param value
	 *            i.e. "bc" (attribute.property)
	 * @returns an attribute
	 */
	function getAttributeByProperty(context, value) {
		var set;
		if (context == "edge")
			set = edgeAttributes;
		if (context == "node")
			set = nodeAttributes;
		if (set) {
			for ( var i = 0; i < set.length; i++) {
				if (set[i].property == value) {
					return set[i];
				}
			}
		}
		return null;
	}
	/**
	 * gets the minimal / maximal value for a certain attribute
	 * 
	 * @param attribute
	 * @param context
	 *            {String} 'node' / 'edge'
	 * @returns {}
	 */
	function getAttributeRange(context, attribute) {
		var attributeValues = getAttributeValues(context, attribute);
		var min = parseFloat(d3.min(attributeValues));
		var max = parseFloat(d3.max(attributeValues));
		return new Range(min, max);
	}
	/**
	 * get all possible values for a attribute (i.e. for string property ->
	 * "classes")
	 * 
	 * @param attribute
	 * @param context
	 *            {String} 'node' / 'edge'
	 * @returns {}
	 */
	function getAttributeValues(context, attribute) {
		var attributeValues = new Array();
		var set;
		if (context == 'edge') {
			set = edgeset;
		} else {
			set = nodeset;
		}

		var type = getAttributeType(context, attribute);
		set.forEach(function(datum) {
			var val = datum[attribute];
			if (datum[attribute] != null && datum[attribute] != undefined) {
				switch (type) {
				case "string": {
					if (attributeValues.indexOf(val) == -1) {
						attributeValues.push(val);
					}
					break;
				}
				case "double": {
					val = parseFloat(val);
					if (attributeValues.indexOf(val) == -1) {
						attributeValues.push(val);
					}
					break;
				}
				case "cluster": {
					for ( var i = 0; i < val.length; i++) {
						if (attributeValues.indexOf(val[i]) == -1) {
							attributeValues.push(val[i]);
						}
					}
					break;
				}
				default:
					break;
				}
			}
		});

		return attributeValues.sort();
	}

	/**
	 * Search Options
	 */
	// the network data links
	var datalinks = [];
	// scope context
	var scopeContext = 0;
	var trailExploration = false;

	/**
	 * TimeNav Options
	 */
	var currentTimeFrame;
	function getCurrentTimeFrame() {
		if (currentTimeFrame == undefined || currentTimeFrame == null)
			return 0;
		return currentTimeFrame;
	}
	function setCurrentTimeFrame(value) {
		if (typeof (value) == "number" && value >= 0 && value <= maxTimeFrame()) {
			currentTimeFrame = value;
		}
	}
	function getDataLinks() {
		if (datalinks == undefined || datalinks == null)
			return [];
		return datalinks;
	}
	function maxTimeFrame() {
		if (getDataLinks().length == 0)
			return 0;
		return getDataLinks().length - 1;
	}

	// the movie clip main control
	var movieControl;
	// variables that preserve the exploration perspective during each iteration
	var scale = 1;
	var translate = [ 0, 0 ];
	// the search history
	var searchHistory = "";
	// the duration of the movie frame
	var duration = 1000;
	// visual stability
	var visualStability = 0;
	// transition objects
	var transferLayer = new Array();
	
	/**
	 * INFOS
	 */
	// the network title
	var networkTitle = "No title found."; // default "title"
	function getNetworkTitle() {
		return networkTitle;
	}
	function setNetworkTitle(value) {
		if (typeof (value) == "string") {
			networkTitle = value;
		}
	}

	// the current network time
	var networkTime = "0";
	function getNetworkTime() {
		return networkTime;
	}
	function setNetworkTime(value) {
		if (typeof (value) == "string" || typeof (value) == "number") {
			networkTime = value;
		}
	}

	// if the network is directed or not
	var directed = undefined;
	function getDirected() {
		if (directed == "true" || directed == true) {
			return true;
		}
		if (directed == "false" || directed == false) {
			return false;
		}
		return directed;
	}
	function setDirected(value) {
		if (typeof (value) == "string" || typeof (value) == "boolean") {
			directed = value;
		}
	}

	// the network description
	var networkDescription = "No network description available.";
	function getNetworkDescription() {
		return networkDescription;
	}
	function setNetworkDescription(value) {
		if (typeof (value) == "string") {
			networkDescription = value;
		}
	}

	// the network type
	var networkType = "No type found.";
	function getNetworkType() {
		return networkType;
	}
	function setNetworkType(value) {
		if (typeof (value) == "string") {
			networkType = value;
		}
	}

	/**
	 * MAIN INIT
	 */
	this.initialize = function(dataFile) {

		if (!frameworkInitialized) {
			initializeUI();
		}

		cleanCanvas();
		frameworkInitialized = initializeDataLoading(dataFile.metadata, dataFile.data);

		if (frameworkInitialized) {
			translateEdges();
			initializeCanvas();

			adjustExplorationContext();

			// init gui functions (show / hide elements) only once with first load
			if (!toolbarInitialized) {
				initToolbar();
			} else {
				// if gui is initialized reset only the data dependend elements (measures+properties)
				try {
//					reset();
				} catch (e) {
				}
			}
			updateToolbar();
		}
		return frameworkInitialized;
	};

	var fileStylingOverwritesStyling = true;
	var styling_TMP = null;
	this.afterEngineStarted = function() {
		//console.log("_______")
		//console.log("active: "+styling.nodes.mapping.shape.property+"/"+styling.nodes.mapping.shape.value)
		//console.log("styling_TMP: "+styling.nodes.mapping.shape.property+"/"+styling.nodes.mapping.shape.value)
		if(styling_TMP==null)
			styling_TMP = styling;
		if(styling_actualFile != undefined && styling_actualFile != null && fileStylingOverwritesStyling == true){
			styling_TMP = styling;
			styling = styling_actualFile;
		}else{
			styling = styling_TMP;
		}
		//console.log("styling: "+styling.nodes.mapping.shape.property+"/"+styling.nodes.mapping.shape.value)
		setStyling(styling);	
	};

	// initialize the network information
	function initializeDataLoading(metadata, data) {

		if (metadata != null && metadata != undefined && data != null
				&& data != undefined) {

			// normalize the cluster type
			correctClusters(metadata, data);

			styling_actualFile = metadata.styling;

			// retrieving the meta data....
			setNetworkTitle(metadata.title);
			setNetworkTime(metadata.time);
			setDirected(metadata.directed);
			setNetworkDescription(metadata.description);
			setNetworkType(metadata.type);

			datalinks = (metadata.datalinks != undefined) ? metadata.datalinks
					: undefined;
			nodeMeasures = (metadata.measures != undefined) ? extractMeasures(
					metadata.measures, 'node') : undefined;
			edgeMeasures = (metadata.measures != undefined) ? extractMeasures(
					metadata.measures, 'edge') : undefined;
			nodeproperties = (metadata.nodeproperties != undefined) ? metadata.nodeproperties
					: undefined;
			edgeproperties = (metadata.edgeproperties != undefined) ? metadata.edgeproperties
					: undefined;

			// retrieving the data...
            nodeset = (data.nodes !=undefined ) ? stabilizeLayout(data.nodes) : undefined;
			edgeset = (data.edges != undefined) ? data.edges : undefined;

			// merging the measures & properties into attributes
			initNodeAttibutes();
			initEdgeAttibutes();

			return true;
		}
		return false;
	}

	// normalizing of cluster type and values
	function correctClusters(metadata, data) {
		var clustersFound = false;
		if (metadata.measures) {
			for ( var i = 0; i < metadata.measures.length; i++) {
				if (metadata.measures[i].property == "clusters"
						|| metadata.measures[i].title == "clusters") {
					metadata.measures[i].type = "cluster";
					clustersFound = true;
				}
			}
		}
		if (metadata.nodeproperties) {
			for ( var i = 0; i < metadata.nodeproperties.length; i++) {
				if (metadata.nodeproperties[i].clusters) {
					metadata.nodeproperties[i].clusters = new Array("cluster");
					clustersFound = true;
				}
			}
		}
		if (metadata.edgeproperties) {
			for ( var i = 0; i < metadata.edgeproperties.length; i++) {
				if (metadata.edgeproperties[i].clusters) {
					metadata.edgeproperties[i].clusters = new Array("cluster");
					clustersFound = true;
				}
			}
		}
		if (clustersFound) {
			if (data.edges) {
				data.edges.forEach(function(edge) {
					if (typeof (edge.clusters) == "string") {
						edge.clusters = JSON.parse(edge.clusters);
						for ( var i = 0; i < edge.clusters.length; i++) {
							edge.clusters[i] = edge.clusters[i].toString();
						}
					}
				});
			}
			if (data.nodes) {
				data.nodes.forEach(function(node) {
					if (typeof (node.clusters) == "string") {
						node.clusters = JSON.parse(node.clusters);
					}
					for ( var i = 0; i < node.clusters.length; i++) {
						node.clusters[i] = node.clusters[i].toString();
					}
				});
			}
		}
	}

	// function that transfers the old graph coordinates to the new one
    function stabilizeLayout(newNodeSet){
        if(visualStability==1){
            newNodeSet = transferDrawingState(newNodeSet);
        }else if(visualStability==2){
            newNodeSet = stabilizeByCriteria(newNodeSet,'label');
        }else if(visualStability==3){
            newNodeSet = stabilizeByCriteria(newNodeSet,'id');
        }
        return newNodeSet;
    }

    function stabilizeByCriteria(newNodeSet,criteria){
        for(var i=0;i<nodeset.length;i++){
            var currentNode = nodeset[i];
            for(var j=0;j<newNodeSet.length;j++){
                var futureNode = newNodeSet[j];
                if(currentNode[criteria]!=undefined && futureNode[criteria]!=undefined && currentNode[criteria]==futureNode[criteria]){
                    futureNode.x = currentNode.x;
                    futureNode.y = currentNode.y;
                    futureNode.fixed = true;
                    break;
                }
            }
        }
        return newNodeSet;
    };

    function transferDrawingState(newNodeSet){
        for(var i=0;i<nodeset.length;i++){
            var currentNode = nodeset[i];
            var futureNode = newNodeSet[i];
            if(currentNode!=undefined && futureNode!=undefined){
                futureNode.x = currentNode.x;
                futureNode.y = currentNode.y;
                futureNode.fixed = currentNode.fixed;
            }
        }
        return newNodeSet;
    };

    function retrieveTargetObjectIndex (object){
        for(var i=0;i<transferLayer.length;i++){
            if( (visualStability == 2 && transferLayer[i].label.trim() == object.label.trim()) || (transferLayer[i].id.trim() == object.id.trim() && visualStability == 3))
            return i;
        }
        return -1;
    }


    // support function for translating the edgeset into the appropriate way
	function translateEdges() {
		edgeset.forEach(function(edge) {
			edge.source = nodeset[translateNode(edge.source)];
			edge.target = nodeset[translateNode(edge.target)];
		});
	}
	// search a node over the nodeset
	function translateNode(nodeID) {
		for ( var i = 0; i < nodeset.length; i++) {
			if (nodeID == nodeset[i].id) {
				return i;
			}
		}
		return -1;
	}

	// canvas initialization function
	function initializeCanvas() {

		canvas = d3.select('#content').append('svg').attr('id', 'canvas').attr(
				'viewBox', '0 0 ' + canvasWidth + ' ' + canvasHeight).attr(
				'preserveAspectRatio', 'xMidYMid meet').call(
				d3.behavior.zoom().scale(scale).translate(translate)
						.scaleExtent([ 1, 5 ]).on('zoom', function() {
							adjustZoom();
							adjustExplorationContext();
						})).append('svg:g');

		canvas.append('svg:rect').attr('width', canvasWidth).attr('height',
				canvasHeight).style('fill', 'white').style('stroke-width', '1')
				.style('pointer-events', 'all');
	}

	// zoom function
	function adjustZoom() {
		translate = d3.event.translate;
		scale = d3.event.scale;
	}

	function adjustExplorationContext() {
		canvas.attr('transform', 'translate(' + translate + ')' + ' scale('
				+ scale + ')');
	}

	// function responsable for cleaning the canvas
	function cleanCanvas() {
		canvas = d3.select('#canvas').remove();
	}

	// function for extracting any node or edge measure
	function extractMeasures(entities, entityclass) {
		var keys = new Array();
		entities.forEach(function(key) {
			if (key.class == entityclass) {
				keys.push(key);
			}
		});
		return keys;
	}
	// function for extracting any node or edge property
	function extractProperties(properties) {
		var keys = new Array();
		properties.forEach(function(property) {
			keys.push(Object.keys(property));
		})
		return keys;
	}

	// gui - hide the toolbar content
	function clearToolbar() {
		$('#toolbar').panel("open");
		// hide all toolbar content
		$("#networkinfo_toolbar").hide();
		$("#search_toolbar").hide();
		$("#timenavigation_toolbar").hide();
		$("#measures_toolbar").hide();
		$("#customoptions").hide();
		// hide nav list..
		if (sidePanelOpen) {
			$('#nav').popup("close");
		}
	}

	// initializes the non data dependent ui functions
	function initializeUI() {
		
		d3.select('#timenavigation').on('click', function() {
			clearToolbar();
			displayTimeNavigation();
		});
		d3.select('#layoutoptions').on('click', function() {
			clearToolbar();
			$("#customoptions").show();
		});
		d3.select('#measures').on('click', function() {
			clearToolbar();
			displayMeasures();
		});
		
		$("#closePanelBtn").on("click", function() {
			$('#toolbar').panel("close");
		});
		$("#closePanelBtnSearch").on("click", function() {
			$('#search').panel("close");
		});
		$("#toolbar").on(
				"panelopen",
				function(event, ui) {
					sidePanelOpen = true;
					$('#closePanelBtn').css("left",($("#toolbar").width() - ($("#closePanelBtn").width() / 2)));
					$('#closePanelBtn').show();
					$('#closePanelBtn').removeClass("ui-btn-active");
					$('#menuBtn').css("margin-left",$("#toolbar").width() + $("#closePanelBtn").width());
					$('#nav').popup("close");
				});
		$("#toolbar").on("panelbeforeclose", function(event, ui) {
			sidePanelOpen = false;
			$('#menuBtn').css("margin-left", 0);
			$('#closePanelBtn').hide();
		});
		$("#search").on("panelopen",function(event, ui) {$('#closePanelBtnSearch').css("right",($("#search").width() - ($("#closePanelBtnSearch").width() / 2)));
					$('#closePanelBtnSearch').show();
					$('#closePanelBtnSearch').removeClass("ui-btn-active")
				});
		$("#search").on("panelbeforeclose", function(event, ui) {
			$('#closePanelBtnSearch').hide();
		});

	}
	/**
	 * do once with main init
	 */
	function initToolbar() {
		initNetworkInfo();
		initMeasures();
		initSearch();
		initTimeNavigation();
		toolbarInitialized = true;
	}
	/**
	 * data based gui components -> update every timeslice (timenav)
	 */
	function updateToolbar() {
		$("#customoptions").empty();
		updateNetworkInfo();
		updateSearch();
		updateMeasures();
		updateTimeNavigation();
	}

	/*-------------------------------------------------network info menu related function-------------------------------------------------------*/

	// function responsable for displaying the network information on the
	// toolbar
	function initNetworkInfo() {
	}
	function updateNetworkInfo() {
		$('#networkTitle').html(getNetworkTitle());
		$('#networkType').html(getNetworkType());
		$('#networkTime').html(getNetworkTime());
		$('#networkDirectionInfo').html(function() {
			if (getDirected() != undefined) {
				if (getDirected() == true) {
					return 'The network is a directed graph.';
				} else {
					return 'The network is an undirected graph.';
				}
			} else {
				return 'Unable to detect network direction.';
			}
		});
		$('#networkDescription').html(getNetworkDescription());
	}
	function displayNetworkInfo() {
		$("#networkinfo_toolbar").show();
	}

	/*----------------------------------- measure menu & canvas manipulation -----------------------------------------------*/

	///// STYLING PARAMS /////
	
	/**
	 * MaP options
	 */
	var styling_actualFile = null; // metadata.. overwrites the original setting

	var hierarchicalFiltering = true;// if node + edge filter are active, these will be combined

	var defaultInterpolationColorMin = "#0000ff";
	var defaultInterpolationColorMax = "#ff0000";
	
	var defaultColorTableColors = d3.scale.category10();
	var defaultClusterColors = d3.scale.category20();
	var defaultClusterColorNotIncluded = "#ffffff";
	var defaultClusterColorMultipleTimesIncluded = "#000000";
	var defaultNodeSymbol = d3.svg.symbolTypes[0];

	var styling = {
		"labels":{
			"defaultSize": 5,
			"sizeScale": 1,
			"defaultColor": "#000000",
			"mapping": "none" // EXAMPLE "dc"
		},
		"nodes":{
			"defaultSize": 10,
			"highlightEffect": 2.5, 
			"sizeScale": 1,
			"defaultColor": "#000000",
			"filter": {
				"property": "none",
				"value": null
			},
			"mapping":{
				"color":{
					"labels": true,
					"property": "none",
					"value": null
					/* EXAMPLE
					"property": "dc",
					"value": {
					 	"min": "#0000ff",
					 	"max": "#ff0000"
					} */
				},
				"size":{
					"property": "none",
					"value": null
					/* EXAMPLE
					"property": "dc",
					"value": 10 */
				},
				"shape":{
					"property": "none",
					"value": null
					/* EXAMPLE
					"property": "clusters",
					"value": {
						"1": 5,
						"2": 2,
						"3": 3,
						"4": 4
					}*/
				}
			}
		},
		"edges":{
			"defaultSize": 0.5,
			"sizeScale": 1,
			"defaultColor": "#000000",
			"filter": {
				"property": "none",
				"value": null
				/* EXAMPLE
				"property": "weight",
				"value": [1,2,3,4,5]
				*/
			},
			"mapping":{
				"color":{
					"property": "none",
					"value": null
					/* EXAMPLE
					"property": "weight",
					"value": {
					 	"1": "#ffff00",
					 	"2": "#ff00ff",
					 	"3": "#ffff20"
					} */
				},
				"size":{
					"property": "attribute",
					"value": null
				}
			}
		}
	};
	
	// //////////// UPDATE & RESET //////////////
	// updates the view with all modifications made in the MaP-Menu
	function update() {
		$('#updateMaP').button("disable");
		$('#resetMaP').button("disable");
		setTimeout(function(){
			updateShapeSize('label');
			updateShapeSize('node');
			updateShapeSize('edge');
			updateLabelMapping(getLabelType());
			updateSizeMapping(getSizeMappingOptions('edge'));
			if (getNodeShapeMappingOptions().attributeContext == "none") {
				updateSizeMapping(getSizeMappingOptions('node'));
			} else {
				updateNodeShapeMapping(getNodeShapeMappingOptions());
			}
			updateFilter(getFilterOptions('node'));
			updateFilter(getFilterOptions('edge'));
			updateColorMapping(getColorMappingOptions('node'));
			updateColorMapping(getColorMappingOptions('edge'));
			$('#updateMaP').button("enable");
			$('#resetMaP').button("enable");
		},1);
	}
	// resets the view and all modifiers
	function reset() {
		setShapeScale("node", 1);
		setShapeScale("edge", 1);
		setShapeScale("label", 1);
		selectField_setOptionActive("#labelType", {
			title : "none",
			property : "none"
		});
		selectField_setOptionActive("#nodeFilter", {
			title : "none",
			property : "none"
		});
		selectField_setOptionActive("#edgeFilter", {
			title : "none",
			property : "none"
		});
		selectField_setOptionActive("#nodeColoring", {
			title : "none",
			property : "none"
		});
		setIfLabelColor(false);
		selectField_setOptionActive("#nodeSize", {
			title : "none",
			property : "none"
		});
		selectField_setOptionActive("#nodeShape", {
			title : "none",
			property : "none"
		});
		selectField_setOptionActive("#edgeColoring", {
			title : "none",
			property : "none"
		});
		selectField_setOptionActive("#edgeSize", {
			title : "none",
			property : "none"
		});
		update();
	}

	// ////////// init styling ///////////////


	/**
	 * parsing a style object and set corresponding values
	 * @param styleObject
	 */
	function setStyling(styleObject) {

		if (styleObject){
			setDefaultShapeSize("label", styleObject.labels.defaultSize);
			setShapeScale("label", styleObject.labels.sizeScale);
			setDefaultColor("label", styleObject.labels.defaultColor);
			setDefaultShapeSize("node", styleObject.nodes.defaultSize);
			setShapeScale("node", styleObject.nodes.sizeScale);
			setDefaultColor("node", styleObject.nodes.defaultColor);
			setlabelType(styleObject.labels.mapping);
			if (styleObject.nodes.filter && styleObject.nodes.filter.property
					&& styleObject.nodes.filter.value) {
				var attr = getAttributeByProperty('node',
						styleObject.nodes.filter.property);
				var value = styleObject.nodes.filter.value;
				setFilterValue("node", attr, value);
			}
			if (styleObject.nodes.mapping.color
					&& styleObject.nodes.mapping.color.property
					&& styleObject.nodes.mapping.color.labels) {
				var prop = styleObject.nodes.mapping.color.property;
				var val = styleObject.nodes.mapping.color.value;
				setColorMappingContext("node", prop);
				setColorSelectorValues('node', prop, val);
				setIfLabelColor(styleObject.nodes.mapping.color.labels);
			}
			if (styleObject.nodes.mapping.size
					&& styleObject.nodes.mapping.size.property
					&& styleObject.nodes.mapping.size.value) {
				var prop = styleObject.nodes.mapping.size.property;
				var val = styleObject.nodes.mapping.size.value;
				if (setSizeMappingContext("node", prop)) {
					setSizeMappingValue("node", val);
				}
			}
			if (styleObject.nodes.mapping.shape
					&& styleObject.nodes.mapping.shape.property) {
				var prop = styleObject.nodes.mapping.shape.property;
				var val = styleObject.nodes.mapping.shape.value;
				if (setNodeShapeMappingContext(prop)) {
					setNodeShapeMappingValues(prop, val)
				}
			}
	
			setDefaultShapeSize("edge", styleObject.edges.defaultSize);
			setShapeScale("edge", styleObject.edges.sizeScale);
			setDefaultColor("edge", styleObject.edges.defaultColor);
	
			if (styleObject.edges.filter && styleObject.edges.filter.property
					&& styleObject.edges.filter.value) {
				var attr = getAttributeByProperty("edge",
						styleObject.edges.filter.property);
				var value = styleObject.edges.filter.value;
				if (attr != null) {
					setFilterValue("edge", attr, value);
				}
			}
			if (styleObject.edges.mapping.color
					&& styleObject.edges.mapping.color.property
					&& styleObject.edges.mapping.color.value) {
				var prop = styleObject.edges.mapping.color.property;
				var val = styleObject.edges.mapping.color.value;
				setColorMappingContext("edge", prop);
				setColorSelectorValues('edge', prop, val);
			}
			if (styleObject.edges.mapping.size
					&& styleObject.edges.mapping.size.property
					&& styleObject.edges.mapping.size.value) {
				var prop = styleObject.edges.mapping.size.property;
				var val = styleObject.edges.mapping.size.value;
				setSizeMappingContext("edge", prop);
			}

		}
		
		update();

	}

	// //////////// SIZING //////////////
	function getShapeSize(context) {
		return getShapeScale(context) * getDefaultShapeSize(context);
	}
	function getShapeScale(context) {
		return styling[context+"s"].sizeScale;
	}
	function setShapeScale(context, value) {
		if (value > 0 && value < $('#' + context + 'Scale').prop('max')) {
			styling[context+"s"].sizeScale = value;
			$('#' + context + 'Scale').val(value);
			$('#' + context + 'Scale').slider("refresh");
			return true;
		}
		return false;
	}
	function getDefaultShapeSize(context) {
		if (context == "node") {
			return styling.nodes.defaultSize;
		}
		if (context == "label") {
			return styling.labels.defaultSize;
		}
		if (context == "edge") {
			return styling.edges.defaultSize;
		}
	}
	function setDefaultShapeSize(context, value) {
		if (value && typeof (value) == "number") {
			if (context == "node") {
				styling.nodes.defaultSize = value;
			}
			if (context == "label") {
				styling.labels.defaultSize = value;
			}
			if (context == "edge") {
				styling.edges.defaultSize = value;
			}
		}
	}
	function updateShapeSize(context) {
		if (context == "label") {
			$(labelNotation).css('font-size', getShapeSize("label"));
		} else {
			if (context == "node") {
				d3
						.selectAll(nodeNotation)
						.each(
								function(node) {
									d3
											.select('#node' + node.id)
											.attr(
													"d",
													d3.svg
															.symbol()
															.type(
																	function() {
																		return retrieveNodeSymbol(
																				node,
																				getNodeShapeMappingOptions());
																	})
															.size(
																	function() {
																		return retrieveSize(
																				node,
																				getSizeMappingOptions('node'));
																	}));
								});
			}
			if (context == "edge") {
				d3.selectAll(edgeNotation).each(
						function(edge) {
							d3.select("#edge" + edge.id).attr(
									"stroke-width",
									function() {
										return retrieveSize(edge,
												getSizeMappingOptions('edge'));
									});
						});
			}
		}
	}

	// //////////// FILTERING & ALPHA //////////////

	function switchToAlphagraph() {
		d3.selectAll(edgeNotation).attr("opacity", 0.1);
		d3.selectAll(labelNotation).attr("opacity", 0.1);
		d3.selectAll(nodeNotation).attr("opacity", 0.1);

	}

	function switchToNonAlphaGraph() {
		d3.selectAll(edgeNotation).attr("opacity", 1.0);
		d3.selectAll(labelNotation).attr("opacity", 1.0);
		d3.selectAll(nodeNotation).attr("opacity", 1.0);
	}

	/**
	 * sets the context of the node / edge filter
	 * 
	 * @param context
	 *            {String} 'node' / 'edge'
	 * @param value {String} (i.e. "dc")
	 */
	function setFilterContext(context, value) {
		if (!value)
			return false;
		$('#' + context + 'Filter').val(value);
		$('#' + context + 'Filter').selectmenu("refresh");
		styling[context+"s"].filter.property = value;
		return true;
	}
	/**
	 * @param context
	 *            {String} 'node' / 'edge'
	 * @returns the node filter context (the selected attribute to filter)
	 */
	function getFilterContext(context) {
		return styling[context+"s"].filter.property;//$('#' + context + 'Filter').val();
	}
	/**
	 * sets the value/attibuteContext of a filter in a certain global context (node or edge)
	 * @param context {String} "node"/"edge"
	 * @param attr {String} i.e. "bc", "dc", "cluster"
	 * @param value type depends on attr-type 
	 * @returns {Boolean}
	 */
	function setFilterValue(context, attr, value) {
		if (!attr || typeof (attr.property) != "string"){
			return false;			
		}
		setFilterContext(context, attr.property);
		selectField_setOptionActive('#' + context + 'Filter', attr);
		var type = getAttributeType(context, attr.property);
		switch (type) {
		case "string": {
			if (typeof (value) != "string")
				return false;
			$('#' + context + 'FilterStringValue').val(value);
			$('#' + context + 'FilterStringValue').trigger("change");
			$('#' + context + 'FilterStringValue').selectmenu("refresh");
			styling[context+"s"].filter.value = value;
			break;
		}
		case "double": {
			if (value < 0 || value > 1)
				return false;
			$('#' + context + 'FilterNumberValue').val(value * 100);
			$('#' + context + 'FilterNumberValue').slider("refresh");
			styling[context+"s"].filter.value = value;
			break;
		}
		case "cluster": {
			$('#' + context + 'FilterClusterValue').val(value);
			$('#' + context + 'FilterClusterValue').trigger("change");
			$('#' + context + 'FilterClusterValue').selectmenu("refresh");
			styling[context+"s"].filter.value = value;
			break;
		}
		default:
			return false;
		}
		return true;
	}
	/**
	 * @param context
	 *            {String} 'node' / 'edge'
	 * @returns the actual node Filter value (normalized to 0-1)
	 */
	function getFilterValue(context) {
		var value = $('#' + context + 'Filter').val();
		var type = getAttributeType(context, value);
		switch (type) {
		case "string": {
			return $('#' + context + 'FilterStringValue').val();//TODO: styling.filter.value
//			return styling[context+"s"].filter.value;
			break;
		}
		case "double": {
			return $('#' + context + 'FilterNumberValue').val() / 100;
//			return styling[context+"s"].filter.value;
			break;
		}
		case "cluster": {
			return $('#' + context + 'FilterClusterValue').val();
//			return styling[context+"s"].filter.value;
			break;
		}
		default:
			return "none";
			break;
		}
	}
	/**
	 * @param context
	 *            {String} 'node' / 'edge'
	 * @returns options = {mainContext: 'node' / 'edge', context:
	 *          "attributeValue", constraint: value (Array / threshould)}
	 */
	function getFilterOptions(context) {
		var options = {
			context : context,
			attributeContext : getFilterContext(context),
			constraint : getFilterValue(context)
		}
		return options;
	}
	/**
	 * triggers an update for the node filter by the given attribute
	 * (filterContext) and a given threshold (min filter value)
	 * 
	 * @param filterContext -
	 *            a node attribute
	 * @param threshold -
	 *            the filters min value (every node under this value will be
	 *            faded out)
	 */
	function updateFilter(filterOptions) {

		if (filterOptions.context == 'node') {
			// main context = 'node'
			if (filterOptions.attributeContext == 'none'
					|| filterOptions.attributeContext == undefined
					|| filterOptions.attributeContext == null) {
				toAlpha(nodeNotation, 1.0);
				toAlpha(labelNotation, 1.0);
			} else {
				d3.selectAll(nodeNotation).each(function(datum) {
					d3.select(this).attr('opacity', function() {
						return retrieveAlphaValue(datum, filterOptions);
					});
				});
				d3.selectAll(labelNotation).each(function(datum) {
					d3.select(this).attr('opacity', function() {
						return retrieveAlphaValue(datum, filterOptions);
					});
				});
				d3.selectAll(edgeNotation).attr('opacity', 0.1);
			}
		} else {
			// main context = 'edge'
			var nodeFilterContext = getFilterContext('node');
			if (filterOptions.attributeContext == 'none'
					|| filterOptions.attributeContext == undefined
					|| filterOptions.attributeContext == null) {
				if (nodeFilterContext == 'none'
						|| nodeFilterContext == undefined
						|| nodeFilterContext == null) {
					// if node filter is set: hide edges, else show them
					toAlpha(edgeNotation, 1.0);
				} else {
					toAlpha(edgeNotation, 0.1);
				}
			} else {
				d3
						.selectAll(edgeNotation)
						.each(
								function(datum) {
									var alpha;
									if (hierarchicalFiltering) {
										var connectedNodesAlpha = [];
										connectedNodesAlpha
												.push(retrieveAlphaValue(
														datum.source,
														{
															context : 'node',
															attributeContext : nodeFilterContext,
															constraint : getFilterValue('node')
														}));
										connectedNodesAlpha
												.push(retrieveAlphaValue(
														datum.target,
														{
															context : 'node',
															attributeContext : nodeFilterContext,
															constraint : getFilterValue('node')
														}));
										alpha = d3.min(connectedNodesAlpha);
									}
									if (alpha == 0.1) {
										return alpha;
									} else {
										d3.select(this).attr(
												'opacity',
												function() {
													return retrieveAlphaValue(
															datum,
															filterOptions);
												});
									}
								});
			}
		}

		function toAlpha(selector, alpha) {
			d3.selectAll(selector).each(function(datum) {
				d3.select(this).attr('opacity', alpha);
			});
		}
	}

	/**
	 * gets the alpha value for a node in a certain context ! depending on
	 * filter value
	 * 
	 * @param node
	 * @param attributeValue
	 * @param constraintValue
	 * @returns {Number} 0.1 / 1
	 */
	function retrieveAlphaValue(datum, options) {
		var mainContext = options.context; // 'node' / 'edge'
		var attribute = options.attributeContext; // i.e. 'bc' (Betweenes
		// Centrality
		var constraint = options.constraint;
		var type = getAttributeType(mainContext, attribute);
		if (attribute != 'none') {
			if (constraint && datum[attribute] != null
					&& datum[attribute] != undefined) {
				switch (type) {
				case "string": {
					if (constraint.indexOf(datum[attribute]) != -1) {
						return 0.1;
					}
					break;
				}
				case "double": {
					var max = getAttributeRange(mainContext, attribute).max;
					var normalizedAttributeValue = datum[attribute] / max;
					if (normalizedAttributeValue < constraint) {
						return 0.1;
					}
					break;
				}
				case "cluster": {
					var clusters = datum[attribute];
					for ( var i = 0; i < clusters.length; i++) {
						if (constraint.indexOf(clusters[i]) != -1) {
							return 0.1;
						}
					}
				}
				default:
					break;
				}
			}

		}
		return 1.0;
	}

	// //////////// LABEL MAPPING //////////////
	
	function setlabelType(value){
		if ("string" != typeof (value))
			return;
		$("#labelType").val(value);
		$("#labelType").trigger("change");
	}
	function getLabelType(){
		return $("#labelType").val();
	}
	function updateLabelMapping(type){
		if(type!=undefined){
			if(type=="none"){
				d3.selectAll(labelNotation).each(function(datum) {
					if (datum.label!=undefined){
						d3.select(this).html(datum.label);					
					}else{
						d3.select(this).html(datum.id);	
					}
				});
			}else{
				d3.selectAll(labelNotation).each(function(datum) {
					if( datum[type]!=undefined){
						d3.select(this).html(datum[type].toString());				
					}
				});							
			}
		}
	}
		
	// //////////// COLOR MAPPING //////////////

	function getDefaultColor(context) {
		if (context == "node")
			return styling.nodes.defaultColor;
		if (context == "label")
			return styling.labels.defaultColor;
		if (context == "edge")
			return styling.edges.defaultColor;
	}
	function setDefaultColor(context, value) {
		if ("string" != typeof (value))
			return;
		if (context == "node")
			styling.nodes.defaultColor = value;
		if (context == "label")
			styling.labels.defaultColor = value;
		if (context == "edge")
			styling.edges.defaultColor = value;
	}

	function setColorMappingContext(context, attribute) {
		if (typeof (attribute) != "string")
			return false;
		$('#' + context + 'Coloring').val(attribute);
		$('#' + context + 'Coloring').trigger("change");
		styling[context+"s"].mapping.color.property = attribute;
		return true;
	}
	function getColorMappingContext(context) {
		return styling[context+"s"].mapping.color.property;//$('#' + context + 'Coloring').val();
	}
	function ifLabelColor() {
		return $('#colorLabels').prop("checked");
	}
	function setIfLabelColor(boolean) {
		styling["nodes"].mapping.color.label = boolean;
		$('#colorLabels').prop("checked", boolean).checkboxradio("refresh");
	}

	function getColorMappingOptions(context) {
		var options = {
			type : getAttributeType(context, getColorMappingContext(context)),
			context : context,
			attributeContext : getColorMappingContext(context),
			labelColor : ifLabelColor()
		}
		var method;
		// fill in method params here, before calling each-loop
		switch (options.type) {
		case "cluster":
		case "string": {
			method = {
				type : "colorTable",
				range : getColorSelectorValues(context,
						options.attributeContext),
				domain : getAttributeValues(context, options.attributeContext)
			}
			break;
		}
		case "double": {
			var attributeRange = getAttributeRange(context,
					options.attributeContext);
			method = {
				type : "interpolate",
				range : getColorSelectorValues(context,
						options.attributeContext),
				domain : new Array(attributeRange.min, attributeRange.max)
			}
			break;
		}
		default:
			break;
		}
		options.method = method;
		return options;
	}
	function updateColorMapping(mappingOptions) {
		if (mappingOptions.context == 'node') {
			// color nodes
			d3.selectAll(nodeNotation).each(function(datum) {
				d3.select(this).attr('fill', function() {
					return retrieveColor(datum, mappingOptions);
				});
			});
			// color label if checked
			if (mappingOptions.labelColor == true) {
				mappingOptions.context = "label";
				d3.selectAll(labelNotation).each(function(datum) {
					d3.select(this).attr("fill", function(datum) {
						return retrieveColor(datum, mappingOptions);
					})
				});
			} else {// use default color for labels
				d3.selectAll(labelNotation).each(function(datum) {
					d3.select(this).attr("fill", getDefaultColor("label"));
				});
			}
		}
		if (mappingOptions.context == 'edge') {// color edges
			d3.selectAll(edgeNotation).each(function(datum) {
				d3.select(this).attr('stroke', function() {
					return retrieveColor(datum, mappingOptions);
				});
			});
		}
	}

	function retrieveColor(datum, options) {
		// there is a coloring method defined..
		if (options.attributeContext != null
				&& options.attributeContext != "none"
				&& options.method.type != null
				&& options.method.type != undefined) {
			switch (options.method.type) {
			case "interpolate": {
				var scale = d3.scale.linear();
				scale.range(options.method.range);
				scale.domain(options.method.domain);
				return scale(datum[options.attributeContext]);
			}
			case "colorTable": {
				var scale = d3.scale.ordinal();
				scale.range(options.method.range);
				scale.domain(options.method.domain);
				// one special case with clusters...
				if (options.attributeContext == "clusters"
						&& datum.clusters.length > 1) {
					return defaultClusterColorMultipleTimesIncluded;
				}
				if (options.attributeContext == "clusters"
						&& datum.clusters.length == 0) {
					if(options.context=="label"){
						return getDefaultColor("label");//would be white on white bg else
					}
					return defaultClusterColorNotIncluded;						
				}
				return scale(datum[options.attributeContext]);
			}
			default: {
				if (datum.type && options.context == 'node') {
					return defaultColorTableColors(datum.type);
				} else {
					return getDefaultColor(options.context);
				}
			}
			}
		}
		// define special cases here...
		// no method defined, but its a node and has a type - i.e. bimode
		// network
		if (datum.clusters != undefined && datum.clusters != null
				&& options.context == 'node') {
			if (datum.clusters.length == 0) {
				return defaultClusterColorNotIncluded;
			}
			if (datum.clusters.length == 1) {
				return defaultClusterColors(datum.clusters);
			}
			if (datum.clusters.length > 1) {
				return defaultClusterColorMultipleTimesIncluded;
			}
		}
		if (datum.type && options.context == 'node') {
			return defaultColorTableColors(datum.type);
		}

		return getDefaultColor(options.context);

	}

	/**
	 * is called when defining the color range (in updateColorMapping)
	 * furthermore the styling is updated in here once and not with the color picker!!! to save resources
	 * @returns {Array} with selected color values
	 *
	 */
	function getColorSelectorValues(context, attribute) {
		var values = [];
		var selector = "#colorSelector_" + context + attribute;
		var i = 0;
		var stop = false;
		while (!stop) {
			var color = $(selector + i + " .colorSelectorBG").css(
					"background-color");
			if (color && color != undefined && color != null) {
				values.push(color);
				i++;
			} else {
				stop = true;
			}			
		}
		// some colors have been selected -> save it in our style var
		if (values.length >= 1){
			var t = getAttributeType(context);
			if ( t == "double" ){
				styling[context+"s"].mapping.color.value = {};
				styling[context+"s"].mapping.color.value.min = values[0];
				styling[context+"s"].mapping.color.value.max = values[1];
			}else{
				styling[context+"s"].mapping.color.value = values;
			}
		}else{
			styling[context+"s"].mapping.color.value = null;
		}
		return values;
	}
	function setColorSelectorValues(context, attribute, values) {
		if (!attribute || typeof (attribute) != "string")
			return false;
		var type = getAttributeType(context, attribute);
		if (!values) {
			if (type == "string" || type == "cluster") {
				values = defaultColorTableColors;
			} else {
				values = new Array(defaultInterpolationColorMin,
						defaultInterpolationColorMax);
			}
		} else {
			if (type == "string" || type == "cluster") {
				var newColors = [];
				var allVals = getAttributeValues(context, attribute);
				for ( var i = 0; i < allVals.length; i++) {
					var val = allVals[i];
					if (values[val] != undefined && values[val] != null) {
						newColors.push(values[val]);

					} else {
						// newColors.push(defaultColorTableColors(i));
						newColors.push(getDefaultColor(context));
					}
				}
				values = newColors;
			}
			if (type == "double") {
				if (values.min != undefined && values.max != undefined) {
					values = new Array(values.min, values.max)
				}
				//else {
				//	console.log("set (default): "+values)
				//	values = new Array(defaultInterpolationColorMin,
				//			defaultInterpolationColorMax);
				//}
			}
		}

		var selector = "#colorSelector_" + context + attribute;
		var i = 0;
		var stop = false;
		while (!stop) {
			var test = $(selector + i + " .colorSelectorBG").css(
					"background-color");
			if (values && values.length > 0 && test && test != undefined
					&& test != null) {
				$(selector + i + " .colorSelectorBG").css("background-color",
						values[i % values.length]);
				$(selector + i).ColorPickerSetColor(values[i % values.length]);
				i++;
			} else {
				stop = true;
			}
		}
		return true;
	}

	// //////////// SIZE MAPPING //////////////

	function getSizeMappingContext(context) {
		return $("#" + context + "Size").val();
	}
	function setSizeMappingContext(context, value) {
		if (!context || typeof (context) != "string")
			return false;
		$("#" + context + "Size").val(value);
		$("#" + context + "Size").trigger("change");
		return true;
	}
	function getSizeMappingValue(context) {
		var value = $("#" + context + "SizeNumberValue").val();
		return value;
	}
	function setSizeMappingValue(context, value) {
		if (value > 0
				&& value < $("#" + context + "SizeNumberValue").prop('max')) {
			$("#" + context + "SizeNumberValue").val(value);
			$("#" + context + "SizeNumberValue").slider("refresh");
		}
	}
	function getSizeMappingOptions(context) {
		var attributeRangeSize = getAttributeRange(context,
				getSizeMappingContext(context));
		var options = {
			mainContext : context,
			attributeContext : getSizeMappingContext(context),
			domain : new Array(attributeRangeSize.min, attributeRangeSize.max),
			range : new Array(getShapeSize(context),
					(getShapeSize(context) * getSizeMappingValue(context)))
		};
		return options;
	}
	function updateSizeMapping(mappingOptions) {
		if (mappingOptions.mainContext == "node") {
			d3.selectAll(nodeNotation).each(
					function(datum) {
						d3.select('#node' + datum.id).attr("d",
								d3.svg.symbol().size(function() {
									return retrieveSize(datum, mappingOptions);
								}));
					});
		} else {
			d3.selectAll(edgeNotation).each(function(edge) {
				d3.select("#edge" + edge.id).attr("stroke-width", function() {
					return retrieveSize(edge, getSizeMappingOptions('edge'));
				});
			});
		}
	}
	// returns the correct node size depending on the selected measure
	function retrieveSize(datum, options) {
		if (options.attributeContext != 'none') {
			var scale = d3.scale.linear();
			scale.domain(options.domain);
			scale.range(options.range);
			return scale(datum[options.attributeContext]);
		} else {
			return getShapeSize(options.mainContext);
		}
	}

	// //////////// NODE SYMBOL MAPPING //////////////

	function getNodeShapeMappingContext() {
		return styling.nodes.mapping.shape.property;//$("#nodeShape").val();
	}
	function setNodeShapeMappingContext(value) {
		if (!value || typeof (value) != "string")
			return false;
		styling.nodes.mapping.shape.property = value;
		$("#nodeShape").val(value);
		$("#nodeShape").trigger("change");
		return true;
	}
	function getNodeShapeMappingValues(attribute) {
		var values = [];
		var selector = "#symbolSelector_" + attribute;
		var i = 0;
		var stop = false;
		while (!stop) {
			var value = $(selector + i).val();
			if (value && value != undefined && value != null) {
				values.push(value);
				i++;
			} else {
				stop = true;
			}
		}
		if (values.length >= 1) {
			styling.nodes.mapping.shape.value = values;
		}else{
			styling.nodes.mapping.shape.value = null;
		}
		return values;
	}
	function setNodeShapeMappingValues(attribute, values) {
		if(values==null) return;
		var selector = "#symbolSelector_" + attribute;
		var i = 0;
		var stop = false;
		while (!stop) {
			var el = $(selector + i);
			if (el.val() && el.val() != undefined && el.val() != null) {
				removeSymbolClasses(el);
				el.addClass('symbol_' + values[i % values.length]);
				el.val(values[i % values.length]);
				i++;
			} else {
				stop = true;
			}
		}
		return true;
	}
	function getNodeShapeMappingOptions() {
		var options = {
			attributeContext : getNodeShapeMappingContext(),
			domain : getAttributeValues('node', getNodeShapeMappingContext()),
			range : getNodeShapeMappingValues(getNodeShapeMappingContext())
		};
		return options;
	}
	function updateNodeShapeMapping(mappingOptions) {
		d3.selectAll(nodeNotation).each(
				function(node) {
					d3.select('#node' + node.id).attr(
							"d",
							d3.svg.symbol().type(
									function() {
										return retrieveNodeSymbol(node,
												mappingOptions);
									}).size(
									function() {
										return retrieveSize(node,
												getSizeMappingOptions('node'));
									}));
				});
	}

	// function for retrieving the node symbol - called in the updateSize()
	// method
	function retrieveNodeSymbol(node, options) {
		if (options != null && options != undefined
				&& options.attributeContext != undefined
				&& options.attributeContext != "none"
				&& options.domain != undefined && options.range != undefined) {
			var scale = d3.scale.ordinal();
			scale.domain(options.domain);// =selection
			scale.range(options.range);// =attributes values
			if( getAttributeType("node", options.attributeContext) == "string"){
				return d3.svg.symbolTypes[scale(node[options.attributeContext])];				
			}
			if( getAttributeType("node", options.attributeContext) == "cluster" && node[options.attributeContext].length == 1){
				return d3.svg.symbolTypes[scale(node[options.attributeContext])];				
			}
		} else {
			return defaultNodeSymbol;
		}
	}

	/*-------------------------------------------------measure menu related functions-------------------------------------------------------*/
	function displayMeasures() {
		$('#measures_toolbar').show();
	}
	// function responsable for initializing the measure options on the toolbar
	function initMeasures() {
		// updatebutton
		$('#updateMaP').on('click', function() {
			update();
		});
		// resetbutton
		$('#resetMaP').on('click', function() {
			reset();
		});
		$("#MaP_ResizeBtn").on("click", function() {
			$('#MaP_Resizing').show();
			$('#MaP_Filter').hide();
			$('#MaP_Map').hide();
		});
		$("#MaP_FilterBtn").on("click", function() {
			$('#MaP_Resizing').hide();
			$('#MaP_Filter').show();
			$('#MaP_Map').hide();
		});
		$("#MaP_MapBtn").on("click", function() {
			$('#MaP_Resizing').hide();
			$('#MaP_Filter').hide();
			$('#MaP_Map').show();
		});
		// style io
		$( "#exportStyleDialog" ).on( "popupafteropen", function( event, ui ) {
			$('#exportStyleField').val(JSON.stringify(styling));			
		} );
		$("#importStyleBtn").click(function(){
			try{
				var styleToImport = JSON.parse($('#importStyleField').val());
				setStyling(styleToImport);
				$("#importStyleDialog").popup("close");
			}catch(err){
				alert(err)
			}
		});
		
		// init selection widgets...
		
		// size
		function initSizeScale(x){
			$("#"+x+"Scale").on('change',function(){
				styling[x+"s"].sizeScale = $(this).val();
			});			
		}
		initSizeScale("node");
		initSizeScale("edge");
		initSizeScale("label");
		
		// filters
		function initFiltering(context) {
			$('#' + context + 'Filter').selectmenu("refresh");
			$('#' + context + 'Filter').on(
							'change',
							function() {
								setFilterContext(context, this.value);
								if (this.value == "none") {
									selectField_showTypeSelection('#' + context
											+ 'FilterSelectionWrapper', null);
								} else {
									var type = getAttributeType(context,
											this.value);
									if (type == "string") {
										$('#' + context + 'FilterStringValue')
												.empty();
										selectField_appendValue('#' + context
												+ 'FilterStringValue',
												"choose...", true);
										$('#' + context + 'FilterStringValue')
												.selectmenu("refresh");
										var values = getAttributeValues(
												context, this.value);
										for ( var i = 0; i < values.length; i++) {
											selectField_appendValue('#'
													+ context
													+ 'FilterStringValue',
													values[i]);
										}
										$('#' + context + 'FilterStringValue')
												.selectmenu("refresh");
									}
									if (type == "cluster") {
										$('#' + context + 'FilterClusterValue')
												.empty();
										selectField_appendValue('#' + context
												+ 'FilterClusterValue',
												"choose...", true);
										$('#' + context + 'FilterClusterValue')
												.selectmenu("refresh");
										var values = getAttributeValues(
												context, this.value);
										for ( var i = 0; i < values.length; i++) {
											selectField_appendValue('#'
													+ context
													+ 'FilterClusterValue',
													values[i]);
										}
										$('#' + context + 'FilterClusterValue')
												.selectmenu("refresh");
									}
									selectField_showTypeSelection('#' + context
											+ 'FilterSelectionWrapper', type);
								}
							});
		}
		initFiltering('node');
		initFiltering('edge');
		
		function initFilters(x){
			$("#"+x+"Filter").on('change',function(){
				styling[x+"s"].filter.property = $(this).val();
				styling[x+"s"].filter.value = null;
				var type = getAttributeType(x, $(this).val());
				if(type=="number"||type=="double")
					styling[x+"s"].filter.value = parseInt($("#"+x+"FilterNumberValue").val())/100;					
				else if (type=="string")
					styling[x+"s"].filter.value = $("#"+x+"FilterStringValue").val();
				else if (type == "cluster")
					styling[x+"s"].filter.value = $("#"+x+"FilterClusterValue").val();
			});	
		}
		initFilters("node");
		initFilters("edge");

		function initFilterSelections(x,y){
			$("#"+x+"Filter"+y+"Value").on("change click enter", function(){
				var type = getAttributeType(x, $("#"+x+"Filter").val());
				var v = $(this).val();
				if(type=="number") v = v/100;
				styling[x+"s"].filter.value = v;
			});				
		}
		initFilterSelections("node","Number");
		initFilterSelections("node","String");
		initFilterSelections("node","Cluster");
		initFilterSelections("edge","Number");
		initFilterSelections("edge","String");
		initFilterSelections("edge","Cluster");
		
		// mapping....
		
		// labels
		$("#labelType").on("change", function(){
			styling.labels.mapping = $(this).val();
		});

		// colors
		function initColoring(context) {
			$('#' + context + 'Coloring').selectmenu("refresh");
			$('#' + context + 'Coloring')
					.on(
							'change',
							function() {
								styling[context+"s"].mapping.color.property = $(this).val();
								
								if (this.value == "none") {
									styling[context+"s"].mapping.color.value = null;
									selectField_showTypeSelection('#' + context
											+ 'ColoringSelectionWrapper', null);
									if (context == "node") {
										$('#colorLabelsWrapper').hide();
										setIfLabelColor(false);
									}
								} else {
									var type = getAttributeType('node',
											this.value);
									switch (type) {
									case "string": {
										$('#' + context + 'ColoringStringValue')
												.empty();
										$('#' + context + 'ColoringStringValue')
												.listview("refresh");
										var values = getAttributeValues(
												context, this.value);
										var predefinedColors = defaultColorTableColors;
										for ( var i = 0; i < values.length; i++) {
											var id = context + this.value + i;
											$(
													'#'
															+ context
															+ 'ColoringStringValue')
													.append(
															buildColorSelItem(
																	id,
																	values[i],
																	predefinedColors(i)));
										}
										$('#' + context + 'ColoringStringValue')
												.listview("refresh");
										break;
									}
									case "double": {
										$('#' + context + 'ColoringNumberValue')
												.empty();
										$('#' + context + 'ColoringNumberValue')
												.listview("refresh");
										$('#' + context + 'ColoringNumberValue')
												.append(
														buildColorSelItem(
																context
																		+ this.value
																		+ 0,
																"min",
																defaultInterpolationColorMin));
										$('#' + context + 'ColoringNumberValue')
												.append(
														buildColorSelItem(
																context
																		+ this.value
																		+ 1,
																"max",
																defaultInterpolationColorMax));
										$('#' + context + 'ColoringNumberValue')
												.listview("refresh");
										break;
									}
									case "cluster": {
										$(
												'#'
														+ context
														+ 'ColoringClusterValue')
												.empty();
										$(
												'#'
														+ context
														+ 'ColoringClusterValue')
												.listview("refresh");
										var values = getAttributeValues(
												context, this.value);
										var predefinedColors = defaultClusterColors;
										
										for ( var i = 0; i < values.length; i++) {
											var id = context + this.value + i;
											$(
													'#'
															+ context
															+ 'ColoringClusterValue')
													.append(
															buildColorSelItem(
																	id,
																	values[i],
																	predefinedColors(i)));
										}
										$(
												'#'
														+ context
														+ 'ColoringClusterValue')
												.listview("refresh");
										break;
									}
									default:
										break;
									}
									selectField_showTypeSelection('#' + context
											+ 'ColoringSelectionWrapper', type);
									if (context == "node") {
										$('#colorLabelsWrapper').show();
									}
								}
								function buildColorSelItem(id, title,
										predefinedColor) {
									var li = $("<li></li>");
									return li.append(buildColorSelector(id,
											title, predefinedColor))
								}
							});
		}
		
		function buildColorSelector(id, title, predefinedColor) {
			if (!predefinedColor || predefinedColor == null) {
				predefinedColor = "";
			}
			return $(
					"<div class='colorSelector' id='colorSelector_"
							+ id
							+ "'><div class='colorSelectorBG' style='background-color:"
							+ predefinedColor
							+ ";'></div><div class='colorSelectorTitle'>"
							+ title + "</div></div>").ColorPicker(
					{
						color : predefinedColor,
						onShow : function(colpkr) {
							$(colpkr).fadeIn(500);
						},
						onHide : function(colpkr) {
							$(colpkr).fadeOut(500);
						},
						onChange : function(hsb, hex, rgb) {
							$("#colorSelector_" + id + " .colorSelectorBG")
									.css('backgroundColor', '#' + hex);
						}
					});
		}
		initColoring('node');
		initColoring('edge');
		
		$("colorLabels").on("change", function(){
			styling[context+"s"].mapping.color.label = $(this).val();
		});
	
		// size mapping
		function initSizeMapping(context) {
			$('#' + context + 'Size').selectmenu("refresh");
			$('#' + context + 'Size').on(
					'change',
					function() {
						styling[context+"s"].mapping.size.property = $(this).val();
						selectField_showTypeSelection('#' + context
								+ 'SizeSelectionWrapper', getAttributeType(
								context, this.value));
                        styling[context+"s"].mapping.size.value = $("#" + context + "SizeNumberValue").val();
						
					});
		}
		initSizeMapping('node');
		initSizeMapping('edge');
		
		$("#nodeSizeNumberValue").on("change",function(){
			styling["nodes"].mapping.size.value = $(this).val();
		});
		$("#edgeSizeNumberValue").on("change",function(){
			styling["edges"].mapping.size.value = $(this).val();
		});

		// node symbols
		$('#nodeShape').selectmenu("refresh");
		$('#nodeShape')
				.on(
						'change',
						function() {
							// setNodeShapeMappingContext(this.value);
							styling.nodes.mapping.shape.property = $(this).val();
							if (this.value == "none") {
								selectField_showTypeSelection(
										"#nodeShapeSelectionWrapper", null);
								styling.nodes.mapping.shape.value = null;
							} else {
								var type = getAttributeType('node', this.value);
								if (type == "string") {
									$('#nodeShapeStringValue').empty();
									$('#nodeShapeStringValue').listview(
											"refresh");
									var values = getAttributeValues('node',
											this.value);
									for ( var i = 0; i < values.length; i++) {
										var id = this.value + i;
										$("#nodeShapeStringValue").append(
												buildSymbolSelItem(this.value
														+ i, values[i], i % 6));
									}
									$('#nodeShapeStringValue').listview(
											"refresh");
								}
								if (type == "cluster") {
									$('#nodeShapeClusterValue').empty();
									$('#nodeShapeClusterValue').listview(
											"refresh");
									var values = getAttributeValues('node',
											this.value);
									for ( var i = 0; i < values.length; i++) {
										var id = this.value + i;
										$("#nodeShapeClusterValue").append(
												buildSymbolSelItem(this.value
														+ i, values[i], i % 6));
									}
									$('#nodeShapeClusterValue').listview(
											"refresh");
								}
								selectField_showTypeSelection(
										"#nodeShapeSelectionWrapper", type);
							}
							function buildSymbolSelItem(id, title,
									predefinedSymbol) {
								var li = $("<li></li>");
								return li.append(buildSymbolSelector(id, title,
										predefinedSymbol).val(
										(i % 6).toString()));
							}
						});
		function buildSymbolSelector(id, title, predefinedSymbol) {
			if (predefinedSymbol == null) {
				predefinedSymbol = "";
			} else {
				predefinedSymbol = "symbol_" + predefinedSymbol;
			}
			var selector = "symbolSelector_" + id;
			var element = $("<div class='symbolSelector symbol_thumbnail' id='"
					+ selector + "'></div>");
			element.addClass(predefinedSymbol);
			element.append("<div class='symbolSelectorFrame'></div>")
			element.append("<div class='symbolSelectorTitle'>" + title
					+ "</div></div>");
			return element.on("click", function() {
				// open popup on click
				$("#popupShapeSelection").popup({
					positionTo : element
				});
				$("#popupShapeSelection").popup("open");
				$("#popupShapeSelection").one("click", function(event) {
					// add selected symbol number and class to the element
					var selectedSymbolId = event.target.getAttribute("name");
					var selectedSymbolNumber = selectedSymbolId.split("_")[1];
					var parent = $("#" + selector);
					removeSymbolClasses(parent);
					parent.addClass(selectedSymbolId);
					parent.val(selectedSymbolNumber);
					$("#popupShapeSelection").popup("close");
				});
			});
		}
		
	}

	function updateMeasures() {
		$("#labelType").empty();
		$("#nodeFilter").empty();
		$("#edgeFilter").empty();
		$("#nodeColoring").empty();
		$("#edgeColoring").empty();
		$("#nodeSize").empty();
		$("#edgeSize").empty();
		$("#nodeShape").empty();
		appendAttributeToSelectField('#labelType', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#nodeFilter', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#edgeFilter', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#nodeColoring', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#edgeColoring', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#nodeSize', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#edgeSize', {
			property : "none",
			title : "none"
		});
		appendAttributeToSelectField('#nodeShape', {
			property : "none",
			title : "none"
		});
		// fill select fields with attributes...
		for ( var i = 0; i < nodeAttributes.length; i++) {
			// fill the select-fields type depending values
			var attr = nodeAttributes[i];
			switch (attr.type) {
			case "double": {
				appendAttributeToSelectField("#labelType", attr);
				appendAttributeToSelectField("#nodeFilter", attr);
				appendAttributeToSelectField("#nodeColoring", attr);
				appendAttributeToSelectField("#nodeSize", attr);
				break;
			}
			case "cluster":
			case "string": {
				appendAttributeToSelectField("#labelType", attr);
				appendAttributeToSelectField("#nodeFilter", attr);
				appendAttributeToSelectField("#nodeColoring", attr);
				appendAttributeToSelectField("#nodeShape", attr);
				break;
			}
			default:
				break;
			}
		}
		for ( var i = 0; i < edgeAttributes.length; i++) {
			var attr = edgeAttributes[i];
			switch (attr.type) {
			case "double": {
				appendAttributeToSelectField("#edgeFilter", attr);
				appendAttributeToSelectField("#edgeColoring", attr);
				appendAttributeToSelectField("#edgeSize", attr);
				break;
			}
			case "cluster":
			case "string": {
				appendAttributeToSelectField("#edgeFilter", attr);
				appendAttributeToSelectField("#edgeColoring", attr);
				break;
			}
			default:
				break;
			}
		}
		$("#labelType").selectmenu("refresh");
		$("#nodeFilter").selectmenu("refresh");
		$("#edgeFilter").selectmenu("refresh");
		$("#nodeColoring").selectmenu("refresh");
		$("#edgeColoring").selectmenu("refresh");
		$("#nodeSize").selectmenu("refresh");
		$("#edgeSize").selectmenu("refresh");
		$("#nodeShape").selectmenu("refresh");
	}

	function removeSymbolClasses(el) {
		for ( var i = 0; i < 6; i++) {
			el.removeClass("symbol_" + i);
		}
	}
	// append options to select field
	function appendAttributeToSelectField(selectFieldSelector, attribute) {
		$(selectFieldSelector).append(
				"<option value='" + attribute.property + "'>" + attribute.title
						+ "</option>");
	}
	function selectField_appendValue(selectFieldSelector, value, placeholder) {
		if (placeholder) {
			$(selectFieldSelector).append(
					"<option data-placeholder='true'>" + value + "</option>");
		} else {
			$(selectFieldSelector).append(
					"<option value='" + value + "'>" + value + "</option>");
		}
	}
	// displays the selection for a attribute
	function selectField_showTypeSelection(parentSelector, type) {
		$(parentSelector).children().hide();
		$(parentSelector).children().removeClass("active");
		if (type != null && type != undefined) {
			if (type == "double") {
				type = "number";
			}
			$(parentSelector + " ." + type + "Selection").show();
			$(parentSelector + " ." + type + "Selection").addClass("active");
		}
	}
	function selectField_setOptionActive(fieldSelector, attribute) {
		$(fieldSelector + ' option[value=' + attribute.property + ']').trigger(
				"click").attr('selected', 'selected');
		$(fieldSelector).val(attribute.property);
		$(fieldSelector).trigger("change");
		$(fieldSelector).selectmenu('refresh', true);
	}

	/*-------------------------------------------------search related functions-------------------------------------------------------*/
	// the property for the search
	var propertySearch = "label";
	// Color Scale of search results
	var rgbSearchResultBG = d3.scale.linear().domain([0, 1]).range(["#F6F6F6", "#dbfad5"]);


	// the toolbar
	//function displaySearch() {
	//	$("#search_toolbar").show();
	//}

	// function responsable for displaying and initalizing the search options on
	function initSearch() {
		// init searchfield
		$('#searchfield').keyup(function(e) {
			if (e.keyCode == 13) {
				searchNode(this.value.toString().trim());
			} else if (e.keyCode == 27) {
				cleanSearch();
			}
		});

        //init the attribute list for the search
        for(var i=0;i<nodeAttributes.length;i++){
            $('#collapsibleContent').append(
                    '<input type=checkbox id=checkbox'+nodeAttributes[i].property+'>'+
                    '<label for=checkbox'+ nodeAttributes[i].property +'>'+nodeAttributes[i].title+'</label>'
            ).trigger("create");
        };

		// init buttons
		$("#searchbutton").on("click", function() {
			searchNode($('#searchfield').val().toString().trim());
		});
		$("#cleanbutton").on("click", function() {
			cleanSearch();
		});

		// init scope selection
		$('#radio-choice-a').on("change", function() {
            updateScope(this.value);
		});

        $('#radio-choice-b').on("change", function() {
            updateScope(this.value);
        });

        $('#radio-choice-c').on("change", function() {
            updateScope(this.value);
        });

        $('#radio-choice-d').on("change", function() {
            updateScope(this.value);
        });

        $('#radio-choice-e').on("change", function() {
            updateScope(this.value);
        });
	}
	function updateSearch() {
		$('#suggestions').empty();
		for ( var i = 0; i < nodeset.length; i++) {
			$('#suggestions').append('<option value="' + nodeset[i].label + '">'+ nodeset[i].label + '</option>')
		}
		// append history
		$('#searchresult').empty();
		$('#searchresult').html(searchHistory);
	}

	function searchNode(keyword) {
		if (keyword === "") {
			switchToNonAlphaGraph()
		} else {
			switchToAlphagraph();

            d3.selectAll(nodeNotation).each(function(datum){
                if(datum.label.toLowerCase().indexOf(keyword.toLowerCase())!=-1){
                    var originalPath = d3.select(this).attr('d')
                    d3.select(this)
                        .attr("d",d3.svg.symbol()
                        .size(function(d) {return retrieveSize(d,getSizeMappingOptions('node')) * 100;})
                        .type(function(d) {return retrieveNodeSymbol(d,getNodeShapeMappingOptions());}))
                        .transition().attr("opacity", 1.0)
                        .transition().attr("d",originalPath);
                }
            });

            d3.selectAll(labelNotation).each(function(datum){
                if(datum.label.toLowerCase().indexOf(keyword.toLowerCase())!=-1){
                    d3.select(this).attr('opacity', 1.0);
                    searchHistory += "ID: " + datum.id + "<br>" + " Label: " + datum.label + "<br>";
                    for(var i=0;i<nodeAttributes.length;i++){
                        if($('#checkbox'+nodeAttributes[i].property).is(':checked')){
                            searchHistory+= nodeAttributes[i].title+ ':' + datum[nodeAttributes[i].property]+ "<br>";
                        }
                    }
                    $('#searchresult').empty();
                    d3.select("#searchresult").append('p').attr('class', 'info').html(searchHistory);
                }
            });
		}
	}



	function cleanSearch() {
		update();
		d3.select('#searchfield').property('value', "");
		$("#searchresult").empty();
		searchHistory = "";
	}

	function updateScope(scopeValue) {
		scopeContext = scopeValue;
		if (scopeContext == 0) {
			switchToNonAlphaGraph();
			trailExploration = false;
		}
	}

	function scopeSearch(sourceNodes, iteration) {
		var impactedNodes = [];

		sourceNodes.forEach(function(sourcenode) {
			// highlight the source node
			d3.select('#node' + sourcenode.id).attr('opacity', 1.0);
			d3.select('#label' + sourcenode.id).attr('opacity', 1.0);

			// retrieving the impacted neighbors
			searchNeighbors(sourcenode).forEach(function(impactedNeighbor) {
				impactedNodes.push(impactedNeighbor)
			});
		});

		iteration++;

		if (iteration < scopeContext)
			scopeSearch(impactedNodes, iteration);

	}

	function searchNeighbors(sourceNode) {
		var impactedNeighbors = [];
		edgeset.forEach(function(edge) {
			var neighbor = (sourceNode == edge.source) ? edge.target
					: (sourceNode == edge.target) ? edge.source : undefined;
			if (neighbor != undefined) {
				d3.select("#node" + neighbor.id).attr("opacity", 1.0);
				d3.select("#label" + neighbor.id).attr("opacity", 1.0);
				if (edge.source == neighbor || edge.target == neighbor)
					d3.select("#edge" + edge.id).transition().attr("opacity",1.0);
				impactedNeighbors.push(neighbor)
			}
		});
		return impactedNeighbors;

	}

	/*-------------------------------------------------time navigation functions-------------------------------------------------------*/

	// function responsable for displaying the time navigation options on the
	// toolbar
	function initTimeNavigation() {
		$("#backward").on("click", function() {
			moveBackwards();
		});
		$("#forward").on("click", function() {
			moveForward();
		});
		$("#play").on("click", function() {
			if ($("#play").val() == 'Play') {
				$("#play").val('Stop');
				playMovie();
			} else {
				$("#play").val('Play');
				stopMovie();
			}
			$("#play").button("refresh");
		});
		$("#reset").on("click", function() {
			resetTimeNav();
		});
		$('#timeslider', 'ui-slider-handle').on("mouseup", function() {
			showSlice($('#timeslider').val());
		});
		$('#timeslider').on('slidestop', function() {
			showSlice($('#timeslider').val());
		});
		$('#frameduration').keyup(function(e) {
			if (e.keyCode == 13) {
				updateMovieFrame();
			}
		});
		$('#framedurationbutton').on("click", function() {
			updateMovieFrame();
		});
		$('#vstability').on('change', function() {
			updateVisualStability();
		});
	}

	function updateTimeNavigation() {
		$('#timeslider').prop('max', maxTimeFrame());
		$('#timeslider').slider("refresh");

		$('#vstability').prop("checked", visualStability);
	}

	function displayTimeNavigation() {
		$("#networktime").val(getCurrentTimeFrame());
		$('#timeslider').val(getCurrentTimeFrame());
		$('#timeslider').slider("refresh");
		$('#frameduration').val(duration);
		$("#timenavigation_toolbar").show();
	}

	function updateVisualStability() {
        if(visualStability!=d3.select('#vstability').property('value')){
            visualStability = d3.select('#vstability').property('value');
            if(visualStability==0)
                transferLayer = [];
        }
    }

	function updateMovieFrame() {
		duration = d3.select('#frameduration').property('value');
	}
	function playMovie() {
		if ( getCurrentTimeFrame() == maxTimeFrame() ) resetTimeNav();
		movieControl = setInterval(function() {
			if (getCurrentTimeFrame() == maxTimeFrame()) {
				stopMovie();
			} else
				moveForward();
		}, duration);
	}
	function stopMovie() {
		clearInterval(movieControl);
		$('#play').val('Play');
		$("#play").button("refresh");
	}
	function resetTimeNav() {
		stopMovie();
		setCurrentTimeFrame(0);
		updateTimeSelector();
		visualize(datalinks[getCurrentTimeFrame()]);
	}
	function updateTimeSelector() {
		$('#networktime').val(getCurrentTimeFrame());
		$('#networktime').button("refresh");
		$('#timeslider').val(getCurrentTimeFrame());
		$('#timeslider').slider("refresh");
	}
	function moveBackwards() {
		setCurrentTimeFrame(getCurrentTimeFrame() - 1);
		updateTimeSelector();
		visualize(datalinks[getCurrentTimeFrame()]);
	}

	function moveForward() {
		setCurrentTimeFrame(getCurrentTimeFrame() + 1);
		updateTimeSelector();
		visualize(datalinks[getCurrentTimeFrame()]);
	}
	function showSlice(number) {
		number = parseInt(number);
		if (typeof (number) != "number")
			return;
		setCurrentTimeFrame(number);
		updateTimeSelector();
		visualize(datalinks[getCurrentTimeFrame()]);
	}

	// -------------------------------public interface methods--------------------------------------
	this.requestNewCanvas = function() {
		cleanCanvas();
		initializeCanvas();
	};

	// request the nodeset
	this.requestNodeSet = function() {
		return nodeset;
	};

	// request the edgeset
	this.requestEdgeSet = function() {
		return edgeset;
	};

	// request canvas
	this.requestCanvas = function() {
		return canvas;
	};

	// request the canvas width
	this.requestCanvasWidth = function() {
		return canvasWidth;
	};

	// request the canvas height
	this.requestCanvasHeight = function() {
		return canvasHeight;
	};

	// request the node notation
	this.requestNodeNotation = function() {
		return nodeNotation;
	};

	// request the node class
	this.requestNodeClassNotation = function() {
		return nodeNotation.substring(1, nodeNotation.length);
	};

	// request the edge notation
	this.requestEdgeNotation = function() {
		return edgeNotation;
	};

	// request the edge class
	this.requestEdgeClassNotation = function() {
		return edgeNotation.substring(1, edgeNotation.length);
	};

	// request label notation
	this.requestLabelNotation = function() {
		return labelNotation;
	};

	// request the label class
	this.requestLabelClassNotation = function() {
		return labelNotation.substring(1, labelNotation.length);
	};

	// request a node color
	this.requestNodeColor = function(node) {
		return retrieveColor(node, getColorMappingOptions('node'));
	};

	// request an edge color
	this.requestEdgeColor = function(edge) {
		return retrieveColor(edge, getColorMappingOptions('edge'));
	};

	// request the node symbol
	this.requestNodeSymbol = function(node) {
		return retrieveNodeSymbol(node);
	};

	// request the default node size
	this.requestNodeSize = function(node) {
		return retrieveSize(node, getSizeMappingOptions('node'));
	};

	// request the default edge size
	this.requestEdgeSize = function(edge) {
		return retrieveSize(edge, getSizeMappingOptions('edge'));
	};

	// request the default label size
	this.requestLabelSize = function() {
		return getShapeSize("label");
	};

	// request the node alpha value
	this.requestNodeAlpha = function(node) {
		return retrieveAlphaValue(node, getFilterOptions('node'));
	};

	// request the edge alplha value
	this.requestEdgeAlpha = function(edge) {
		return retrieveAlphaValue(edge, getFilterOptions('edge'));
	};

	// request the label alpha value
	this.requestLabelAlpha = function(label) {
		return retrieveAlphaValue(label, getFilterOptions('node'));
	};

	// request scope search
	this.requestScopeSearch = function(node) {
		if (scopeContext != 0) {
			if (scopeContext < 4) {
				switchToAlphagraph();
				scopeSearch([ node ], 0);
			} else {
				if (!trailExploration) {
					switchToAlphagraph();
					trailExploration = !trailExploration;
				}
				scopeSearch([ node ], 3);
			}
		}
	};

	// request node information
	this.requestNodeInformation = function(node) {

        d3.selectAll(nodeNotation).each(function(datum){
            if(datum.id==node.id){
                  d3.select(this)
                    .transition()
                    .attr('d',d3.svg.symbol().size(function(){return retrieveSize(node,getSizeMappingOptions("node")) * styling.nodes.highlightEffect;})
                    .type(function(node) {return retrieveNodeSymbol(node,getNodeShapeMappingOptions()); }));

                var tooltipContent = "ID:"+node.id +"; Label:"+node.label;
                for(var i=0;i<nodeAttributes.length;i++){
                    if($('#checkbox'+nodeAttributes[i].property).is(':checked')){
                        tooltipContent+="; "+nodeAttributes[i].title+':'+ node[nodeAttributes[i].property];
                    }
                }
                canvas.append('svg:title').attr('class','tooltip')
                    .attr('x', d3.select(this).attr('x'))
                    .attr('y',( d3.select(this).attr('y')-15))
                    .text(tooltipContent)
                    .attr('font-size',2.5);
            }
        });


	};

	// request node info removal
	this.requestNodeInformationRemoval = function(node) {
        d3.selectAll(nodeNotation).each(function(datum){
           if(datum.id==node.id){
               d3.select(this)
                   .transition()
                   .attr("d",d3.svg.symbol().size(function() {return retrieveSize(node, getSizeMappingOptions("node"));})
                   .type(function(node) {return retrieveNodeSymbol(node,getNodeShapeMappingOptions());}));
           }
        });
        d3.selectAll('.tooltip').remove();
	};

	this.requestNodeIndex = function(nodeID) {
		return translateNode(nodeID);
	};

	this.requestNetworkDirection = function() {
		return getDirected();
	};

	this.requestNumberValidation = function(value) {
		if (typeof (value) == "number") {
			return true;
		}
		return false;
	};

	// request a global update to the framework
	this.requestUpdate = function() {
		cleanCanvas();
		initializeCanvas();
		adjustExplorationContext();
	};

}

function Range(min, max) {
	this.min = min;
	this.max = max;
}

/* JQuery Panel - dialog fix */
$(document).on('pagehide',
		'.ui-selectmenu, .ui-page, .ui-dialog, .ui-page-active', function() {
			$('#toolbar').panel('open');
		});
