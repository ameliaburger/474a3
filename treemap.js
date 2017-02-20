var dataset;

d3.csv("treemap.csv", function(error, schools) {
    //read in the data
    if (error) return console.warn(error);
    dataset = schools;

    var root = d3.stratify()
        .id(function(d) { return d.School; })
        .parentId(function(d) { return d.District; })
    (dataset);

    console.log(root);
});