import './style.css';
import RepoManager from './repo-manager';
import repos from './data/repos.json';

new RepoManager({
  repos,
  reposContainer: document.getElementById('repos')!,
  repoTemplate: document.getElementById(
    'repo-template'
  )! as HTMLTemplateElement,
  filterElements: {
    languageFilter: document.getElementById(
      'language-filter'
    )! as HTMLSelectElement,
    topicFilter: document.getElementById('topic-filter')! as HTMLSelectElement
  }
});
