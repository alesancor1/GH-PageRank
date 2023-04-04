import { Graph } from "./utils/graph.js"
import { pageRank } from "./utils/pagerank.js";

/* Main program */
function main() {
    const graph = new Graph();
    
    pageRank("alesancor1", graph).then(() => {
        graph.sorted().plot();
    });
}

main();