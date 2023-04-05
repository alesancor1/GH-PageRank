#!/usr/bin/env node

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Graph } from "../utils/Graph.js"
import { pageRank } from "../utils/pagerank.js";

const options = yargs(hideBin(process.argv))
    .demandCommand(2, "You need to provide a username and a token")
    .usage("Usage: gh-pagerank <username> <token> [options]")
    .option("damping-factor", { alias: "d", describe: "Damping factor", default: 0.85 })
    .option("depth", { alias: "p", describe: "Recursion depth of the graph", default: 3 })
    .option("limit", { alias: "l", describe: "Limit number of followers to fetch", default: 10 })
    .option("format", { alias: "f", describe: "Output format", choices: ["json", "svg"], default: "json" })
    .option("output", { alias: "o", describe: "Output file name", type: "string" })
    .version(false)
    .help(true)
    .parse();


const [ username, token ] = options._;
const { dampingFactor, depth, limit, output, format } = options;
process.env.GITHUB_TOKEN = token;

/* Main program */
const graph = new Graph();

pageRank(username, graph, dampingFactor, depth, limit).then(() => {
    const result = graph.sorted();
    
    if (format === "svg") {
        if (output && output.split(".").reverse()[0] !== "svg") console.log("Warning: Output file is not a .svg file")
        result.plot(true, output);
    } else {
        let json = result.json(output ? true : false, output)
        if (!output) console.log(json);
    }
});