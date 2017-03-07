var width = 810;
var height = 290;
var margin = {top: 20, right: 15, bottom: 30, left: 40};
var w = width - margin.left - margin.right;
var h = height - margin.top - margin.bottom; // set the height, width, and margins for the visualization space




// VARIABLES - BOTH

var dataset; //the full dataset
var scatterData; //the dataset without district or "all" data
var stratify; // to put the data into a hierarchical format

// color scale for school districts
var col = d3.scaleOrdinal(d3.schemeCategory10);

var opacity = 0.8;

var districts = [["All", true], ["Seattle Public Schools", false], ["Highline Public Schools", false],
    ["Tukwila School District", false], ["Renton School District", false], ["Kent School District", false],
    ["Federal Way Public Schools", false], ["Auburn School District", false]];
var currDistricts = districts; // keep track of the current districts that are selected and that should be displayed



// VARIABLES - SCATTERPLOT

// keep track of the value ranges selected for each slider
var attributes = ["AfricanAmerican", "Latino"];
var ranges = [[0, 100], [0, 100]];

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
    .attr("y", 0 - margin.left - 3)
    .attr("x",0 - (height / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Graduation Rates");



// VARIABLES - TREEMAP

var treemap = d3.select(".tree")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom + 15)
    .append("g");

var map = d3.treemap()
    .size([width, height])
    .paddingInner(1)
    .tile(d3.treemapResquarify)
    .round(true);




// FUNCTIONS - BOTH

d3.csv("treemap.csv", function(error, schools) { // load the data set
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
    drawVis(scatterData);


    // TREEMAP:
    // change the data to a hierarchical format
    stratify = d3.stratify()
        .id(function (d) {
            return d.School;
        })
        .parentId(function (d) {
            return d.District;
        });
    var root = stratify(dataset);

    // size the nodes based on the grad rate of seniors on Free/Reduced Price Lunch and create the treemap
    root
        .sum(function(d) { return d.FRPLGradRate; })
        .sort(function(a, b) { return b.height - a.height || b.FRPLGradRate - a.FRPLGradRate; })
    ;
    map(root);

    drawTree(root);
});




// FUNCTIONS - SCATTERPLOT

function drawVis(data) { //draw the circiles initially and on each interaction with a control

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
            var caption = document.getElementById("caption").innerHTML = "School: " + d.School +
                "<br/>District: " + d.District + "<br/>Graduation Rate (FRPL): "
                + d.FRPLGradRate.toFixed(2) + "%<br/>Graduates that took AP/IB Courses: "
                + d.RigorousCourses.toFixed(2) + "%<br/>Black/African American: "
                + d.AfricanAmerican.toFixed(2) + "%<br/>Hispanic/Latino: "
                + d.Latino.toFixed(2) + "%";

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

// filter by school district selected in dropdown
function filterDistrict(mydistrict) {
    // reset currDistricts to default
    currDistricts[0][1] = true;
    for (i = 1; i < currDistricts.length; i++) {
        currDistricts[i][1] = false;
    }

    if(mydistrict == "All"){
        var toVisualize = scatterData.filter(function(d) { return isInRange(d)});
        drawVis(toVisualize);

        //TREEMAP
        var root = stratify(dataset);

        // size the nodes based on the grad rate of seniors on Free/Reduced Price Lunch and create the treemap
        root
            .sum(function(d) { return d.FRPLGradRate; })
            .sort(function(a, b) { return b.height - a.height || b.FRPLGradRate - a.FRPLGradRate; })
        ;
        map(root);

        drawTree(root)
    }else{

        // update currDistricts to reflect current checkbox selections
        currDistricts[0][1] = false;
        for (i = 1; i < currDistricts.length; i++) {
            if (currDistricts[i][0] == mydistrict) {
                currDistricts[i][1] = true;
            }
        }

        //SCATTERPLOT
        var ndata = scatterData
            .filter(function(d) {
                return d.District == mydistrict;
            });
        // filter by sliders after filtering by district
        ndata = ndata.filter(function(d) { return isInRange(d)});
        drawVis(ndata);


        // TREEMAP
        var nTree = dataset;
        for (i = 1; i < currDistricts.length; i++) {
            if (!currDistricts[i][1]) {
                nTree = nTree.filter(function(d) {
                    return d.District != currDistricts[i][0]; // return all schools not in that district
                });
                nTree = nTree.filter(function(d) {
                    return d.School != currDistricts[i][0]; // remove the district parent from the hierarchy
                });
            }
        }

        var root = stratify(nTree);

        // size the nodes based on the grad rate of seniors on Free/Reduced Price Lunch and create the treemap
        root
            .sum(function(d) { return d.FRPLGradRate; })
            .sort(function(a, b) { return b.height - a.height || b.FRPLGradRate - a.FRPLGradRate; })
        ;
        map(root);

        //clear(root);
        drawTree(root)
    }
}

function clear(root) {

    console.log(root.leaves());

    var node = treemap// treemap is the g element, which is the parent node
        .selectAll(".node")
        .data(root.leaves());

    node
        .selectAll("rect")
        .data(root.leaves());

    node
        .selectAll("text")
        .data(root.leaves());

    node
        .selectAll("g")
        .data(root.leaves());

    node.exit().remove();
    node.selectAll("rect").exit().remove();
    node.selectAll("text").exit().remove();
    node.selectAll("g").exit().remove();

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

    var toVisualize = scatterData.filter(function(d) { return isInRange(d)});

    // filter by school district
    if (currDistrict != "All") {
        toVisualize = toVisualize.filter(function(d) {
            return d.District == currDistrict;
        });
    }
    drawVis(toVisualize);
}

// check if the data point fits within the ranges of both sliders
function isInRange(datum) {
    for (i = 0; i < attributes.length; i++) {
        if (datum[attributes[i]] < ranges[i][0] || datum[attributes[i]] > ranges[i][1]) {
            return false;
        }
    }
    return true;
}



// FUNCTIONS - TREEMAP
function drawTree(root) { // add the treemap to the visualization

    // data bind
    var node = treemap
        .selectAll("g")
        .data(root.leaves());

    node
        .selectAll("rect")
        .data(root.leaves());

    node
        .selectAll("text")
        .data(root.leaves());

    //var rectangles = document.getElementsByClassName("node");
    //console.log(rectangles);

    console.log(root.leaves());

    // enter
    var newNode = node.enter()
        .append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("class", "node")
        .each(function(d) { d.node = this; })
        .on("mouseover", function(d) {
            var caption = document.getElementById("caption").innerHTML = "School: " + d.data.School +
                "<br/>District: " + d.data.District + "<br/>Graduation Rate (FRPL): "
                + d.data.FRPLGradRate.toFixed(2) + "%<br/>Graduates that took AP/IB Courses: "
                + d.data.RigorousCourses.toFixed(2) + "%<br/>Black/African American: "
                + d.data.AfricanAmerican.toFixed(2) + "%<br/>Hispanic/Latino: "
                + d.data.Latino.toFixed(2) + "%";

            d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
                .classed("node--hover", true)
                .select("rect");

            // highlight the appropriate node on the scatterplot
            d3.selectAll("circle")
                .select( function(scatterD) { return scatterD.School == d.data.School?this:null; })
                .attr("r", 11)
                .style("opacity", 1);
        })
        .on("mouseout", function(d) {
            var caption = document.getElementById("caption").innerHTML = "";

            d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
                .classed("node--hover", false);

            // unhighlight the appropriate node on the scatterplot
            d3.selectAll("circle")
                .select( function(scatterD) { return scatterD.School == d.data.School?this:null; })
                .attr("r", 5)
                .style("opacity", opacity);
        });

    newNode.append("rect");
    newNode.append("text");

    // update
    treemap.selectAll(".node g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    treemap
        .selectAll(".node rect")
        .attr("id", function(d) { return "rect-" + d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", function(d) { return col(d.data.District); })
        .style("opacity", opacity)
        .on("mouseover", function(d) {
            d3.select(this).style("opacity", 1);
        })
        .on("mouseout", function(d) {
            d3.select(this).style("opacity", opacity);
        });


    treemap
        .selectAll(".node text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; })
        .selectAll("tspan")
        .data(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1)
            .split(/(?=[A-Z][^A-Z])/g); })
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function(d, i) { return 13 + i * 10; })
        .text(function(d) { return d; });

    // exit
    node.selectAll("rect").exit().remove();
    node.selectAll("g").exit().remove();
    node.exit().remove();
}


// show the tooltip when hovering over a rectangle
function hovered(hover) {
    return function(d) {
        d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
            .classed("node--hover", hover)
            .select("rect")
            .attr("width", function(d) { return d.x1 - d.x0 - hover; })
            .attr("height", function(d) { return d.y1 - d.y0 - hover; });
    }
}