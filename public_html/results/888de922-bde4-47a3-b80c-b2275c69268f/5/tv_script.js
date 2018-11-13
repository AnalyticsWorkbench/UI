/////////////////////////////////////////////////////////////////////////////////

// define the displayed order of datakeys
colOrder = [
    "id",
    "label"
];

/////////////////////////////////////////////////////////////////////////////////

var correctInput = false;

//var rawData = "#RAWDATA#";

// metainfos
var name;
var filetype;
var specialfiletype = "";
//interesting stuff - sisob file (meta / data)
var sisobTableFile;
var meta;
var data;
var colOrderSet = false;

try {
    name = rawData["filename"];
    filetype = rawData["filetype"];
    specialfiletype = "";

    try {
        var specialfiletype = rawData["specialfiletype"];
    } catch (e) {
    }

    sisobTableFile = JSON.parse(rawData["filedata"]);

    //alert(sisobTableFile);
    meta = sisobTableFile.metadata;
    data = sisobTableFile.data;

    if (meta != undefined && data != undefined) {
        if (typeof meta.style !== 'undefined' && typeof meta.style.order !== 'undefined') {
            colOrder = meta.style.order;
			colOrderSet = true;
        }
        correctInput = true;
    }

} catch (e) {
}

function initTable() {

    if (correctInput) {
        /////Meta/////

        /*var metaKeys = null;
         if (meta[0] !== undefined){
         metaKeys = Object.keys(meta[0]);
         }*/

        var Header = document.getElementById("Header");
        var Title = document.getElementById("Title");
        var Description = document.getElementById("Description");
        var caption = document.createElement("h1");
        var description = document.createElement("p");
        var MetaInfo = document.getElementById("MetaInfo");
        var infoTable = document.createElement("table");
        var tableHead = document.createElement("th");
        tableHead.innerHTML = "Metainformationen";
        infoTable.appendChild(tableHead);
        infoTable.appendChild(document.createElement("th"));

        var ifMeta = false;
        //metaObjs
        for (var i = 0; i < meta.length; i++) {
            ifMeta = true;
            var key = Object.keys(meta[i])[0];
            var value = meta[i][key];
            switch (key) {
                case("title"):
                    caption.innerHTML = value;
                    break;
                case("description"):
                    description.innerHTML = value;
                    break;
                default:
                    var tr = document.createElement("tr");
                    var td1 = document.createElement("td");
                    td1.innerHTML = key;
                    var td2 = document.createElement("td");
                    td2.innerHTML = value;
                    tr.appendChild(td1);
                    tr.appendChild(td2);
                    infoTable.appendChild(tr);
                    break;
            }
        }
        if (!ifMeta) {
            tableHead.style.display = "none";
            infoTable.style.display = "none";
        }
        Title.appendChild(caption);
        Description.appendChild(description);
        MetaInfo.appendChild(infoTable);

        /////Data/////
        var Table = document.getElementById("Table");
        var table = document.createElement("table");

        // for tablesorter
        table.setAttribute("class", "tablesorter");
        table.setAttribute("id", "datatable");

        var dataKeys = null;
        if (data[0] !== undefined) {
            dataKeys = Object.keys(data[0]);
            if (colOrder) {
                dataKeys = sortDataKeys(dataKeys);
            }
        }

        /////Tableheader/////
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");
        for (var i = 0; i < dataKeys.length; i++) {
            var th = document.createElement("th");
            th.innerHTML = dataKeys[i];
            //th.addEventListener("click",function(e){
            //	sortBy(e.target);
            //});
            tr.appendChild(th);
        }
        // table.appendChild(tr);
        thead.appendChild(tr);
        table.appendChild(thead);

        /////Tabledata/////
        var tbody = document.createElement("tbody");
        //rows
        for (var i = 0; i < data.length; i++) {
            var tr = document.createElement("tr");
            //cols
            for (var j = 0; j < dataKeys.length; j++) {
                var td = document.createElement("td");
                var key = dataKeys[j];
                td.innerHTML = data[i][key];
                td.className = key; // for selecting the cells
                tr.appendChild(td);
            }
            // table.appendChild(tr);
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        Table.appendChild(table);
        console.log("trying to set up table sorter");
        // table.tablesorter();
        $("#datatable").tablesorter();
        console.log("table sorter set up");
    }

    else {
        //Wrong Input
        var msg = document.createElement("p");
        msg.innerHTML = "No proper SISOB-Table format as input selected.";
        var link = document.createElement("a");
        link.innerHTML = "-> click here for the file description";
        link.setAttribute("href", "http://www.uni-due.de");
        document.getElementsByTagName("body")[0].appendChild(msg);
        document.getElementsByTagName("body")[0].appendChild(link);
    }
}

var sortCat = "";
function sortBy(inEl) {
    document.getElementById("Table").style.cursor = "wait";

    var key = inEl.innerHTML; //th-value as selector
    var table = document.getElementById("Table").getElementsByTagName("table")[0];

    var elementsToSort = document.getElementsByClassName(key);
    var sorted = new Array(elementsToSort.length);

    if (sortCat == key) {
        for (var i = 0; i < elementsToSort.length; i++) {
            var tr = elementsToSort[i].parentNode;
            sorted[((sorted.length - i) - 1)] = tr.cloneNode(true);
        }
    }

    if (sortCat != key) {

        var numericSort = checkifnumbers(elementsToSort);

        //for all items
        for (var i = 0; i < elementsToSort.length; i++) {
            var tr = elementsToSort[i].parentNode;
            var td = elementsToSort[i];

            //get right place
            for (var j = 0; j < sorted.length; j++) {

                if (numericSort) {
                    //if "occupied"
                    if (sorted[j] && parseFloat(sorted[j].getElementsByClassName(key)[0].innerHTML) > parseFloat(td.innerHTML)) {
                        //"nach hinten Platz machen"
                        for (k = (sorted.length - 1); k > j; k--) {
                            sorted[k] = sorted[k - 1];
                        }
                        //einreihen
                        sorted[j] = tr.cloneNode(true);
                        break;
                    }
                }

                if (!numericSort) {
                    //if "occupied"
                    if (sorted[j] && sorted[j].getElementsByClassName(key)[0].innerHTML > td.innerHTML) {
                        //"nach hinten Platz machen"
                        for (k = (sorted.length - 1); k > j; k--) {
                            sorted[k] = sorted[k - 1];
                        }
                        //einreihen
                        sorted[j] = tr.cloneNode(true);
                        break;
                    }
                }

                //if "empty"
                if (!sorted[j]) {
                    //einreihen
                    sorted[j] = tr.cloneNode(true);
                    break;
                }
            }
        }
    }

    //"refresh" table
    for (var i = 0; i < sorted.length; i++) {
        table.removeChild(table.childNodes[1]);//delete second row
        /*console.log(i+" : "+sorted[i] +" : " + sorted[i].getElementsByClassName(key)[0].innerHTML);*/
        table.appendChild(sorted[i]);
    }

    //marking of a col
    //header
    var ths = table.getElementsByTagName("th");
    for (var l = 0; l < ths.length; l++) {
        if (ths[l].innerHTML == key) {
            ths[l].style.background = "gray";
            ths[l].style.color = "white";
        } else {
            ths[l].style.background = "lightgray";
            ths[l].style.color = "black";
        }
    }
    //col
    var tds1 = table.getElementsByClassName(sortCat);
    for (var l = 0; l < tds1.length; l++) {
        tds1[l].style.color = "black";
    }
    var tds2 = table.getElementsByClassName(key);
    for (var l = 0; l < tds2.length; l++) {
        tds2[l].style.color = "darkblue";
    }

    sortCat = key;

    document.getElementById("Table").style.cursor = "auto";
}

function checkifnumbers(inEls) {
    for (var i = 0; i < inEls.length; i++) {
        if (!parseInt(inEls[i].innerHTML[0]) && inEls[i].innerHTML[0] != "0") {
            //alert("string");
            if (inEls[i].innerHTML[0] != ".") {
                return false;
            }
            if (inEls[i].innerHTML[0] == ".") {
                if (!parseFloat(inEls[i].innerHTML)) {
                    return false;
                }
            }
        }
    }
    //alert("number");
    return true;
}

function sortDataKeys(dataKeys) {
    dataKeys.sort();
    var sortedKeys = [];
    for (var i in colOrder) {
        var key = colOrder[i];
        console.log('found key: ' + key);
        if (dataKeys.indexOf(key) > -1) {
            sortedKeys.push(key);
        }
    }
    if (!colOrderSet || (typeof meta.style.showall !== 'undefined' && meta.style.showall)) {
        for (var i in dataKeys) {
            var key = dataKeys[i];
            if (colOrder.indexOf(key) == -1) {
                sortedKeys.push(key);
            }
        }
    }
    return sortedKeys;
}