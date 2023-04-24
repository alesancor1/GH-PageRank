import D3Node from 'd3-node';
const d3n = new D3Node();
const d3 = d3n.d3;

/** Generate the SVG file from a given graph
 * @param {Graph} graph Graph to generate SVG from
 * @returns {Promise<string>} SVG file contents
*/
export function generateSvg(graph) {
    return new Promise((resolve, _) => {

        const margin = {top: 10, right: 30, bottom: 30, left: 40};
        const width = 960 - margin.left - margin.right;
        const height = 540 - margin.top - margin.bottom;

        const svg = d3n
            .createSVG(width + margin.left + margin.right, height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        // Initialize links and nodes
        const defs = _createDefs(svg);
        const [link,] = _createLinks(svg, defs, graph);
        const [circle, image,] = _createNodes(svg, defs, graph);    

        //force simulation
        _createSimulation(graph, width, height).on("end", () => {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            circle.attr("cx", function (d) { return d.x; })
                .attr("cy", function(d) { return d.y; });

            image.attr("x", function (d) { return d.x - 40 * d.rank; })
                .attr("y", function(d) { return d.y - 40 * d.rank; })
                .append("title").text(d => `${d.login}\nrank: ${d.index + 1}\nscore: ${d.rank.toFixed(2)}\nmain category: ${d.mainCategory}\nother categories: ${d.otherCategories}`);

            resolve(d3n.svgString());
        });     
    });
}

function _createDefs(svg) {
    return svg.append("defs")
}

function _createLinks(svg, defs, graph) {
    const markers = defs
        .selectAll("marker")
        .data(graph.edges)
        .join("marker")
        .attr("id", d => `arrow-${d.source}-${d.target}`)
        .attr("markerWidth", 10)
        .attr("markerHeight", 7)
        .attr("refX", (d) => graph.nodes.find(n => n.login === d.target).rank * 40 + 10)
        .attr("refY", "3.5")
        .attr("orient", "auto")
        .append("polygon")
            .attr("points", "0 0, 10 3.5, 0 7")
    
    const links = svg
        .selectAll("line")
        .data(graph.edges)
        .join("line")
        .attr("marker-end", d => `url(#arrow-${d.source}-${d.target}`)
        .style("stroke", "#aaa")
    
    return [links, markers];
}

function _createNodes(svg, defs, graph) {
    const circle = defs
        .selectAll("clipPath")
        .data(graph.nodes)
        .join("clipPath")
        .attr("id", d => `myCircle-${d.login}`)
        .append("circle")
        .attr("r", (d) => 40 * d.rank)
        .style("fill", (d) => d3.interpolateBlues(d.rank))
    
    const image = svg
        .selectAll("image")
        .data(graph.nodes)
        .join("image")
        .attr("width", d => 80 * d.rank)
        .attr("height", d => 80 * d.rank)
        .attr("clip-path", d => `url(#myCircle-${d.login})`)
        .attr("xlink:href", d => d.avatarUrl)

    const label = svg.selectAll(null)
        .data(graph.nodes)
        .join("text")
        .text(function (d) { return d.login; })
        .style("text-anchor", "auto")
        .style("fill", "#555")
        .style("font-family", "Arial")
        .style("font-size", 12)
        .style("visibility", "hidden");

    return [circle, image, label];
}

function _createSimulation(graph, width, height) {
    return d3.forceSimulation(graph.nodes)
        .force("link", d3.forceLink(graph.edges).id(d => d.login))
        .force("charge", d3.forceManyBody().strength(graph.edges.length * 5))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(d => 40 * d.rank + 10));
}