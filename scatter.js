var width = 750;
var height = 450;
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

d3.csv("SchoolData.csv", function(error, schools) {
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

    //all the data is now loaded, so draw the initial vis
    drawVis(dataset);
});

// Define variables
var chart = d3.select(".chart")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom+15)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// color scale for school districts
var col = d3.scaleOrdinal(d3.schemeCategory10);

var x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, w]);

var xAxis = d3.axisBottom()
    .scale(x);

// add the x-axis to the vis
chart.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(0," + h + ")")
    .call(xAxis)
    .append("text")
    .attr("x", w)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("Percent of Seniors Taking AP/IB/Cambridge Courses");

var y = d3.scaleLinear()
    .domain([0, 100])
    .range([h, 0]);

var yAxis = d3.axisLeft()
    .scale(y);

// add the y-axis
chart.append("g")
    .attr("class", "axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Graduation Rate (All Students)");


function drawVis(data) { //draw the circiles initially and on each interaction with a control

    var circle = chart.selectAll("circle")
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



// filter by school district selected in dropdown
function filterDistrict(mydistrict) {
    currDistrict = mydistrict;
    console.log(mydistrict);
    var res = patt.test(currDistrict);
    if(res){
        var toVisualize = dataset.filter(function(d) { return isInRange(d)});
        drawVis(toVisualize);
    }else{
        var ndata = dataset
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

    var toVisualize = dataset.filter(function(d) { return isInRange(d)});

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