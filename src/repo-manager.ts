import { LANGUAGE_ICONS_MAP, LANGUAGES_TO_HIDE } from './constants';
import type { GithubRepo } from './types';
import {
  formatDate,
  getQueryParam,
  removeQueryParam,
  setQueryParam
} from './utils';

enum Filter {
  LANGUAGE = 'language',
  TOPIC = 'topic'
}

export class RepoManager {
  private repos: GithubRepo[] = [];
  private reposContainer: HTMLElement;
  private repoTemplate: HTMLTemplateElement;
  private repoElements: HTMLElement[] = [];

  private filterElements: Map<Filter, HTMLSelectElement> = new Map();

  private filters: {
    [key in Filter]: string | null;
  } = {
    [Filter.LANGUAGE]: null,
    [Filter.TOPIC]: null
  };

  private languagesMap: Map<string, string[]>;
  private topicsMap: Map<string, string[]>;

  constructor(repos: GithubRepo[]) {
    // get repos
    this.repos = repos;

    // get DOM elements
    this.reposContainer = document.getElementById('repos')!;

    const languageFilter = document.getElementById(
      'language-filter'
    )! as HTMLSelectElement;
    const topicFilter = document.getElementById(
      'topic-filter'
    )! as HTMLSelectElement;
    this.filterElements.set(Filter.LANGUAGE, languageFilter);
    this.filterElements.set(Filter.TOPIC, topicFilter);

    this.repoTemplate = document.getElementById(
      'repo-template'
    )! as HTMLTemplateElement;

    // setup event listeners
    this.filterElements.forEach((filter, type) => {
      filter.addEventListener(
        'change',
        this.handleFilterChange.bind(this, type)
      );
    });

    // set language and topic maps
    this.languagesMap = new Map(
      this.repos.map(repo => [
        repo.name,
        repo.languages.filter(language => !LANGUAGES_TO_HIDE.includes(language))
      ])
    );

    this.topicsMap = new Map(
      this.repos.map(repo => [repo.name, repo.topics || []])
    );

    // init
    this.init();
  }

  init() {
    // populate filters
    this.populateFilters();

    // create repo elements
    this.createRepoElements();

    // Set initial filters
    const initialLanguage = getQueryParam(Filter.LANGUAGE);
    const initialTopic = getQueryParam(Filter.TOPIC);
    this.setFilter(Filter.LANGUAGE, initialLanguage);
    this.setFilter(Filter.TOPIC, initialTopic);

    // render repos
    this.renderRepos();
  }

  // repo elements without "hidden" class
  get visibleRepos() {
    return this.repoElements.filter(
      repoElement => !repoElement.classList.contains('hidden')
    );
  }

  handleFilterChange(type: Filter, event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.setFilter(type, selectedValue);
    if (type === Filter.LANGUAGE) {
      this.updateTopicFilterOptions();
    }
  }

  populateFilters() {
    // append to existing options
    const languages = this.getLanguagesList();
    const topics = this.getTopicsList();

    languages.forEach(language => {
      const option = document.createElement('option');
      option.value = language;
      option.textContent = language;
      this.filterElements.get(Filter.LANGUAGE)!.appendChild(option);
    });

    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      this.filterElements.get(Filter.TOPIC)!.appendChild(option);
    });
  }

  updateTopicFilterOptions() {
    // set selected value to empty string
    this.setFilter(Filter.TOPIC, '');

    const topicFilterOptions = Array.from(
      this.filterElements.get(Filter.TOPIC)!.options
    );
    // if language filter is set to "All Languages", enable all topic options
    if (this.filters.language === '') {
      topicFilterOptions.forEach(option => {
        option.disabled = false;
      });
      return;
    }
    // disable options that are not present in the visible repos
    const visibleRepos = this.visibleRepos;
    const topics: string[] = [];
    visibleRepos.forEach(repo => {
      const repoTopics = repo.dataset.topics?.split(', ').filter(Boolean);
      if (repoTopics) {
        topics.push(...repoTopics);
      }
    });
    const uniqueTopics = [...new Set(topics)];
    topicFilterOptions.forEach((option: HTMLOptionElement) => {
      // don't disable the "All Topics" option
      if (option.value === '') {
        option.disabled = false;
        return;
      }

      if (!uniqueTopics.includes(option.value)) {
        option.disabled = true;
      } else {
        option.disabled = false;
      }
    });
  }

  createRepoElements() {
    this.repos.forEach(repo => {
      const repoElement = this.createRepoElement(repo);
      this.repoElements.push(repoElement);
      this.reposContainer.appendChild(repoElement);
    });
  }

  createRepoElement(repo: GithubRepo) {
    const template = this.repoTemplate;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const repoElement = fragment.querySelector('article')!;

    const repoLanguages = this.languagesMap.get(repo.name) || [];
    repoElement.dataset.language = repoLanguages.join(', ');

    const repoTopics = this.topicsMap.get(repo.name) || [];
    repoElement.dataset.topics = repoTopics.join(', ');

    const repoLink = repoElement.querySelector(
      '.repo-link'
    )! as HTMLAnchorElement;
    repoLink.href = repo.html_url;
    repoLink.textContent = repo.name;

    repoElement.dataset.visibility = repo.visibility;

    const description = repoElement.querySelector('.description')!;
    if (repo.description) {
      description.textContent = repo.description;
    } else {
      description.classList.add('hidden');
    }

    const homepageLink = repoElement.querySelector(
      '.homepage-link'
    )! as HTMLAnchorElement;
    if (repo.homepage) {
      homepageLink.href = repo.homepage;
      homepageLink.textContent = repo.homepage.replace('https://', '');
      homepageLink.classList.add('inline-block');
    } else {
      homepageLink.classList.add('hidden');
    }

    const updated = repoElement.querySelector('.updated')!;
    if (repo.updated_at) {
      updated.querySelector('time')!.textContent = formatDate(repo.updated_at);
    } else {
      updated.classList.add('hidden');
    }

    const languagesEl = repoElement.querySelector('.languages')!;
    if (repoLanguages.length) {
      repoLanguages.forEach(language => {
        // <i class="devicon-javascript-plain colored"></i>
        const languageIcon =
          LANGUAGE_ICONS_MAP[language as keyof typeof LANGUAGE_ICONS_MAP];
        if (languageIcon) {
          const icon = document.createElement('i') as HTMLElement;
          icon.classList.add(
            `devicon-${languageIcon}`,
            'colored',
            'border',
            'border-gray-300',
            'rounded-md',
            'p-1'
          );

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

    const topicsEl = repoElement.querySelector('.topics')!;
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

    const visibility = repoElement.querySelector('.visibility-private')!;
    if (repo.visibility === 'private') {
      visibility.classList.remove('hidden');
    } else {
      visibility.classList.add('hidden');
    }

    return repoElement;
  }

  getLanguagesList(): string[] {
    const languages = [...this.languagesMap.values()].flat();
    const uniqueLanguages = [...new Set(languages)];
    return uniqueLanguages.sort();
  }

  getTopicsList(): string[] {
    const topics = [...this.topicsMap.values()].flat();
    const uniqueTopics = [...new Set(topics)];
    return uniqueTopics.sort();
  }

  setFilter(type: Filter, value: string | null) {
    // update filters
    this.filters[type] = value;
    this.filterElements.get(type)!.value = value || '';

    // set query params
    if (!value) {
      removeQueryParam(type);
    } else {
      setQueryParam(type, value);
    }

    this.renderRepos();
  }

  private renderRepos() {
    const language = this.filters.language;
    const topic = this.filters.topic;

    if (!language && !topic) {
      this.repoElements.forEach(repoElement => {
        repoElement.classList.remove('hidden');
      });
      return;
    }

    this.repoElements.forEach(repoElement => {
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
}

export default RepoManager;
