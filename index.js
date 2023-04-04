const Graph = require('./utils/Graph');
const pageRank = require('./utils/pagerank');

/* Main program */
function main() {
    const graph = new Graph();
    
    pageRank("alesancor1", graph).then(() => {
        graph.sorted().plot();
    });
}

main();