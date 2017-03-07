var width = 850;
var height = 290;
var margin = {top: 20, right: 15, bottom: 30, left: 40};
var w = width - margin.left - margin.right;
var h = height - margin.top - margin.bottom; // set the height, width, and margins for the visualization space



// VARIABLES - BOTH

var dataset; //the full dataset

// color scale for school districts
var col = d3.scaleOrdinal(d3.schemeCategory10);

var opacity = 0.8;

var districts = [["All", true], ["Seattle Public Schools", false], ["Highline Public Schools", false],
    ["Tukwila School District", false], ["Renton School District", false], ["Kent School District", false],
    ["Federal Way Public Schools", false], ["Auburn School District", false]];
var currDistricts = districts; // keep track of the current districts that are selected and that should be displayed

// keep track of the value ranges selected for each slider
var attributes = ["AfricanAmerican", "Latino"];
var ranges = [[0, 100], [0, 100]];



// VARIABLES - SCATTERPLOT

var scatterData; //the dataset without district or "all" data

var scatterplot = d3.select(".scatterplot")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, w]);

var xAxis = d3.axisBottom()
    .scale(x);

// add the x-axis to the vis
scatterplot.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + h + ")")
    .call(xAxis);

scatterplot.append("text")
    .attr("x", w)
    .attr("y", h - 6)
    .style("text-anchor", "end")
    .text("Percent of Seniors Taking AP/IB/Cambridge Courses");

var y = d3.scaleLinear()
    .domain([0, 100])
    .range([h, 0]);

var yAxis = d3.axisLeft()
    .scale(y);

// add the y-axis
scatterplot.append("g")
    .attr("class", "axis")
    .call(yAxis);

scatterplot.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Graduation Rates");



// VARIABLES - TREEMAP

var stratify = d3.stratify() // to put the data into a hierarchical format
    .id(function (d) {
        return d.School;
    })
    .parentId(function (d) {
        return d.District;
    });

var treemap = d3.select(".tree")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom + 15)
    .append("g")
    .attr("transform", "translate(" + margin.left + ",0)");

var map = d3.treemap()
    .size([width, height])
    .paddingInner(1)
    .tile(d3.treemapResquarify)
    .round(true);




// LOAD DATASET
d3.csv("treemap.csv", function(error, schools) {
    //read in the data
    if (error) return console.warn(error);
    schools.forEach(function(d) {
        d.FRPL = +d.FRPL * 100;
        d.AfricanAmerican = d.AfricanAmerican * 100;
        d.Latino = d.Latino * 100;
        d.ELL = +d.ELL * 100;
        d.RigorousCourses = d.RigorousCourses * 100;
        d.GradRate = d.GradRate * 100;
        d.FRPLGradRate = d.FRPLGradRate * 100;
    });
    //dataset is the full dataset -- maintain a copy of this at all times
    dataset = schools;


    // SCATTERPLOT:
    // filter scatterData so that only the individual schools are included
    scatterData = dataset
        .filter(function(d) {
            return d.District != "All";
        }).filter(function(d) {
            return d.District != "";
        });

    //all the data is now loaded, so draw the initial scatterplot
    drawScatterplot(scatterData);


    // TREEMAP:
    var root = prepTree(dataset); // size nodes appropriately and generate the treemap
    drawTree(root);
});



// DRAW SCATTERPLOT
function drawScatterplot(data) { //draw the circiles initially and on each interaction with a control

    var circle = scatterplot.selectAll("circle")
        .data(data);

    // update circles as needed
    circle
        .attr("cx", function(d) { return x(d.RigorousCourses);  })
        .attr("cy", function(d) { return y(d.FRPLGradRate);  })
        .style("fill", function(d) { return col(d.District); });

    circle.exit().remove();

    // adding circles, setting their properties, including tooltip
    circle.enter().append("circle")
        .attr("cx", function(d) { return x(d.RigorousCourses);  })
        .attr("cy", function(d) { return y(d.FRPLGradRate);  })
        .attr("r", 5)
        .style("fill", function(d) { return col(d.District); })
        .style("stroke", "black")
        .style("opacity", opacity)
        .on("mouseover", function(d) {
            var caption = getCaption(d, "scatter");

            d3.select(this).attr("r", 11)
                .style("opacity", 1);

            // highlight the appropriate rectangle on the scatterplot
            d3.selectAll(".node")
                .select( function(treeD) { return treeD.data.School == d.School?this:null; })
                .classed("node--hover", true);
            d3.selectAll("rect")
                .select( function(treeD) { return treeD.data.School == d.School?this:null; })
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            var caption = document.getElementById("caption").innerHTML = "";

            d3.select(this).attr("r", 5)
                .style("opacity", opacity);

            // unhighlight the appropriate rectangle on the scatterplot
            d3.selectAll(".node")
                .select( function(treeD) { return treeD.data.School == d.School?this:null; })
                .classed("node--hover", false);
            d3.selectAll("rect")
                .select( function(treeD) { return treeD.data.School == d.School?this:null; })
                .style("opacity", opacity);
        });
}



// DRAW TREEMAP
function drawTree(root) { // add the treemap to the visualization

    // data bind
    var node = treemap
        .selectAll("rect")
        .data(root.leaves());

    // enter
    node.enter()
        .append("rect").merge(node)
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("id", function(d) { return "rect-" + d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", function(d) { return col(d.data.District); })
        .style("opacity", opacity)
        .each(function(d) { d.node = this; })
        .on("mouseover", function(d) {
            var caption = getCaption(d, "tree");

            // highlight this node
            d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
                .classed("node--hover", true)
                .select("rect");
            d3.select(this).style("opacity", 1);

            // highlight the appropriate point on the scatterplot
            d3.selectAll("circle")
                .select( function(scatterD) { return scatterD.School == d.data.School?this:null; })
                .attr("r", 11)
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            var caption = document.getElementById("caption").innerHTML = "";

            // unhighlight this node
            d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
                .classed("node--hover", false);
            d3.select(this).style("opacity", opacity);

            // unhighlight the appropriate point on the scatterplot
            d3.selectAll("circle")
                .select( function(scatterD) { return scatterD.School == d.data.School?this:null; })
                .attr("r", 5)
                .style("opacity", opacity);
        });

    // update
    treemap
        .selectAll("rect")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("id", function(d) { return "rect-" + d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", function(d) { return col(d.data.District); })
        .style("opacity", opacity);

    // exit
    node.exit().remove();

}




// FUNCTIONS

// filter by school district selected in dropdown
function filterDistrict(mydistrict) {

    var ndata; // the filtered scatterplot data to be drawn
    var nTree; // the filtered tree data to be drawn

    if(mydistrict == "All") { // checked "All"
        // reset currDistricts to default
        currDistricts[0][1] = true;
        for (i = 1; i < currDistricts.length; i++) {
            currDistricts[i][1] = false;
        }

        // uncheck the other boxes
        document.getElementById("Seattle Public Schools").checked = false;
        document.getElementById("Highline Public Schools").checked = false;
        document.getElementById("Tukwila School District").checked = false;
        document.getElementById("Renton School District").checked = false;
        document.getElementById("Kent School District").checked = false;
        document.getElementById("Federal Way Public Schools").checked = false;
        document.getElementById("Auburn School District").checked = false;


        //SCATTERPLOT
        ndata = scatterData.filter(function(d) { return isInRange(d)});
        drawScatterplot(ndata);

        //TREEMAP
        nTree = dataset.filter(function(d) { return isInRange(d)});

        console.log(nTree);

        var root = prepTree(nTree);
        drawTree(root);


    } else { // any box besides "all" checked

        // uncheck the "all" box
        document.getElementById("All").checked = false;

        // update currDistricts to reflect current checkbox selections
        currDistricts[0][1] = false;
        for (i = 1; i < currDistricts.length; i++) {
            if (currDistricts[i][0] == mydistrict) {
                if (currDistricts[i][1]) { // check whether the box was just checked or unchecked
                    // and update currDistricts accordingly
                    currDistricts[i][1] = false;
                    document.getElementById(mydistrict).checked = false;

                } else {
                    currDistricts[i][1] = true;
                    document.getElementById(mydistrict).checked = true;
                }
            }
        }

        //SCATTERPLOT
        ndata = filterOnCurrDistricts(scatterData, "scatter");
        // filter by sliders after filtering by district
        ndata = ndata.filter(function(d) { return isInRange(d)});
        drawScatterplot(ndata);


        // TREEMAP
        nTree = filterOnCurrDistricts(dataset, "tree");
        nTree = nTree.filter(function(d) { return isInRange(d) });

        var root = prepTree(nTree);
        drawTree(root);
    }
}

// return the filtered dataset that should be used to create the visualization
function filterOnCurrDistricts(data, type) {
    var newData = [];

    if (type == "scatter") {
        for (i = 0; i < currDistricts.length; i++) {
            if (currDistricts[i][1]) {
                newData = newData.concat(data.filter(function(d) {
                    return d['District'].includes(currDistricts[i][0]);
                }));
            }
        }
    } else {
        newData = data;

        if (!currDistricts[0][1]) {
            for (i = 1; i < currDistricts.length; i++) {
                if (!currDistricts[i][1]) { // filter out the schools/district not currently selected
                    newData = newData.filter(function(d) {
                        return d.District != currDistricts[i][0]; // return all schools not in that district
                    });
                    newData= newData.filter(function(d) {
                        return d.School != currDistricts[i][0]; // remove the district parent from the hierarchy
                    });
                }
            }
        }
    }

    return newData;
}

// handle percent black/african american slider
$(function() {
    $("#AfricanAmerican").slider({
        range: true,
        min: 0,
        max: 60,
        values: [ 0, 60 ],

        slide: function(event, ui ) {
            $("#aframpercent").val(ui.values[0] + " - " + ui.values[1]); filterOnSliders("AfricanAmerican", ui.values);
        } //end slide function
    }); //end slider

    $("#aframpercent").val($("#AfricanAmerican").slider("values", 0) + " - " + $("#AfricanAmerican").slider("values", 1));
}); //end function


// handle latino percent slider
$(function() {
    $("#Latino").slider({
        range: true,
        min: 0,
        max: 60,
        values: [ 0, 60 ],

        slide: function(event, ui ) {
            $("#latinopercent").val(ui.values[0] + " - " + ui.values[1]); filterOnSliders("Latino", ui.values);
        } //end slide function
    }); //end slider

    $("#latinopercent").val($("#Latino").slider("values", 0) + " - " + $("#Latino").slider("values", 1));
}); //end function

// filter the data based on the values in both sliders
function filterOnSliders(attr, values) {
    for (i = 0; i < attributes.length; i++){
        if (attr == attributes[i]){
            ranges[i] = values;
        }
    }

    // SCATTERPLOT
    var toVisualize = scatterData.filter(function(d) { return isInRange(d)});
    // filter on current checkbox selections
    if (!currDistricts[0][1]) {
        toVisualize = filterOnCurrDistricts(toVisualize, "scatter");
    }
    drawScatterplot(toVisualize);

    // TREEMAP
    var nTree = dataset.filter(function(d) { return isInRange(d) });
    nTree = filterOnCurrDistricts(nTree, "tree");

    console.log(nTree);

    var root = prepTree(nTree);

    console.log(root);

    drawTree(root);
}

// check if the data point fits within the ranges of both sliders
function isInRange(datum) {
    if (datum.District == "All") {
        return true;
    } else if (datum.District == "") {
        return true;
    } else {
        for (i = 0; i < attributes.length; i++) {
            if (datum[attributes[i]] < ranges[i][0] || datum[attributes[i]] > ranges[i][1]) {
                return false;
            }
        }
        return true;
    }
}


// generate the caption for a school
function getCaption(d, type) {
    var school;
    var district;
    var FRPLGradRate;
    var Rigorous;
    var AfricanAmerican;
    var Latino;
    if (type == "scatter") { // need two options because the scatterplot and treemap data are
        school = d.School;
        district = d.District;
        FRPLGradRate = d.FRPLGradRate;
        Rigorous = d.RigorousCourses;
        AfricanAmerican = d.AfricanAmerican;
        Latino = d.Latino;
    } else {
        school = d.data.School;
        district = d.data.District;
        FRPLGradRate = d.data.FRPLGradRate;
        Rigorous = d.data.RigorousCourses;
        AfricanAmerican = d.data.AfricanAmerican;
        Latino = d.data.Latino;
    }
    return document.getElementById("caption").innerHTML = "<strong>School:</strong> " + school +
        "<br/><strong>District:</strong> " + district + "<br/><strong>Graduation Rate (FRPL):</strong> "
        + FRPLGradRate.toFixed(2) + "%<br/><strong>Graduates that took AP/IB courses:</strong> "
        + Rigorous.toFixed(2) + "<strong>%<br/>Black/African American:</strong> "
        + AfricanAmerican.toFixed(2) + "<strong>%<br/>Hispanic/Latino:</strong> "
        + Latino.toFixed(2) + "<strong>%</strong>";
}


// put the data into a hierarchical format to be passed to the drawTree function
function prepTree(data) {
    var root = stratify(data); // change the data to a hierarchical format

    // size the nodes based on the grad rate of seniors on Free/Reduced Price Lunch
    root
        .sum(function(d) { return d.FRPLGradRate; })
        .sort(function(a, b) { return b.height - a.height || b.FRPLGradRate - a.FRPLGradRate; })
    ;

    // create the treemap
    map(root);

    return root;
}