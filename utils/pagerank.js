import { getCategoriesFromUser } from './nlpcat.js';
import { fileURLToPath } from 'url';
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
export async function pageRank(node, graph, d = 0.85, p = 3, followLimit = 10, classifyNodes = false) {

    if (typeof node === "string")
        node = await _getNodeFromGitHub(node, followLimit, classifyNodes);

    // Calculate rank
    let rank = 1 - d;
    if (p > 0) {
        rank = rank + d * (await node.followers.reduce(async (acc, n) => {
            n = await _getNodeFromGitHub(n.login, followLimit, classifyNodes);
            return (await acc) + (await pageRank(n, graph, d, p - 1, followLimit, classifyNodes)) / n.following.length;
        }, 0));

        // Build graph
        graph.rankNode(node, rank);
        if (classifyNodes) graph.clasifyNode(node, ...Object.values(await getCategoriesFromUser(node)));
        if (p > 1) graph.addFollowers(node);
    }
    return rank;
}

/* GraphQL request to get node */
function _getNodeFromGitHub(name, limit, classifyNodes = false) {

    // Configure GraphQL request
    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` };
    const query = fs.readFileSync(`${__dirname}/../static/${classifyNodes ? 'query-repo.gql' : 'query.gql'}`, 'utf8')
        .replace(/\${.+}/g, (varName) => ({ name, limit })[varName.slice(2, -1)]);

    // Call graphQL
    return axios.post(`https://api.github.com/graphql`, { query }, { headers }).then(res => {
        if (res.data?.errors?.length > 0) throw new Error(res.data.errors[0].message);

        return {
            login: name,
            followers: res.data.data.user.followers.nodes.map(n => ({ login: n.login })),
            following: res.data.data.user.following.nodes.map(n => ({ login: n.login })),
            avatarUrl: res.data.data.user.avatarUrl ?? "https://avatars.githubusercontent.com/u/583231?v=4",
            ...( classifyNodes && {
                repositories: res.data.data.user.repositories.nodes.map(n => ({
                description: n.description ?? "",
                }))
            })
        }
    }).catch(err => {
        console.log("Error fetching data from GitHub: " + err.message);
        process.exit(1);
    });
}