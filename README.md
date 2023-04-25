# GITHUB PAGERANK

This is an implementation of the PageRank algorithm in Node.js applied to Social Networks analysis for GitHub. 

## CLI

A command line interface tool is available for generating a graph based on the PageRank score:

```
npx gh-pagerank <gh-username> <gh-token> [options]
```

| Option | Description |
| --- | --- |
| `-d`, `--damping-factor` | Damping factor (default: 0.85) |
| `-p`, `--depth` | Depth of the graph (default: 3) |
| `-l`, `--limit` | Limit the number of followers to retrieve (default: 10) |
| `-f`, `--format` | Output format: json/svg (default: `svg`) |
| `-o`, `--output` | Output file name. stdout (json) / temp.svg (svg) |
| `--classify-nodes`| Classify nodes based on their repo description  |