import 'dotenv/config';
import * as fs from 'fs';
import {Octokit} from '@octokit/core';

const token = process.env.PAT_TOKEN;
const orgName = process.env.ORG;
// Update with your whitelist file path
const whitelistFilePath = 'whitelist.txt';
const GH_API_VERSION = '2022-11-28';
const headers = {
  'X-GitHub-Api-Version': GH_API_VERSION,
};

if (!token || !orgName) {
  throw new Error('Please provide PAT_TOKEN & ORG env vars');
}

const octokit = new Octokit({auth: token});

async function readWhitelistFromFile(filePath: string): Promise<string[]> {
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

async function fetchAllOrgWatchedRepos(orgName: string) {
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

async function ignoreRepo(repoName: string) {
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

async function ignoreOrgWatchedRepos(orgName: string) {
  try {
    const repos = await fetchAllOrgWatchedRepos(orgName);
    const whitelist = await readWhitelistFromFile(whitelistFilePath);
    const reposToIgnore = repos.filter((r) => !whitelist.includes(r));

    console.log(`\tIgnoring ${reposToIgnore.length} repos:`);
    await Promise.all(reposToIgnore.map(ignoreRepo));

    console.log('\tIgnore process completed.');
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

ignoreOrgWatchedRepos(orgName);
