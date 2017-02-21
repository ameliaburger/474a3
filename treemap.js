var GradRateRoot;
var FRPLGradRateRoot;
var RigourousCoursesRoot;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var format = d3.format(",d");

var treemap = d3.treemap()
    .size([width, height])
    .paddingOuter(3)
    .paddingTop(19)
    .paddingInner(1)
    .round(true);

var color = d3.scaleLinear()
    .domain([0, 2])
    .range(["steelblue", "white"]);

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

    var stratify = d3.stratify()
        .id(function (d) {
            return d.School;
        })
        .parentId(function (d) {
            return d.District;
        });

    root = stratify(dataset);

    GradRateRoot = root
        .sum(function(d) { return d.GradRate; })
        .sort(function(a, b) { return b.height - a.height || b.GradRate - a.GradRate; })
    ;
    treemap(GradRateRoot);

    /*
    FRPLGradRateRoot = root
        .sum(function(d) { return d.FRPLGradRate; })
        .sort(function(a, b) { return b.height - a.height || b.FRPLGradRate - a.FRPLGradRate; })
    ;
    treemap(FRPLGradRateRoot);

    RigourousCoursesRoot = root
        .sum(function(d) { return d.RigorousCourses; })
        .sort(function(a, b) { return b.height - a.height || b.RigorousCourses - a.RigorousCourses; })
    ;
    treemap(RigourousCoursesRoot);
    */

    drawTree(GradRateRoot);

})


function drawTree(root) {

    var cell = svg
        .selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
        .attr("class", "node")
        .each(function(d) { d.node = this; })
        .on("mouseover", hovered(true))
        .on("mouseout", hovered(false));

    cell.append("rect")
        .attr("id", function(d) { return "rect-" + d.id; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; })
        .style("fill", function(d) { return color(d.depth); });

    cell.append("clipPath")
        .attr("id", function(d) { return "clip-" + d.id; })
        .append("use")
        .attr("xlink:href", function(d) { return "#rect-" + d.id + ""; });

    var label = cell.append("text")
        .attr("clip-path", function(d) { return "url(#clip-" + d.id + ")"; });

    label
        .filter(function(d) { return d.children; })
        .selectAll("tspan")
        .data(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1)
            .split(/(?=[A-Z][^A-Z])/g).concat("\xa0" + format(d.data.GradRate) + "%"); })
        .enter().append("tspan")
        .attr("x", function(d, i) { return i ? null : 4; })
        .attr("y", 13)
        .text(function(d) { return d; });

    label
        .filter(function(d) { return !d.children; })
        .selectAll("tspan")
        .data(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1)
            .split(/(?=[A-Z][^A-Z])/g).concat(format(d.data.GradRate) + "%"); })
        .enter().append("tspan")
        .attr("x", 4)
        .attr("y", function(d, i) { return 13 + i * 10; })
        .text(function(d) { return d; });

    cell.append("title")
        .text(function(d) { return d.id + "\nGraduation Rate: " + format(d.data.GradRate) + "%"; });
}
/*
function reSize(elem) {
    if (elem == "RigorousCourses") {
        drawTree(RigourousCoursesRoot);
    } else if (elem == "FRPLGradRate") {
        drawTree(FRPLGradRateRoot);
    } else {
        drawTree(GradRateRoot);
    }
}
*/


function hovered(hover) {
    return function(d) {
        d3.selectAll(d.ancestors().map(function(d) { return d.node; }))
            .classed("node--hover", hover)
            .select("rect")
            .attr("width", function(d) { return d.x1 - d.x0 - hover; })
            .attr("height", function(d) { return d.y1 - d.y0 - hover; });
    };
}
