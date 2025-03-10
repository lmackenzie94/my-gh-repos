import { RestEndpointMethodTypes } from '@octokit/rest';

type GithubRepoResponse =
  RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data'][number];

export type GithubRepo = Pick<
  GithubRepoResponse,
  | 'name'
  | 'description'
  | 'updated_at'
  | 'topics'
  | 'visibility'
  | 'html_url'
  | 'homepage'
> & {
  languages: string[];
};
