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

interface FilterState {
  [Filter.LANGUAGE]: string;
  [Filter.TOPIC]: string;
}

interface RepoManagerConfig {
  repos: GithubRepo[];
  reposContainer: HTMLElement;
  repoTemplate: HTMLTemplateElement;
  filterElements: {
    languageFilter: HTMLSelectElement;
    topicFilter: HTMLSelectElement;
  };
}

export class RepoManager {
  private readonly repos: GithubRepo[] = [];
  private readonly reposContainer: HTMLElement;
  private readonly repoTemplate: HTMLTemplateElement;
  private readonly filterElements: Map<Filter, HTMLSelectElement> = new Map();
  private readonly repoElements: HTMLElement[] = [];

  private filters: FilterState = {
    [Filter.LANGUAGE]: '',
    [Filter.TOPIC]: ''
  };

  private languagesMap: Map<string, string[]>;
  private topicsMap: Map<string, string[]>;

  constructor(config: RepoManagerConfig) {
    // get repos
    this.repos = config.repos;

    // get DOM elements
    this.reposContainer = config.reposContainer;
    this.repoTemplate = config.repoTemplate;

    // setup filter elements
    this.filterElements.set(
      Filter.LANGUAGE,
      config.filterElements.languageFilter
    );
    this.filterElements.set(Filter.TOPIC, config.filterElements.topicFilter);

    // setup filter event listeners
    this.filterElements.forEach((filter, type) => {
      filter.addEventListener(
        'change',
        this.handleFilterChange.bind(this, type)
      );
    });

    // set language and topic maps
    this.languagesMap = this.createLanguagesMap();
    this.topicsMap = this.createTopicsMap();

    // init
    this.init();
  }

  private init() {
    // populate filters
    this.populateFilters();

    // create repo elements
    this.createRepoElements();

    // Set initial filters
    const initialLanguage = getQueryParam(Filter.LANGUAGE) || '';
    const initialTopic = getQueryParam(Filter.TOPIC) || '';
    this.setFilter(Filter.LANGUAGE, initialLanguage);
    this.setFilter(Filter.TOPIC, initialTopic);

    // render repos
    this.renderRepos();
  }

  // repo elements without "hidden" class
  private get visibleRepos() {
    return this.repoElements.filter(
      repoElement => !repoElement.classList.contains('hidden')
    );
  }

  private createLanguagesMap() {
    return new Map(
      this.repos.map(repo => [
        repo.name,
        repo.languages.filter(language => !LANGUAGES_TO_HIDE.includes(language))
      ])
    );
  }

  private createTopicsMap() {
    return new Map(this.repos.map(repo => [repo.name, repo.topics || []]));
  }

  private handleFilterChange(type: Filter, event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.setFilter(type, selectedValue);
    if (type === Filter.LANGUAGE) {
      this.updateTopicFilterOptions();
    }
  }

  private populateFilters() {
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

  private updateTopicFilterOptions() {
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

  private createRepoElements() {
    // Create a lightweight container that lives in memory (not in the DOM)
    const fragment = document.createDocumentFragment();

    // Add all repo elements to the fragment (no DOM updates yet)
    this.repos.forEach(repo => {
      const repoElement = this.createRepoElement(repo);
      this.repoElements.push(repoElement);
      fragment.appendChild(repoElement);
    });

    // Add all repo elements to the DOM at once
    this.reposContainer.appendChild(fragment);
  }

  private createRepoElement(repo: GithubRepo) {
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
      // remove protocol for cleaner display
      homepageLink.textContent = repo.homepage.replace('https://', '');
      // remove trailing slash
      homepageLink.textContent = homepageLink.textContent.replace(/\/$/, '');
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
        const languageIcon = this.createLanguageIcon(language);
        if (languageIcon) {
          languagesEl.appendChild(languageIcon);
        }
      });
    } else {
      languagesEl.classList.add('hidden');
    }

    const topicsEl = repoElement.querySelector('.topics')!;
    if (repoTopics.length) {
      repoTopics.forEach(topic => {
        const topicEl = this.createTopicPill(topic);
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

  private createLanguageIcon(language: string): HTMLElement | null {
    const languageIcon =
      LANGUAGE_ICONS_MAP[language as keyof typeof LANGUAGE_ICONS_MAP];
    if (languageIcon) {
      const icon = document.createElement('i');
      icon.classList.add(
        `devicon-${languageIcon}`,
        'colored',
        'border',
        'border-gray-300',
        'rounded-md',
        'p-1'
      );
      icon.title = language;
      return icon;
    } else {
      console.warn(`No language icon found for ${language}`);
      return null;
    }
  }

  private createTopicPill(topic: string): HTMLElement {
    const pill = document.createElement('span');
    pill.classList.add('topic');
    pill.textContent = topic;
    return pill;
  }

  private getLanguagesList(): string[] {
    const languages = Array.from(this.languagesMap.values()).flat();
    return [...new Set(languages)].sort();
  }

  private getTopicsList(): string[] {
    const topics = Array.from(this.topicsMap.values()).flat();
    return [...new Set(topics)].sort();
  }

  private setFilter(type: Filter, value: string | '') {
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
