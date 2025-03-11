import { Octokit } from '@octokit/rest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GithubRepo } from '../src/types';
import dotenv from 'dotenv';

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const USERNAME = process.env.GITHUB_USERNAME;

async function fetchAllData() {
  if (!USERNAME) {
    throw new Error('GITHUB_USERNAME is not set');
  }

  try {
    // Fetch repositories
    const allRepos: GithubRepo[] = [];
    let page = 1;

    while (true) {
      console.log(`Fetching page ${page}...`);

      // don't include archived repos
      const response = await octokit.rest.repos.listForAuthenticatedUser({
        username: USERNAME,
        type: 'owner',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
        page: page
      });

      const repos: GithubRepo[] = response.data
        .filter(repo => !repo.archived) // Remove archived repos
        .map(repo => ({
          name: repo.name,
          description: repo.description,
          updated_at: repo.updated_at,
          topics: repo.topics || [],
          visibility: repo.visibility,
          html_url: repo.html_url,
          homepage: repo.homepage,
          languages: [] // populated below
        }));

      allRepos.push(...repos);
      if (response.data.length < 100) break;
      page++;
    }

    for (const repo of allRepos) {
      console.log(`Fetching languages for ${repo.name}...`);
      const languages = await octokit.rest.repos.listLanguages({
        owner: USERNAME,
        repo: repo.name
      });
      repo.languages = Object.keys(languages.data);
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

    console.log('Data fetched and saved successfully!');
  } catch (error) {
    console.error('Error fetching data:', error);
    process.exit(1);
  }
}

fetchAllData();
