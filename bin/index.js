#!/usr/bin/env node

import fs from "fs";
import open from "open";
import yargs from "yargs";
import { join } from 'path';
import { tmpdir } from "os";
import { hideBin } from "yargs/helpers";
import { Graph } from "../utils/Graph.js"
import { pageRank } from "../utils/pagerank.js";

const options = yargs(hideBin(process.argv))
    .demandCommand(2, "You need to provide a username and a token")
    .usage("Usage: gh-pagerank <username> <token> [options]")
    .option("damping-factor", { alias: "d", describe: "Damping factor", default: 0.85 })
    .option("depth", { alias: "p", describe: "Recursion depth of the graph", default: 3 })
    .option("limit", { alias: "l", describe: "Limit number of followers to fetch", default: 10 })
    .option("format", { alias: "f", describe: "Output format", choices: ["json", "svg"], default: "svg" })
    .option("output", { alias: "o", describe: "Output file name", type: "string" })
    .option("classify-nodes", {describe: "Classify each user based on their repositories", type: "boolean"})
    .version(false)
    .help(true)
    .parse();


const [ username, token ] = options._;
const { dampingFactor, depth, limit, output, format, classifyNodes } = options;
process.env.GITHUB_TOKEN = token;

/* Main program */
const graph = new Graph();

pageRank(username, graph, dampingFactor, depth, limit, classifyNodes).then(() => {
    const result = graph.sorted();
    
    if (format === "svg") {
        if (output && output.split(".").reverse()[0] !== "svg") console.log("Warning: Output file is not a .svg file")
        result.plot(output ? true : false, output).then(async (svg) => {
            if (!output) {
                const tempdir = join(tmpdir(), 'gh-pagerank');
                if (!fs.existsSync(tempdir)) fs.mkdirSync(tempdir);
                fs.writeFileSync(`${tempdir}/graph.svg`, svg);
                await open(`${tempdir}/graph.svg`);
            }
            else {
                await open(output);
            }
        });
    } else {
        let json = result.json(output ? true : false, output)
        if (!output) console.log(json);
    }
});