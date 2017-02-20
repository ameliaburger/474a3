var width = 750;
var height = 450;
var margin = {top: 20, right: 15, bottom: 30, left: 40};
var w = width - margin.left - margin.right;
var h = height - margin.top - margin.bottom;

var datahier;
var root;

d3.csv("treemap.csv", function(error, schools) {
    //read in the data
    if (error) return console.warn(error);
    d.School = d.School;
    d.District = d.District;
    d.Value = +d.Value;

    datahier = schools;

    root = d3.stratify()
        .id(function(d) { return d.School; })
        .parentId(function(d) { return d.District; })
    (datahier);

    drawMap(root);
});

//none of these depend on the data being loaded so fine to define here
var svg = d3.select("body").append("svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom+15)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var treemap = d3.treemap()
    .size([w, h])
    .padding(4);

function drawMap(root) {
    var tree = treemap(root);
    console.log(tree);
}