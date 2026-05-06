import { ValidationResult } from '../rules/validator';
import { buildCheckRunPayload, postCheckRun } from './check-run';

export interface CheckRunReporterOptions {
  owner: string;
  repo: string;
  sha: string;
  token: string;
}

export async function reportCheckRun(
  options: CheckRunReporterOptions,
  result: ValidationResult
): Promise<void> {
  const { owner, repo, sha, token } = options;
  const payload = buildCheckRunPayload(sha, result);
  try {
    await postCheckRun(owner, repo, token, payload);
    console.log(`[prcheck] Check run posted: ${payload.conclusion}`);
  } catch (err) {
    console.error('[prcheck] Failed to post check run:', (err as Error).message);
    throw err;
  }
}

export function resolveCheckRunOptions(): CheckRunReporterOptions | null {
  const owner = process.env.GITHUB_REPOSITORY_OWNER ?? '';
  const repoFull = process.env.GITHUB_REPOSITORY ?? '';
  const repo = repoFull.includes('/') ? repoFull.split('/')[1] : repoFull;
  const sha = process.env.GITHUB_SHA ?? '';
  const token = process.env.GITHUB_TOKEN ?? '';

  if (!owner || !repo || !sha || !token) {
    return null;
  }

  return { owner, repo, sha, token };
}
