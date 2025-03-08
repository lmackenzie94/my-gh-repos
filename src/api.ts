import reposData from './data/repos.json';
import languagesData from './data/languages.json';
import type { GithubRepo } from './types';

export function getRepositories(): GithubRepo[] {
  return reposData;
}

export function getRepoLanguages(): Map<string, string[]> {
  return new Map(Object.entries(languagesData));
}

export function getRepoTopics() {
  return new Map(reposData.map(repo => [repo.name, repo.topics || []]));
}
