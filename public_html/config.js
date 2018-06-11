/**
 * Created with JetBrains WebStorm.
 * User: detjen
 * Date: 16.04.13
 * Time: 16:19
 * To change this template use File | Settings | File Templates.
 */

//client

var connectOptions = {host: "localhost", port: 48087};

// defines connetion type
// 0 = direct connection for testing (TSConnector)
// 1 = connection via Node.js (NodeConnector)
wbConType = 1;

//Define the displayed order of filter categories
//Case Sensitive!
var FILTERORDER = [];
	FILTERORDER[0] = "Input";
	FILTERORDER[1] = "Data Converters";
	FILTERORDER[3] = "Analysis";
	FILTERORDER[2] = "Tools";
	FILTERORDER[4] = "Output";
	FILTERORDER[5] = "Statistical Visualizations";
	FILTERORDER[6] = "Graph Visualizations";

