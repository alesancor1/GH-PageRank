const Graph = require('./Graph');
const axios = require('axios');
const fs = require('fs');

async function pageRank(node, graph, d=0.85, p=3) {
    
    // Calculate rank
    let rank = 1 - d;
    if (p > 0) {  
        rank = rank + d * (await node.followers.reduce(async (acc, n) => {
            n = await getNodeFromGitHub(n.login);
            return (await acc) + (await pageRank(n, graph, d, p-1)) / n.following.length;
        }, 0));

        // Build graph
        graph.rankNode(node, rank);
        if (p > 1) graph.addFollowers(node);
    }
    return rank;
}

function getNodeFromGitHub(name, followersLimit = 3, followingLimit = 3) {

    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` };

    const query = fs.readFileSync('./query.gql', 'utf8')
        .replace(/\${.+}/g, (varName) => ({ name, followersLimit, followingLimit })[varName.slice(2, -1)]);
    
    return axios.post(`https://api.github.com/graphql`, { query }, { headers }).then(res => 
        ({
            login: name,
            followers: res.data.data.user.followers.nodes.map(n => ({ login: n.login })),
            following: res.data.data.user.following.nodes.map(n => ({ login: n.login })),
            avatarUrl: res.data.data.user.avatarUrl ?? "https://avatars.githubusercontent.com/u/583231?v=4"
        })
    ).catch(err => {
        throw new Error("Error fetching data from GitHub: " + err.message);
    });
}

/* Main program */
function main() {
    const graph = new Graph();
    
    getNodeFromGitHub("alesancor1").then(n => {
        pageRank(n, graph).then(() => {
            graph.sorted().plot();
        });
    });
}

main();