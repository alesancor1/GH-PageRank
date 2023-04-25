import natural from "natural";

const tokenizer = new natural.WordTokenizer();
const stopwords = new Set(natural.stopwords);
const stemmer = natural.PorterStemmer;

export async function getCategoriesFromUser(node, numTopics = 4) {
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
        const tokens = description.split(' ');
        // trim tokens
        for (let i = 0; i < tokens.length; i++) {
            tokens[i] = tokens[i].trim();
        }
        // count keywords
        for (const token of tokens) {
            if (mlKeywords.has(token)) {
                mlCount++;
            } else if (webKeywords.has(token)) {
                webCount++;
            } else if (mobileKeywords.has(token)) {
                mobileCount++;
            } else if (devOpsKeywords.has(token)) {
                devOpsCount++;
            } else if (securityKeywords.has(token)) {
                securityCount++;
            } else if (gameDevKeywords.has(token)) {
                gameDevCount++;
            }
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
        mainCategory: categories.slice(0, 1).map(category => category.name)[0],
        otherCategories: categories.slice(1, numTopics).map(category => category.name)
    };

}