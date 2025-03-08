import { Octokit } from '@octokit/rest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GithubRepo } from '../src/types';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

async function fetchAllData() {
  try {
    // Fetch repositories
    const allRepos: GithubRepo[] = [];
    let page = 1;

    while (true) {
      console.log(`Fetching page ${page}...`);
      const response = await octokit.rest.repos.listForAuthenticatedUser({
        username: process.env.GITHUB_USERNAME,
        type: 'owner',
        sort: 'created',
        direction: 'desc',
        per_page: 100,
        page: page
      });

      allRepos.push(...response.data);
      if (response.data.length < 100) break;
      page++;
    }

    // Fetch languages for each repo
    const languagesMap = new Map();
    for (const repo of allRepos) {
      console.log(`Fetching languages for ${repo.name}...`);
      const languages = await octokit.repos.listLanguages({
        owner: repo.owner.login,
        repo: repo.name
      });
      languagesMap.set(repo.name, Object.keys(languages.data));
    }

    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'src/data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Write data to JSON files
    fs.writeFileSync(
      path.join(dataDir, 'repos.json'),
      JSON.stringify(allRepos, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, 'languages.json'),
      JSON.stringify(Object.fromEntries(languagesMap), null, 2)
    );

    console.log('Data fetched and saved successfully!');
  } catch (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }
}

fetchAllData();
