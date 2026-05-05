import { PullRequest } from './pr-fetcher';

export interface GitHubContext {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
}

export function getContextFromEnv(): GitHubContext {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) {
    throw new Error('GITHUB_REPOSITORY environment variable is required');
  }

  const [owner, repo] = repository.split('/');
  if (!owner || !repo) {
    throw new Error(`Invalid GITHUB_REPOSITORY format: ${repository}`);
  }

  const eventPath = process.env.GITHUB_EVENT_PATH;
  let prNumber: number | undefined;

  if (eventPath) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const event = require(eventPath);
      prNumber = event?.pull_request?.number;
    } catch {
      // ignore parse errors
    }
  }

  if (!prNumber) {
    const prEnv = process.env.PR_NUMBER;
    if (prEnv) prNumber = parseInt(prEnv, 10);
  }

  if (!prNumber || isNaN(prNumber)) {
    throw new Error('Could not determine PR number from environment');
  }

  return { owner, repo, prNumber, token };
}

export function prToCheckInput(pr: PullRequest): { title: string; body: string; requestedReviewers: string[] } {
  return {
    title: pr.title,
    body: pr.body ?? '',
    requestedReviewers: pr.requested_reviewers.map((r) => r.login),
  };
}
