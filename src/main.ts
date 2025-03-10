import './style.css';
import { getRepositories, getRepoLanguages, getRepoTopics } from './api';
import type { GithubRepo } from './types';
import { LANGUAGE_ICONS_MAP } from './constants';
import {
  getQueryParam,
  setQueryParam,
  removeQueryParam,
  formatDate
} from './utils';

const repos = getRepositories();
const languages = getRepoLanguages();
const topics = getRepoTopics();

let repoElements: HTMLElement[] | null = null;

function appendRepositoriesToDOM(
  repositories: GithubRepo[],
  languages: Map<string, string[]>,
  topics: Map<string, string[]>
) {
  const reposContainer = document.getElementById('repos');
  if (reposContainer) {
    repositories.forEach(repo => {
      const repoItem = createRepoItem(repo, languages, topics);
      reposContainer.appendChild(repoItem);
    });

    repoElements = Array.from(document.querySelectorAll('.repo-item'));
  }
}

function createRepoItem(
  repo: GithubRepo,
  languages: Map<string, string[]>,
  topics: Map<string, string[]>
) {
  const template = document.getElementById(
    'repo-template'
  ) as HTMLTemplateElement;
  const repoItem = template.content.cloneNode(true) as HTMLElement;
  const article = repoItem.querySelector('article')!;

  const repoLanguages = languages.get(repo.name) || [];
  article.dataset.language = repoLanguages.join(', ');

  const repoTopics = topics.get(repo.name) || [];
  article.dataset.topics = repoTopics.join(', ');

  const repoLink = article.querySelector('.repo-link')! as HTMLAnchorElement;
  repoLink.href = repo.html_url;
  repoLink.textContent = repo.name;

  article.dataset.visibility = repo.visibility;

  const description = article.querySelector('.description')!;
  if (repo.description) {
    description.textContent = repo.description;
  } else {
    description.classList.add('hidden');
  }

  const homepageLink = article.querySelector(
    '.homepage-link'
  )! as HTMLAnchorElement;
  if (repo.homepage) {
    homepageLink.href = repo.homepage;
    homepageLink.textContent = repo.homepage.replace('https://', '');
    homepageLink.classList.add('inline-block');
  } else {
    homepageLink.classList.add('hidden');
  }

  const updated = article.querySelector('.updated')!;
  if (repo.updated_at) {
    updated.querySelector('time')!.textContent = formatDate(repo.updated_at);
  } else {
    updated.classList.add('hidden');
  }

  const languagesEl = article.querySelector('.languages')!;
  if (repoLanguages.length) {
    repoLanguages.forEach(language => {
      // <i class="devicon-javascript-plain colored"></i>
      const languageIcon =
        LANGUAGE_ICONS_MAP[language as keyof typeof LANGUAGE_ICONS_MAP];
      if (languageIcon) {
        const icon = document.createElement('i') as HTMLElement;
        icon.classList.add(`devicon-${languageIcon}`);
        icon.classList.add('colored');
        icon.classList.add('border');
        icon.classList.add('border-gray-300');
        icon.classList.add('rounded-md');
        icon.classList.add('p-1');

        icon.title = language;
        languagesEl.appendChild(icon);
      } else {
        const span = document.createElement('span');
        span.textContent = language;
        languagesEl.appendChild(span);
      }
    });
  } else {
    languagesEl.classList.add('hidden');
  }

  const topicsEl = article.querySelector('.topics')!;
  if (repoTopics.length) {
    repoTopics.forEach(topic => {
      const topicEl = document.createElement('span');
      topicEl.classList.add('topic');
      topicEl.textContent = topic;
      topicsEl.appendChild(topicEl);
    });
  } else {
    topicsEl.classList.add('hidden');
  }

  const visibility = article.querySelector('.visibility-private')!;
  if (repo.visibility === 'private') {
    visibility.classList.remove('hidden');
  } else {
    visibility.classList.add('hidden');
  }

  return repoItem;
}

function setupLanguageFilter(languages: Map<string, string[]>) {
  const languageFilter = document.getElementById(
    'language-filter'
  ) as HTMLSelectElement;
  if (languageFilter) {
    const uniqueLanguages = [...new Set([...languages.values()].flat())].sort();

    uniqueLanguages.forEach(language => {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      languageFilter.appendChild(option);
    });

    languageFilter.addEventListener('change', handleLanguageFilterChange);
    languageFilter.value = getQueryParam('language') || 'all';
  }
}

function setupTopicFilter(topics: Map<string, string[]>) {
  const topicFilter = document.getElementById(
    'topic-filter'
  ) as HTMLSelectElement;
  if (topicFilter) {
    const uniqueTopics = [...new Set([...topics.values()].flat())].sort();

    uniqueTopics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      topicFilter.appendChild(option);
    });

    topicFilter.addEventListener('change', handleTopicFilterChange);
    topicFilter.value = getQueryParam('topic') || 'all';
  }
}

function handleLanguageFilterChange(event: Event) {
  const selectedLanguage = (event.target as HTMLSelectElement).value;

  if (selectedLanguage === 'all') {
    removeQueryParam('language');
    repoElements?.forEach(repoElement => {
      repoElement.classList.remove('hidden');
    });
    return;
  }

  setQueryParam('language', selectedLanguage);
  filterRepositories();
}

function handleTopicFilterChange(event: Event) {
  const selectedTopic = (event.target as HTMLSelectElement).value;

  if (selectedTopic === 'all') {
    removeQueryParam('topic');
    repoElements?.forEach(repoElement => {
      repoElement.classList.remove('hidden');
    });
    return;
  }

  setQueryParam('topic', selectedTopic);
  filterRepositories();
}

function filterRepositories() {
  const language = getQueryParam('language');
  const topic = getQueryParam('topic');

  if (!language && !topic) {
    repoElements?.forEach(repoElement => {
      repoElement.classList.remove('hidden');
    });
    return;
  }

  repoElements?.forEach(repoElement => {
    const repoLanguages = repoElement.dataset.language?.split(', ');
    const repoTopics = repoElement.dataset.topics?.split(', ');

    const isLanguageMatch = !language || repoLanguages?.includes(language);
    const isTopicMatch = !topic || repoTopics?.includes(topic);

    if (isLanguageMatch && isTopicMatch) {
      repoElement.classList.remove('hidden');
    } else {
      repoElement.classList.add('hidden');
    }
  });
}

appendRepositoriesToDOM(repos, languages, topics);
setupLanguageFilter(languages);
setupTopicFilter(topics);

const initialLanguage = getQueryParam('language');
const initialTopic = getQueryParam('topic');

if (initialLanguage || initialTopic) {
  filterRepositories();
}
