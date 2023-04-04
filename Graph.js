const D3Node = require('d3-node');
const fs = require('fs');
const d3n = new D3Node();
const d3 = d3n.d3;

module.exports = class Graph {
    constructor(nodes, edges) {
        this.nodes = nodes ?? [];
        this.edges = edges ?? [];
    }

    rankNode(node, rank) {
        let n = this.nodes.find(n => n.login === node.login);
        if (n) n.rank = rank;
        else this.nodes.push({ login: node.login, rank, avatarUrl: node.avatarUrl });
    }

    addFollowers(node) {
        node.followers.forEach(n => {
            if (!this.edges.find(e => e.source === n.login && e.target === node.login)) {
                this.edges.push({ source: n.login, target: node.login });
            }
        });
    }
    
    sorted() {
        return new Graph(this.nodes.sort((a, b) => b.rank - a.rank), this.edges);
    }

    plot() {
        const margin = {top: 10, right: 30, bottom: 30, left: 40};
        const width = 400 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3n
            .createSVG(width + margin.left + margin.right, height + margin.top + margin.bottom)
            .append('g')
                .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        // Create defs section
        const defs = svg.append("defs");

        // Create arrow markers
        defs
        .selectAll("marker")
        .data(this.edges)
        .join("marker")
        .attr("id", d => `arrow-${d.source}-${d.target}`)
        .attr("markerWidth", 10)
        .attr("markerHeight", 7)
        .attr("refX", (d) => this.nodes.find(n => n.login === d.target).rank * 40 + 10)
        .attr("refY", "3.5")
        .attr("orient", "auto")
        .append("polygon")
            .attr("points", "0 0, 10 3.5, 0 7")

        // Initialize the links
        const link = svg
            .selectAll("line")
            .data(this.edges)
            .join("line")
            .attr("marker-end", d => `url(#arrow-${d.source}-${d.target}`)
            .style("stroke", "#aaa")

        // Create clip paths
        const circle = defs
            .selectAll("clipPath")
            .data(this.nodes)
            .join("clipPath")
            .attr("id", d => `myCircle-${d.login}`)
            .append("circle")
            .attr("r", (d) => 40 * d.rank)
            .style("fill", (d) => d3.interpolateBlues(d.rank))
            
        // Initialize the nodes
        const image = svg
            .selectAll("image")
            .data(this.nodes)
            .join("image")
            .attr("width", d => 80 * d.rank)
            .attr("height", d => 80 * d.rank)
            .attr("clip-path", d => `url(#myCircle-${d.login})`)
            .attr("xlink:href", d => d.avatarUrl)
            
        // Labels
        const label = svg.selectAll(null)
            .data(this.nodes)
            .join("text")
            .text(function (d) { return d.login; })
            .style("text-anchor", "middle")
            .style("fill", "#555")
            .style("font-family", "Arial")
            .style("font-size", 12);

        //force simulation
        const simulation = d3.forceSimulation(this.nodes)
            .force("link", d3.forceLink(this.edges).id(d => d.login))
            .force("charge", d3.forceManyBody().strength(-400))
            .force("center", d3.forceCenter(width / 2, height / 2));

        // Let's list the force we wanna apply on the network
        simulation
            .force("link")
            .links(this.edges);

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        simulation.on("end", () => {
            link
                .attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            circle
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            image
                .attr("x", function (d) { return d.x - 40 * d.rank; })
                .attr("y", function(d) { return d.y - 40 * d.rank; });

            label
                .attr("x", function (d) { return d.x; })
                .attr("y", function(d) { return d.y; });

            fs.writeFileSync('./graph.svg', d3n.svgString());
        });      
    }
}