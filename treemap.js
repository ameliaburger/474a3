// grabbing the svg to hold the visualization
var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// used to format labels in the treemap
var format = d3.format(",d");

var treemap = d3.treemap()
    .size([width, height])
    .paddingInner(1)
    .round(true);

// scale to color treemap nodes based on depth
var color = d3.scaleOrdinal(d3.schemeCategory20);

// loading the dataset
d3.csv("treemap.csv", function(error, schools) {
    //read in the data
    if (error) return console.warn(error);
    schools.forEach(function (d) {
        d.FRPL = +d.FRPL * 100;
        d.AfricanAmerican = d.AfricanAmerican * 100;
        d.Latino = d.Latino * 100;
        d.ELL = +d.ELL * 100;
        d.RigorousCourses = d.RigorousCourses * 100;
        d.GradRate = d.GradRate * 100;
        d.FRPLGradRate = d.FRPLGradRate * 100;
    });

    dataset = schools;

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

})

// add the treemap to the visualization
function drawTree(root) {

    // create a cell for each individual node in the tree
    var cell = svg
        .selectAll(".node")
        .data(root.leaves())
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
        .style("fill", function(d) { return color(d.data.District); });

    // format text in the rectangle so that is clipped off when it reaches the edge rather than
    // overflowing
    cell.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.id; })
        .append("use")
        .attr("xlink:href", function(d) { return "#rect-" + d.id + ""; });

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

    // format the text for all child nodes (schools)
    label
        .filter(function(d) { return !d.children; })
        .selectAll("tspan")
        .data(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1)
            .split(/(?=[A-Z][^A-Z])/g).concat(format(d.data.FRPLGradRate) + "%"); })
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function(d, i) { return 13 + i * 10; })
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