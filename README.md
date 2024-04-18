# fix-gh-watchlist

[![NPM Version](https://img.shields.io/npm/v/fix-gh-watchlist?style=flat-square)](https://www.npmjs.com/package/fix-gh-watchlist)

cli to unsubscribe (ignore) github repos from https://github.com/watching

## usage

1. Create new [GitHub PAT Token](https://github.com/settings/tokens/new?description=Fix+watchlist+token&scopes=repo,notifications) - Make sure it has access to repo & notifications
2. Install script:

```bash
npm install -g fix-gh-watchlist
```

3. Create a `whitelist.txt` file with repo names (in `org/repo` format) you want to keep watching
4. Run the script:

```bash
PAT_TOKEN=<your_github_pat_token> fix-gh-watchlist --org=github -w whitelist.txt
```

## development

1. create a `.env` file with the following content:

```
PAT_TOKEN=<your_github_pat_token>
```

2. then run:

```bash
npm i
npm run watch
npm start -- --org=github -w whitelist.txt
```

### build

```bash
npm run build
cd dist && npm install -g .

# test
fix-gh-watchlist --help

# cleanup
npm uninstall -g fix-gh-watchlist
```

### release

1. `make version-patch`
2. `git push --follow-tags`
3. `make publish`
