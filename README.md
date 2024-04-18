# fix-gh-watchlist

cli to unsubscribe (ignore) github repos from https://github.com/watching

## usage

1. Create new [GitHub PAT Token](https://github.com/settings/tokens/new?description=Fix+watchlist+token&scopes=repo,notifications) - Make sure it has access to repo & notifications
2.

## development

```bash
npm i
npm run watch
npm start -- --org=github -w whitelist.txt
```

## build

```bash
npm run build
cd dist && npm install -g .

# test
fix-gh-watchlist --help

# cleanup
npm uninstall -g fix-gh-watchlist
```
