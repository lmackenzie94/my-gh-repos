import './style.css';
import RepoManager from './repo-manager';
import repos from './data/repos.json';

new RepoManager({
  repos,
  reposContainerId: 'repos',
  repoTemplateId: 'repo-template',
  filterElements: {
    languageFilterId: 'language-filter',
    topicFilterId: 'topic-filter'
  }
});
