import './style.css';

import RepoManager from './repo-manager';
import { getRepositories } from './api';

const repos = getRepositories();
new RepoManager(repos);
