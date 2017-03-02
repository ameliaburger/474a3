var width = 800;
var height = 275;
var margin = {top: 20, right: 15, bottom: 30, left: 40};
var w = width - margin.left - margin.right;
var h = height - margin.top - margin.bottom; // set the height, width, and margins for the visualization space

// compare to value when filtering by school district
var patt = new RegExp("All");
var currDistrict = "All"; // keep track of district being filtered

// keep track of the value ranges selected for each slider
var attributes = ["AfricanAmerican", "Latino"];
var ranges = [[0, 100], [0, 100]];

var dataset; //the full dataset
var scatterData; //the dataset without hierarchy

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
            return d.District != ("All" || "");
        });

    //all the data is now loaded, so draw the initial scatterplot
    drawVis(scatterData);


    // TREEMAP:
    // change the data to a hierarchical format
    var stratify = d3.stratify()
        .id(function (d) {
            return d.School;
        })
        .parentId(function (d) {
            return d.District;
        });
    root = stratify(dataset);

    // size the nodes based on the grad rate of seniors on Free/Reduced Price Lunch and create the treemap
    root
        .sum(function(d) { return d.FRPLGradRate; })
        .sort(function(a, b) { return b.height - a.height || b.FRPLGradRate - a.FRPLGradRate; })
    ;
    treemap(root);

    drawTree(root);
});

// Define variables
var scatterplot = d3.select(".scatterplot")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tree = d3.select(".tree")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom + 15)
    .append("g");

var treemap = d3.treemap()
    .size([width, height])
    .paddingOuter(3)
    .paddingTop(19)
    .paddingInner(1)
    .round(true);

// used to format labels in the treemap
var format = d3.format(",d");

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// color scale for school districts
var col = d3.scaleOrdinal(d3.schemeCategory20);

// scale to color treemap nodes based on depth
var color = d3.scaleLinear()
    .domain([0, 2])
    .range(["steelblue", "white"]);

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
        .attr("r", 4)
        .style("fill", function(d) { return col(d.District); })
        .style("stroke", "black")
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);

            // the content to be displayed in the tooltip
            tooltip.html("District: " + d.District + "<br/>School: " + d.School + "<br/>Graduation Rate (FRPL): " +
                d.FRPLGradRate.toFixed(2) + "%<br/>Graduates that took AP/IB/Cambridge Courses: "
                + d.RigorousCourses.toFixed(2) + "%<br/>Black/African American: "
                + d.AfricanAmerican.toFixed(2) + "%<br/>Hispanic/Latino: "
                + d.AfricanAmerican.toFixed(2) + "%")
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}


// add the treemap to the visualization
function drawTree(root) {

    // create a cell for each individual node in the tree
    var cell = tree
        .selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("class", "node")
        .each(function(d) { d.node = this; })
        .on("mouseover", hovered(true))
        .on("mouseout", hovered(false));

    // create a rectangle sized appropriately based on grad rate
    cell.append("rect")
        .attr("id", function(d) { return "rect-" + d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", function(d) { return col(d.data.District); });


    // append the text to be shown on each node
    var label = cell.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; });

    // format the text for any nodes with children (districts and the whole dataset)
    label
        .filter(function(d) { return d.children; })
        .selectAll("tspan")
        .data(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1)
            .split(/(?=[A-Z][^A-Z])/g).concat("\xa0" + format(getGradRate(d)) + "%"); })
        .enter().append("tspan")
        .attr("x", function(d, i) { return i ? null : 4; })
        .attr("y", 13)
        .text(function(d) { return d; });


    // define the text in the tooltip
    cell.append("title")
        .text(function(d) {
            if (d.depth == 2) { // for child nodes
                return d.id + "\nGraduation Rate: " + format(d.data.FRPLGradRate) +
                    "%\nGraduages that took AP/IB/Cambridge Courses: " + format(d.data.RigorousCourses) +
                    "%\nBlack/African American: " + format(d.data.AfricanAmerican) +
                    "%\nHispanic/Latino: " + format(d.data.Latino) + "%";

            } else { // for parent nodes
                return d.id + "\nGraduation Rate: " + format(getGradRate(d)) +
                    "%\nGraduages that took AP/IB/Cambridge Courses: " + format(d.data.RigorousCourses) +
                    "%\nBlack/African American: " + format(d.data.AfricanAmerican) +
                    "%\nHispanic/Latino: " + format(d.data.Latino) + "%";
            }
        });
}


// hard coding graduation rates for districts and the entire dataset to ensure
// tree map is shaped correctly - otherwise treemap includes gaps in the squares
// to account for the graduation rate of parent nodes
function getGradRate(d) {
    if (d.id == "Highline Public Schools") {
        return 0.5622 * 100;
    } else if (d.id == "Auburn School District") {
        return 0.6722 * 100;
    } else if (d.id == "Kent School District") {
        return 0.6884 * 100;
    } else if (d.id == "Federal Way Public Schools") {
        return 0.6745 * 100;
    } else if (d.id == "Seattle Public Schools") {
        return 0.6487 * 100;
    } else if (d.id == "Renton School District") {
        return 0.6983 * 100;
    } else if (d.id == "Tukwila School District") {
        return 0.5116 * 100;
    } else {
        return 0.6490 * 100;
    }
}


// show the tooltip when hovering over a rectangle
function hovered(hover) {
    return function(d) {
        d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
            .classed("node--hover", hover)
            .select("rect")
            .attr("width", function(d) { return d.x1 - d.x0 - hover; })
            .attr("height", function(d) { return d.y1 - d.y0 - hover; });
    };
}



// filter by school district selected in dropdown
function filterDistrict(mydistrict) {
    currDistrict = mydistrict;
    console.log(mydistrict);
    var res = patt.test(currDistrict);
    if(res){
        var toVisualize = scatterData.filter(function(d) { return isInRange(d)});
        drawVis(toVisualize);
    }else{
        var ndata = scatterData
            .filter(function(d) {
                return d.District == currDistrict;
            });
        // filter by sliders after filtering by district
        ndata = ndata.filter(function(d) { return isInRange(d)});
        drawVis(ndata);
    }
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