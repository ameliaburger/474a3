var width = 750;
var height = 450;
var margin = {top: 20, right: 15, bottom: 30, left: 40};
var w = width - margin.left - margin.right;
var h = height - margin.top - margin.bottom;

var dataset; //the full dataset

d3.csv("SchoolData.csv", function(error, schools) {
    //read in the data
    if (error) return console.warn(error);
    schools.forEach(function(d) {
        d.AcademicYear = d.AcademicYear;
        d.District = d.District;
        d.School = d.School;
        d.FRPL = +d.FRPL;
        d.ELL = +d.ELL;
        d.Total = +d.Total;
        d.Graduating = +d.Graduating;
        d.GradRate = (d.Graduating/ d.Total) * 100;
    });
    //dataset is the full dataset -- maintain a copy of this at all times
    dataset = schools;

    //all the data is now loaded, so draw the initial vis
    drawVis(dataset.filter(function(d) { return d['School'] == 'All' }));
});

//none of these depend on the data being loaded so fine to define here
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

var x = d3.scaleOrdinal()
    .domain(["2010", "2011", "2012", "2013", "2014"])
    .range([0, w/4, 2*w/4, 3*w/4, w]);

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
    .text("Year");

var y = d3.scaleLinear()
    .domain([55, 95])
    .range([h, 0]);

var yAxis = d3.axisLeft()
    .scale(y);

chart.append("g")
    .attr("class", "axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Graduation Rate");

// Define the lines
var valueline = d3.line()
    .x(function(d) { return x(getX(parseInt(d.AcademicYear))); })
    .y(function(d) { return y(d.GradRate); });


function drawVis(data) { //draw the circiles initially and on each interaction with a control

    var circle = chart.selectAll("circle")
        .data(data);

    circle
        .attr("cx", function(d) { return x(d.AcademicYear);  })
        .attr("cy", function(d) { return y(d.GradRate);  })
        .style("fill", function(d) { return col(d.District); });

    circle.exit().remove();

    circle.enter().append("circle")
        .attr("cx", function(d) { return x(d.AcademicYear);  })
        .attr("cy", function(d) { return y(d.GradRate);  })
        .attr("r", 4)
        .style("fill", function(d) { return col(d.District); })
        .style("stroke", "black")
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1.0);
            tooltip.html(d.District + ": " + d.GradRate.toFixed(2) + "%, " + d.AcademicYear)
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    chart.append("path")
        .data(data.filter(function(d) { return d['District'] == 'Auburn School District' }))
        .attr("class", "line")
        .attr("d", valueline);
}

function getX(num) {
    console.log(num);
    if (num == 2010) {
        return 0;
    } else if (num == 2011) {
        return w/4;
    } else if (num == 2012) {
        return 2*w/4;
    } else if (num == 2013) {
        return 3*w/4;
    } else {
        return w;
    }
}

/*
function filterType(mytype) {
    // check "all"
    if(mytype == "all"){
        // reset currTypes
        currTypes[0][1] = true;
        for (i = 1; i < currTypes.length; i++) {
            currTypes[i][1] = false;
        }
        console.log(currTypes);

        // uncheck the other boxes
        document.getElementById("tech").checked = false;
        document.getElementById("transp").checked = false;
        document.getElementById("retail").checked = false;
        document.getElementById("fastfood").checked = false;
        document.getElementById("pharm").checked = false;

        var toVisualize = dataset.filter(function(d) { return isInRange(d)});
        drawVis(toVisualize);

    } else {
        // any box besides "all" checked

        // check and uncheck appropriate boxes
        document.getElementById("all").checked = false;

        // update currTypes
        currTypes[0][1] = false;
        for (i = 1; i < currTypes.length; i++) {
            if (currTypes[i][0] == mytype) {
                if (currTypes[i][1]) {
                    currTypes[i][1] = false;
                    document.getElementById(mytype).checked = false;

                } else {
                    currTypes[i][1] = true;
                    document.getElementById(mytype).checked = true;
                }
            }
        }

        // filter based on currTypes
        var ndata = filterOnCurrTypes(dataset);

        // filter to account for sliders and drawVis
        ndata = ndata.filter(function(d) { return isInRange(d)});
        drawVis(ndata);
    }
}

// handle price slider
$(function() {
    $("#price").slider({
        range: true,
        min: 0,
        max: maxPrice,
        values: [ 0, maxPrice ],

        slide: function(event, ui ) {
            $("#priceamount").val(ui.values[0] + " - " + ui.values[1]); filterVolume("price", ui.values);
        } //end slide function
    }); //end slider

    $("#priceamount").val($("#price").slider("values", 0) + " - " + $("#price").slider("values", 1));
}); //end function


// handle volume slider
$(function() {
    $("#volume").slider({
        range: true,
        min: 0,
        max: maxVolume,
        values: [ 0, maxVolume ],

        slide: function(event, ui ) {
            $("#volumeamount").val(ui.values[0] + " - " + ui.values[1]); filterVolume("vol", ui.values);
        } //end slide function
    }); //end slider

    $("#volumeamount").val($("#volume").slider("values", 0) + " - " + $("#volume").slider("values", 1));
}); //end function

function filterVolume(attr, values) {
    for (i = 0; i < attributes.length; i++){
        if (attr == attributes[i]){
            ranges[i] = values;
        }
    }
    var toVisualize = dataset.filter(function(d) { return isInRange(d)});
    if (!currTypes[0][1]) {
        toVisualize = filterOnCurrTypes(toVisualize);
    }
    drawVis(toVisualize);
}

function isInRange(datum) {
    for (i = 0; i < attributes.length; i++) {
        if (datum[attributes[i]] < ranges[i][0] || datum[attributes[i]] > ranges[i][1]) {
            return false;
        }
    }
    return true;
}
*/