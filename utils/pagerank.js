import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from "axios";
import fs from "fs";
import natural from "natural";

const __dirname = dirname(fileURLToPath(import.meta.url));

const tokenizer = new natural.WordTokenizer();
const stopwords = new Set(natural.stopwords);
const stemmer = natural.PorterStemmer;
/**
 * PageRank algorithm
 * @param {Object} node GraphQL node containing login, followers and following
 * @param {Graph} graph Graph object to build during the recursive calls
 * @param {Number} d PageRank damping factor
 * @param {Number} p PageRank recursion depth
 * @returns Rank of the given node
 */
export async function pageRank(node, graph, d = 0.85, p = 3, followLimit = 10, numTopics = 3) {

    if (typeof node === "string")
        node = await _getNodeFromGitHub(node, followLimit);

    // Calculate rank
    let rank = 1 - d;
    if (p > 0) {
        rank = rank + d * (await node.followers.reduce(async (acc, n) => {
            n = await _getNodeFromGitHub(n.login, followLimit);
            return (await acc) + (await pageRank(n, graph, d, p - 1)) / n.following.length;
        }, 0));

        const categories = await _getCategoriesFromUser(node, numTopics);
        const mainCategory = categories.mainCategory;
        const otherCategories = categories.otherCategories;

        // Build graph
        graph.rankNode(node, rank, mainCategory, otherCategories);
        if (p > 1) graph.addFollowers(node);
    }
    return rank;
}

async function _getCategoriesFromUser(node) {
    const descriptions = node.repositories.map(repo => repo.description || '');
    const preprocessedDescriptions = descriptions.map(description => {
        const tokens = tokenizer.tokenize(description.toLowerCase());
        const filteredTokens = tokens.filter(token => !stopwords.has(token) && token.length > 2);
        const stemmedTokens = filteredTokens.map(token => stemmer.stem(token));
        return stemmedTokens.join(' ');
    });

    const mlKeywords = new Set([
        'machine learning', 'deep learning', 'neural network'
    ]);
    const webKeywords = new Set([
        'web', 'html', 'css', 'javascript', 'react', 'angular', 'vue', 'frontend', 'backend'
    ]);
    const mobileKeywords = new Set([
        'mobile', 'android', 'ios', 'swift', 'java', 'kotlin'
    ]);
    const devOpsKeywords = new Set([
        'devops', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'
    ]);
    const securityKeywords = new Set([
        'security', 'encryption', 'penetration testing', 'owasp'
    ]);
    const gameDevKeywords = new Set([
        'unity', 'unreal', 'game development', 'game design'
    ]);

    let mlCount = 0;
    let webCount = 0;
    let mobileCount = 0;
    let devOpsCount = 0;
    let securityCount = 0;
    let gameDevCount = 0;

    for (const description of preprocessedDescriptions) {
        for (const keyword of description) {
            if (mlKeywords.has(keyword)) mlCount++;
            if (webKeywords.has(keyword)) webCount++;
            if (mobileKeywords.has(keyword)) mobileCount++;
            if (devOpsKeywords.has(keyword)) devOpsCount++;
            if (securityKeywords.has(keyword)) securityCount++;
            if (gameDevKeywords.has(keyword)) gameDevCount++;
        }
    }

    const categories = [
        { name: 'Machine Learning', count: mlCount },
        { name: 'Web Development', count: webCount },
        { name: 'Mobile Development', count: mobileCount },
        { name: 'DevOps', count: devOpsCount },
        { name: 'Security', count: securityCount },
        { name: 'Game Development', count: gameDevCount }
    ];

    categories.sort((a, b) => b.count - a.count);

    return {
        mainCategory: categories.slice(0, 1).map(category => category.name),
        otherCategories: categories.slice(1, 3).map(category => category.name)
    };

}

/* GraphQL request to get node */
function _getNodeFromGitHub(name, limit) {

    // Configure GraphQL request
    const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` };
    const query = fs.readFileSync(`${__dirname}/../static/query.gql`, 'utf8')
        .replace(/\${.+}/g, (varName) => ({ name, limit })[varName.slice(2, -1)]);

    // Call graphQL
    return axios.post(`https://api.github.com/graphql`, { query }, { headers }).then(res => {
        if (res.data?.errors?.length > 0) throw new Error(res.data.errors[0].message);

        return {
            login: name,
            followers: res.data.data.user.followers.nodes.map(n => ({ login: n.login })),
            following: res.data.data.user.following.nodes.map(n => ({ login: n.login })),
            avatarUrl: res.data.data.user.avatarUrl ?? "https://avatars.githubusercontent.com/u/583231?v=4",
            repositories: res.data.data.user.repositories.nodes.map(n => ({
                description: n.description ?? "",
            })),
        }
    }).catch(err => {
        console.log("Error fetching data from GitHub: " + err.message);
        process.exit(1);
    });
}