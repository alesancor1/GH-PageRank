import { fileURLToPath } from 'url';
import { Graph } from './Graph';
import { dirname } from 'path';
import axios from "axios";
import fs from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * PageRank algorithm
 * @param {Object} node GraphQL node containing login, followers and following
 * @param {Graph} graph Graph object to build during the recursive calls
 * @param {Number} d PageRank damping factor
 * @param {Number} p PageRank recursion depth
 * @returns Rank of the given node
 */
export async function pageRank(node, graph, d=0.85, p=3) {

    if (typeof node === "string") 
        node = await _getNodeFromGitHub(node);

    // Calculate rank
    let rank = 1 - d;
    if (p > 0) {  
        rank = rank + d * (await node.followers.reduce(async (acc, n) => {
            n = await _getNodeFromGitHub(n.login);
            return (await acc) + (await pageRank(n, graph, d, p-1)) / n.following.length;
        }, 0));

        // Build graph
        graph.rankNode(node, rank);
        if (p > 1) graph.addFollowers(node);
    }
    return rank;
}

/* GraphQL request to get node */
function _getNodeFromGitHub(name, followersLimit = 10, followingLimit = 10) {

    // Configure GraphQL request
    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` };
    const query = fs.readFileSync(`${__dirname}/../static/query.gql`, 'utf8')
        .replace(/\${.+}/g, (varName) => ({ name, followersLimit, followingLimit })[varName.slice(2, -1)]);
    
    // Call graphQL
    return axios.post(`https://api.github.com/graphql`, { query }, { headers }).then(res => {
        if (res.data?.errors?.length > 0) throw new Error(res.data.errors[0].message);
        
        return {
            login: name,
            followers: res.data.data.user.followers.nodes.map(n => ({ login: n.login })),
            following: res.data.data.user.following.nodes.map(n => ({ login: n.login })),
            avatarUrl: res.data.data.user.avatarUrl ?? "https://avatars.githubusercontent.com/u/583231?v=4"
        }
    }).catch(err => {
        console.log("Error fetching data from GitHub: " + err.message);
        process.exit(1);
    });
}