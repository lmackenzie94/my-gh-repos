import { LANGUAGE_ICONS_MAP } from './constants';
import { GithubRepo } from './types';
import { formatDate } from './utils';

export class RepoElementFactory {
  private readonly repoTemplate: HTMLTemplateElement;
  private readonly languagesMap: Map<string, string[]>;
  private readonly topicsMap: Map<string, string[]>;

  constructor(
    repoTemplate: HTMLTemplateElement,
    languagesMap: Map<string, string[]>,
    topicsMap: Map<string, string[]>
  ) {
    this.repoTemplate = repoTemplate;
    this.languagesMap = languagesMap;
    this.topicsMap = topicsMap;
  }

  createRepoElement(repo: GithubRepo): HTMLElement {
    const repoElement = this.createBaseElement();

    this.setRepoMetadata(repoElement, repo);
    this.setRepoLink(repoElement, repo);
    this.setDescription(repoElement, repo);
    this.setHomepageLink(repoElement, repo);
    this.setCreatedAt(repoElement, repo);
    this.setLanguages(repoElement, repo);
    this.setTopics(repoElement, repo);
    this.setVisibility(repoElement, repo);

    return repoElement;
  }

  private createBaseElement(): HTMLElement {
    const fragment = this.repoTemplate.content.cloneNode(
      true
    ) as DocumentFragment;
    const repoElement = fragment.querySelector('article')!;

    return repoElement;
  }

  private setRepoMetadata(repoElement: HTMLElement, repo: GithubRepo): void {
    const repoLanguages = this.languagesMap.get(repo.name) || [];
    repoElement.dataset.language = repoLanguages.join(', ');

    const repoTopics = this.topicsMap.get(repo.name) || [];
    repoElement.dataset.topics = repoTopics.join(', ');

    repoElement.dataset.visibility = repo.visibility;
  }

  private setRepoLink(repoElement: HTMLElement, repo: GithubRepo): void {
    const repoLink = repoElement.querySelector(
      '.repo-link'
    )! as HTMLAnchorElement;
    repoLink.href = repo.html_url;
    repoLink.textContent = repo.name;
  }

  private setDescription(repoElement: HTMLElement, repo: GithubRepo): void {
    const description = repoElement.querySelector('.description')!;
    if (repo.description) {
      description.textContent = repo.description;
    } else {
      description.classList.add('hidden');
    }
  }

  private setHomepageLink(repoElement: HTMLElement, repo: GithubRepo): void {
    const homepageLink = repoElement.querySelector(
      '.homepage-link'
    )! as HTMLAnchorElement;
    if (repo.homepage) {
      homepageLink.href = repo.homepage;
      homepageLink.textContent = repo.homepage.replace('https://', '');
      homepageLink.textContent = homepageLink.textContent.replace(/\/$/, '');
      homepageLink.classList.add('inline-block');
    } else {
      homepageLink.classList.add('hidden');
    }
  }

  private setCreatedAt(repoElement: HTMLElement, repo: GithubRepo): void {
    const createdAt = repoElement.querySelector('.created-at')!;
    if (repo.created_at) {
      createdAt.querySelector('time')!.textContent = formatDate(
        repo.created_at
      );
    } else {
      createdAt.classList.add('hidden');
    }
  }

  private setLanguages(repoElement: HTMLElement, repo: GithubRepo): void {
    const languagesEl = repoElement.querySelector('.languages')!;
    if (repo.languages.length) {
      repo.languages.forEach(language => {
        const languageIcon = this.createLanguageIcon(language);
        if (languageIcon) {
          languagesEl.appendChild(languageIcon);
        }
      });
    } else {
      languagesEl.classList.add('hidden');
    }
  }

  private setTopics(repoElement: HTMLElement, repo: GithubRepo): void {
    const topicsEl = repoElement.querySelector('.topics')!;
    if (repo.topics?.length) {
      repo.topics.forEach(topic => {
        const topicEl = this.createTopicPill(topic);
        topicsEl.appendChild(topicEl);
      });
    } else {
      topicsEl.classList.add('hidden');
    }
  }

  private setVisibility(repoElement: HTMLElement, repo: GithubRepo): void {
    const visibility = repoElement.querySelector('.visibility-private')!;
    if (repo.visibility === 'private') {
      visibility.classList.remove('hidden');
    } else {
      visibility.classList.add('hidden');
    }
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
}
