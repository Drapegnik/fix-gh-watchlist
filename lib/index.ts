import 'dotenv/config';
import * as fs from 'fs';
import {Octokit} from '@octokit/core';

import yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';

const helpText =
  '\nPAT_TOKEN=<token> fix-gh-watchlist --org=github -w <whitelist file path>';

const argv = yargs(hideBin(process.argv))
  .option('w', {
    alias: 'whitelist',
    describe: 'Whitelist file path',
    type: 'string',
    demandOption: false,
  })
  .option('org', {
    describe: 'GitHub organization name',
    type: 'string',
    demandOption: true,
  })
  .option('f', {
    alias: 'force',
    describe: 'To execute unsubscribe action',
    type: 'boolean',
    demandOption: false,
  })
  .example('', helpText)
  .parseSync();

const token = process.env.PAT_TOKEN;
const orgName = argv.org;
const whitelistFilePath = argv.w;
const dryRun = !argv.f;

const GH_API_VERSION = '2022-11-28';
const headers = {
  'X-GitHub-Api-Version': GH_API_VERSION,
};

async function readWhitelistFromFile(filePath?: string): Promise<string[]> {
  if (!filePath) {
    console.log('\tNo whitelist file provided!');
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const repos = data
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    console.log(`\tRead ${repos.length} whitelisted repos`);

    return repos;
  } catch (error) {
    console.error('Error reading whitelist file:', error);
    return [];
  }
}

async function fetchAllOrgWatchedRepos(octokit: Octokit, orgName: string) {
  try {
    const repos: string[] = [];
    let page = 1;

    while (true) {
      const response = await octokit.request('GET /user/subscriptions', {
        page,
        per_page: 100,
        headers,
      });

      if (response.data.length === 0) {
        break;
      }
      repos.push(...response.data.map((r) => r.full_name));
      page++;
    }

    const orgRepos = repos.filter((r) => r.startsWith(`${orgName}/`));
    console.log(
      `\tFound ${orgRepos.length} subscriptions to @${orgName} repos`
    );

    return orgRepos;
  } catch (error) {
    console.error('Error featching subscriptions:', error);
    return [];
  }
}

async function ignoreRepo(octokit: Octokit, repoName: string) {
  console.log(`\t\tUnsubscribing from ${repoName} (Ignoring)`);
  const [owner, repo] = repoName.split('/');
  return octokit.request('PUT /repos/{owner}/{repo}/subscription', {
    owner,
    repo,
    subscribed: false,
    ignored: true,
    headers,
  });
}

async function run() {
  try {
    if (!token) {
      console.log('Please provide PAT_TOKEN env var');
      return;
    }

    const octokit = new Octokit({auth: token});

    if (dryRun) {
      console.log('\tExecuting in dry-run mode.');
    }
    const repos = await fetchAllOrgWatchedRepos(octokit, orgName);
    const whitelist = await readWhitelistFromFile(whitelistFilePath);
    const reposToIgnore = repos.filter((r) => !whitelist.includes(r));

    if (!reposToIgnore.length) {
      console.log('\tNo repos to ignore.');
      return;
    }

    if (dryRun) {
      console.log(`\tPrepared ${reposToIgnore.length} repos to ignore:`);
      console.log(JSON.stringify(reposToIgnore, null, 2));
      console.log(
        '\tRun with -f (--force) flag to execute unsubscribe action.'
      );
    } else {
      console.log(`\tIgnoring ${reposToIgnore.length} repos:`);
      await Promise.all(reposToIgnore.map((r) => ignoreRepo(octokit, r)));
      console.log('\tIgnore process completed.');
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

run();
