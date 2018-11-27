function VisualizationEngine(framework){
    var edgedistance = 50;
    var force = 50;
    var pausedlayout = false;

    this.initialize = function(){
    	initLayoutOptions();
    };

    this.start = function(callback){
        draw();
        if(pausedlayout)
        toggleLayoutMovement();
        if(callback != null){
    		callback.call();
    	}
    };

    function toggleLayoutMovement(){
        d3.selectAll(framework.requestNodeNotation()).each(function(d){
            d.fixed = pausedlayout;
        });
    };

    function initLayoutOptions(){
        var customoptions = $('#customoptions');
        
            customoptions.append('<h3>Dwyer Force Directed Graph</h3>');
            customoptions.append('<hr />');
            customoptions.append('<input id="updatelayout" value="Update" />');
            $('#updatelayout').button();
            $('#updatelayout').on("click", function(){
            	redraw();
        	});
            customoptions.append('<hr />');
            customoptions.append('<h3>Layout Repulsive Force</h3>');
            customoptions.append('<input id="force" />');
            $('#force').textinput();
            $('#force').val(force);
            $('#force').keyup(function(e) {
    			if(e.keyCode == 13) {redraw();}
        	});
            customoptions.append('<h3>Edge Distance</h3>');
            customoptions.append('<input id="edgedistance" />');
            $('#edgedistance').textinput();
            $('#edgedistance').val(edgedistance);
            $('#edgedistance').keyup(function(e) {
    			if(e.keyCode == 13) {redraw();}
        	});
            customoptions.append('<hr />');
            customoptions.append('<h3>Layout Movement</h3>');
            customoptions.append('<input id="pauselayout" />');
            $('#pauselayout').button();
            $('#pauselayout').on("click", function(){
            	pausedlayout = !pausedlayout;
            	$('#pauselayout').val(getPauseButtonText());
            	$('#pauselayout').button("refresh");
            	toggleLayoutMovement();
            });
            $('#pauselayout').val(getPauseButtonText());
            $('#pauselayout').button("refresh");
            function getPauseButtonText(){
            	if (pausedlayout) return "Resume";
            	return "Pause"
            }
    };

    function updateLayoutOptions(){
        input = parseInt(d3.select('#edgedistance').property('value'));
        if(framework.requestNumberValidation(input)){
            edgedistance = input;
        }
        input = parseInt(d3.select('#force').property('value'));
        if(framework.requestNumberValidation(input)){
            force = input;
        }
    };

    function redraw(){
        updateLayoutOptions();
        framework.requestUpdate();
        draw();
        if(pausedlayout)
            toggleLayoutMovement();
    };

    function draw(){
        //request the canvas
        var canvas = framework.requestCanvas();

        //define the node drag event
        function dragstart(d, i) {
            // stops the force auto positioning before you start dragging
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed('dragging', true);
            fdg.stop()
        };

        function dragmove(d) {
            // this is the key to make it work together with updating both px,py,x,y on d !
            d.px += d3.event.dx;
            d.py += d3.event.dy;
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            updateLayout();
        };

        function dragend(d) {
            // the force doesn't include the node in its auto positioning stuff
            d3.select(this).classed('dragging', true);
            d.fixed = true;
            updateLayout();
            fdg.resume();
        };

        //the update layout function
        function updateLayout(){
            edgeset.attr('x1', function(d) { return d.source.x; })
                .attr('y1', function(d) { return d.source.y; })
                .attr('x2', function(d) { return d.target.x; })
                .attr('y2', function(d) { return d.target.y; });

            nodeset.attr('transform', function(node) {
                return 'translate(' + node.x + ',' + node.y + ')';
            });

            labels.attr('transform', function(label) {
                return 'translate(' + label.x + ',' + label.y + ')';
            });
        };

        var drag = d3.behavior.drag()
            .origin(function(d) {return d;})
            .on('dragstart', dragstart)
            .on('drag', dragmove)
            .on('dragend', dragend);

        //define the force directed layout
        var fdg = d3.layout.force()
            .nodes(framework.requestNodeSet())
            .links(framework.requestEdgeSet())
            .size([framework.requestCanvasWidth(),framework.requestCanvasHeight()])
            .charge(function(){return (-1*force);})
            .linkDistance(function(){return edgedistance})
            .on('tick',updateLayout)
            .start();

        canvas.append('svg:defs').selectAll("marker")
            .data(["arrow"])
            .enter().append('svg:marker')
            .attr('id', 'endMarker')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5');

        //define how to paint the edges
        var edgeset = canvas.selectAll(framework.requestEdgeNotation())
            .data(fdg.links())
            .enter().append("svg:line")
            .attr("id", function (d) { return  framework.requestEdgeClassNotation()+d.id; } )
            .attr("class", function(){return framework.requestEdgeClassNotation()})
            .attr("stroke", function(d){return framework.requestEdgeColor(d)})
            .attr('opacity',function(edge){return framework.requestEdgeAlpha(edge)})
            .attr("stroke-width", function(edge){return framework.requestEdgeSize(edge)} )
            .attr("marker-end", function() {
            if(framework.requestNetworkDirection()==true)
                return "url(#endMarker)";
            });

        //define the labels
        var labels = canvas.selectAll(framework.requestLabelNotation())
            .data(fdg.nodes())
            .enter().append("svg:text")
            .attr("id", function (d) { return framework.requestLabelClassNotation()+d.id; } )
            .attr("class",function(){return framework.requestLabelClassNotation()})
            .attr("x", 0)
            .attr("y", -10)
            .attr('opacity',function(label){return framework.requestLabelAlpha(label)})
            .attr("font-size",framework.requestLabelSize())
            .attr("text-anchor","middle")
            .text(function(d) { return d.label; });

        //define how to paint the nodes
        var nodeset = canvas.selectAll(framework.requestNodeNotation())
            .data(fdg.nodes())
            .enter().append("svg:path")
            .attr("id", function (d) { return framework.requestNodeClassNotation()+d.id; } )
            .attr("class", function(){return framework.requestNodeClassNotation()})
            .attr("d", d3.svg.symbol()
                .size(function(d) { return framework.requestNodeSize(d);})
                .type(function(d) { return framework.requestNodeSymbol(d)}))
            .attr("fill",function(d){return framework.requestNodeColor(d);})
            .attr('opacity',function(node){return framework.requestNodeAlpha(node)})
            .attr("stroke", "black")
            .attr("stroke-width", "0.5")
            .on('click',function(node){framework.requestScopeSearch(node)})
            .on('mouseover',function(node){framework.requestNodeInformation(node)})
            .on('mouseout',function(node){framework.requestNodeInformationRemoval(node)})
            .call(drag);
    };

}