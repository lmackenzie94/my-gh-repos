import { LANGUAGES_TO_HIDE } from './constants';
import { RepoElementFactory } from './repo-element-factory';
import type { GithubRepo } from './types';
import { getQueryParam, removeQueryParam, setQueryParam } from './utils';

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
  reposContainerId: string;
  repoTemplateId: string;
  filterElements: {
    languageFilterId: string;
    topicFilterId: string;
  };
}

export class RepoManager {
  private readonly repos: GithubRepo[] = [];
  private readonly filterElements: Map<Filter, HTMLSelectElement> = new Map();
  private readonly repoElements: HTMLElement[] = [];
  private reposContainer!: HTMLElement;
  private repoTemplate!: HTMLTemplateElement;
  private repoElementFactory: RepoElementFactory;
  private languagesMap: Map<string, string[]> = new Map();
  private topicsMap: Map<string, string[]> = new Map();
  private filters: FilterState = {
    [Filter.LANGUAGE]: '',
    [Filter.TOPIC]: ''
  };

  constructor(config: RepoManagerConfig) {
    this.repos = config.repos;
    this.initializeDOMElements(config);
    this.initializeFilters(config.filterElements);
    this.initializeDataMaps();

    this.repoElementFactory = new RepoElementFactory(
      this.repoTemplate,
      this.languagesMap,
      this.topicsMap
    );

    this.init();
  }

  private initializeDOMElements(config: RepoManagerConfig): void {
    this.reposContainer = document.getElementById(
      config.reposContainerId
    )! as HTMLElement;
    this.repoTemplate = document.getElementById(
      config.repoTemplateId
    )! as HTMLTemplateElement;
  }

  private initializeFilters(
    filterElements: RepoManagerConfig['filterElements']
  ): void {
    const languageFilter = document.getElementById(
      filterElements.languageFilterId
    )! as HTMLSelectElement;
    const topicFilter = document.getElementById(
      filterElements.topicFilterId
    )! as HTMLSelectElement;

    this.filterElements.set(Filter.LANGUAGE, languageFilter);
    this.filterElements.set(Filter.TOPIC, topicFilter);

    // Setup filter event listeners
    this.filterElements.forEach((filter, type) => {
      filter.addEventListener(
        'change',
        this.handleFilterChange.bind(this, type)
      );
    });
  }

  private initializeDataMaps(): void {
    this.languagesMap = this.createLanguagesMap();
    this.topicsMap = this.createTopicsMap();
  }

  private init(): void {
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
  private get visibleRepos(): HTMLElement[] {
    return this.repoElements.filter(
      repoElement => !repoElement.classList.contains('hidden')
    );
  }

  private createLanguagesMap(): Map<string, string[]> {
    return new Map(
      this.repos.map(repo => [
        repo.name,
        repo.languages.filter(language => !LANGUAGES_TO_HIDE.includes(language))
      ])
    );
  }

  private createTopicsMap(): Map<string, string[]> {
    return new Map(this.repos.map(repo => [repo.name, repo.topics || []]));
  }

  private handleFilterChange(type: Filter, event: Event): void {
    const selectedValue = (event.target as HTMLSelectElement).value;
    this.setFilter(type, selectedValue);
    if (type === Filter.LANGUAGE) {
      this.updateTopicFilterOptions();
    }
  }

  private populateFilters(): void {
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

  private updateTopicFilterOptions(): void {
    // Reset topic filter
    this.setFilter(Filter.TOPIC, '');

    const topicFilter = this.filterElements.get(Filter.TOPIC)!;
    const topicOptions = Array.from(topicFilter.options);

    // If no language filter, enable all options
    if (this.filters.language === '') {
      topicOptions.forEach(option => (option.disabled = false));
      return;
    }

    // Get unique topics from visible repos
    const availableTopics = new Set(
      this.visibleRepos
        .flatMap(repo => repo.dataset.topics?.split(', ') ?? [])
        .filter(Boolean)
    );

    // Update option states
    topicOptions.forEach(option => {
      option.disabled =
        option.value !== '' && !availableTopics.has(option.value);
    });
  }

  private createRepoElements() {
    // Create a lightweight container that lives in memory (not in the DOM)
    const fragment = document.createDocumentFragment();

    // Add all repo elements to the fragment (no DOM updates yet)
    this.repos.forEach(repo => {
      const repoElement = this.repoElementFactory.createRepoElement(repo);
      this.repoElements.push(repoElement);
      fragment.appendChild(repoElement);
    });

    // Add all repo elements to the DOM at once
    this.reposContainer.appendChild(fragment);
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
