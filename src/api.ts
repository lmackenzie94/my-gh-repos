import reposData from './data/repos.json';
import type { GithubRepo } from './types';
import { LANGUAGES_TO_HIDE } from './constants';

export function getRepositories(): GithubRepo[] {
  return reposData;
}

export function getRepoLanguages(): Map<string, string[]> {
  return new Map(
    reposData.map(repo => [
      repo.name,
      repo.languages.filter(language => !LANGUAGES_TO_HIDE.includes(language))
    ])
  );
}

export function getRepoTopics() {
  return new Map(reposData.map(repo => [repo.name, repo.topics || []]));
}
