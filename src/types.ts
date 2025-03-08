import { RestEndpointMethodTypes } from '@octokit/rest';

export type GithubRepo =
  RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];
