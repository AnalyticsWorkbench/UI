function prepareWorkbench(username) {

    var rightHTML = [];
    rightHTML.push('<ul id="accordionView">');
    rightHTML.push('<li>');
    rightHTML.push('<h2>Overview</h2>');
    rightHTML.push('<div style="position: relative;">');
    rightHTML.push('<div id="layerMap"></div>');
    rightHTML.push('</div>');
    rightHTML.push('</li>');
    rightHTML.push('<li>');
    rightHTML.push('<h2>Process Information</h2>');
    rightHTML.push('<div style="position: relative">');
    rightHTML.push('<div id="infoDisplay" style="height: 30px">');
    rightHTML.push('<div id="infoSpinner">');
    rightHTML.push('<div id="spinnerGraphics" style="width: 30px; margin-left: 10px; float: left" />');
    rightHTML.push('<div id="spinnerText" style="width: 150px; margin-left: 40px; margin-top: 10px; float: left" />');
    rightHTML.push('</div>');
    rightHTML.push('</div>');
    rightHTML.push('</div>');
    rightHTML.push('</li>');
    rightHTML.push('<li>');
    rightHTML.push('<h2>Results</h2>');
    rightHTML.push('<div style="position: relative">');
    rightHTML.push('<div id="infoTexts" />');
    rightHTML.push('</div>');
    rightHTML.push('</li>');
/*
    rightHTML.push('<li>');
    rightHTML.push('<h2>Project Information</h2>');
    rightHTML.push('<div style="position: relative">');
    rightHTML.push('<p style="margin-left: auto; margin-right: auto; text-align: left">');
    rightHTML.push('<img src="logos/seventh.png" style="vertical-align: middle; height: 40px" />');
    rightHTML.push('<img src="logos/flag.png" style="vertical-align: middle; height: 40px" />');
    rightHTML.push('SISOB Consortium 2011-2013.');
    rightHTML.push('<br />');
    rightHTML.push('The SISOB project is supported by the European Commission, call FP7-SCIENCE-IN-SOCIETY-2010-1, ');
    rightHTML.push('as a Collaborative Project under the 7th Framework Programme, Grant agreement no.:&nbsp;266588');
    rightHTML.push('</p>');
    rightHTML.push('</div>');
    rightHTML.push('</li>');
 */
    rightHTML.push('</ul>');
    rightHTML = rightHTML.join('');

//    var doc = document.getElementById('right');
//    doc.innerHTML = rightHTML;

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

    SC.sendRequest('getFilterDescriptions', buildInterface);

    function buildInterface(modules) {

        for (var i = 0; i < modules.length; i++) {
            analysis.modules.push(modules[i]);
        }

        var doc = document.getElementById('right');
        doc.innerHTML = rightHTML;

        var editor = new WireIt.WiringEditor(analysis);
        editor.accordionView.openPanel(2);
        editor.loginName = username;
    }

}

function prepareCanceledWorkbench() {
    // TODO this alone is not enough ...  ??? 15.11.2016 (For what ??? (TH)
    var editor = new WireIt.WiringEditor({});
    editor.loginName = 'name';
    editor.accordionView.openPanel(2);
}
