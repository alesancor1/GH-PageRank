const graphPlot = require('./graphplot');

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
        graphPlot(this);     
    }
}