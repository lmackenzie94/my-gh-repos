import './style.css';
import { getRepositories, getRepoLanguages, getRepoTopics } from './api';
import type { GithubRepo } from './types';
import { DEV_ICONS_MAP } from './constants';

const formatDate = (date: string) => new Date(date).toLocaleDateString();

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

  const link = article.querySelector('a')!;
  link.href = repo.html_url;
  link.textContent = repo.name;

  const description = article.querySelector('.description')!;
  if (repo.description) {
    description.textContent = repo.description;
  } else {
    description.classList.add('hidden');
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
        DEV_ICONS_MAP[language as keyof typeof DEV_ICONS_MAP];
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
    topicsEl.querySelector('span')!.textContent = repoTopics.join(', ');
  } else {
    topicsEl.classList.add('hidden');
  }

  const visibility = article.querySelector('.visibility')!;
  if (repo.visibility) {
    visibility.textContent = repo.visibility;
  } else {
    visibility.classList.add('hidden');
  }

  return repoItem;
}

function setupLanguageFilter(languages: Map<string, string[]>) {
  const languageFilter = document.getElementById('language-filter');
  if (languageFilter) {
    const uniqueLanguages = [...new Set([...languages.values()].flat())].sort();

    uniqueLanguages.forEach(language => {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      languageFilter.appendChild(option);
    });

    languageFilter.addEventListener('change', handleLanguageFilterChange);
  }
}

function setupTopicFilter(topics: Map<string, string[]>) {
  const topicFilter = document.getElementById('topic-filter');
  if (topicFilter) {
    const uniqueTopics = [...new Set([...topics.values()].flat())].sort();

    uniqueTopics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      topicFilter.appendChild(option);
    });

    topicFilter.addEventListener('change', handleTopicFilterChange);
  }
}

function handleLanguageFilterChange(event: Event) {
  // set topic filter to all
  const topicFilter = document.getElementById(
    'topic-filter'
  ) as HTMLSelectElement;
  if (topicFilter) {
    topicFilter.value = 'all';
  }

  const selectedLanguage = (event.target as HTMLSelectElement).value;
  const repoElements: NodeListOf<HTMLElement> =
    document.querySelectorAll('.repo-item');

  if (selectedLanguage === 'all') {
    repoElements.forEach(repoElement => {
      repoElement.style.display = 'block';
    });
    return;
  }

  repoElements.forEach(repoElement => {
    const repoLanguages = repoElement.dataset.language?.split(', ');
    if (repoLanguages?.includes(selectedLanguage)) {
      repoElement.style.display = 'block';
    } else {
      repoElement.style.display = 'none';
    }
  });
}

function handleTopicFilterChange(event: Event) {
  // set language filter to all
  const languageFilter = document.getElementById(
    'language-filter'
  ) as HTMLSelectElement;
  if (languageFilter) {
    languageFilter.value = 'all';
  }

  const selectedTopic = (event.target as HTMLSelectElement).value;
  const repoElements: NodeListOf<HTMLElement> =
    document.querySelectorAll('.repo-item');

  if (selectedTopic === 'all') {
    repoElements.forEach(repoElement => {
      repoElement.style.display = 'block';
    });
    return;
  }

  repoElements.forEach(repoElement => {
    const repoTopics = repoElement.dataset.topics?.split(', ');
    if (repoTopics?.includes(selectedTopic)) {
      repoElement.style.display = 'block';
    } else {
      repoElement.style.display = 'none';
    }
  });
}

const repos = getRepositories();
const languages = getRepoLanguages();
const topics = getRepoTopics();

appendRepositoriesToDOM(repos, languages, topics);
setupLanguageFilter(languages);
setupTopicFilter(topics);
