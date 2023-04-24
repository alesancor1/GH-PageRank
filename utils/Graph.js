/**
 * @typedef {Object} Node Graph Node
 * @property {string} login GitHub login
 * @property {number} rank PageRank rank
 * @property {string} avatarUrl GitHub avatar URL
 * @property {Array<Node>} categories User top categories
 * 
 * @typedef {Object} Edge Graph Edge
 * @property {string} source Source node login
 * @property {string} target Target node login
 */

import { generateSvg } from "./graphplot.js";
import { writeFileSync } from "fs";

/**
 *  Simple network graph implementation */
export class Graph {

    /**
     * @param {Array<Node>} nodes Graph vertices
     * @param {Array<Edge>} edges Graph edges
     */
    constructor(nodes, edges) {
        this.nodes = nodes ?? [];
        this.edges = edges ?? [];
    }

    /** Ranks a node or create a new one if it doesn't exist
     * @param {Node} node - Graph node to rank
     * @param {number} rank - PageRank rank
     */
    rankNode(node, rank, categories=[]) {
        let n = this.nodes.find(n => n.login === node.login);
        if (n) n.rank = rank;
        else this.nodes.push({ login: node.login, rank, avatarUrl: node.avatarUrl, categories: categories ?? [] });
    }

    /** Add edges to the graph based on a node's followers
     * @param {Node} node - Graph node to add followers to
     */
    addFollowers(node) {
        node.followers.forEach(n => {
            if (!this.edges.find(e => e.source === n.login && e.target === node.login)) {
                this.edges.push({ source: n.login, target: node.login });
            }
        });
    }
    
    /** Sorts the graph nodes by rank. Original graph is not modified
     * @returns {Graph} Sorted graph
     */
    sorted() {
        return new Graph(this.nodes.sort((a, b) => b.rank - a.rank), this.edges);
    }

    /** Saves the graph as an SVG file 
     * @param {boolean} save - Whether to save the SVG file
     * @param {string} path - Path to save the SVG file
     * @returns {Promise<string>} SVG file contents
    */
    async plot(save = true, fileName = "graph.svg") {
        const svg = await generateSvg(this.sorted());
        if (save) writeFileSync(`${process.cwd()}/${fileName}`, svg);
        return svg;
    }

    /** Saves the graph as a JSON file
     * @param {boolean} save - Whether to save the JSON file
     * @param {string} path - Path to save the JSON file
     * @returns {string} JSON file contents
     * */
    json(save = true, fileName = "graph.json") {
        const json = JSON.stringify(this, null, 2);
        if (save) writeFileSync(`${process.cwd()}/${fileName}`, json);
        return json;
    }
}