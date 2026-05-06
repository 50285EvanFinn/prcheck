import { logInfo } from './action-output';
import { ValidationResult } from '../rules/validator';
import * as https from 'https';

export interface CommitStatusPayload {
  state: 'success' | 'failure' | 'pending' | 'error';
  target_url?: string;
  description: string;
  context: string;
}

function buildStatusPayload(result: ValidationResult): CommitStatusPayload {
  const passed = result.passed;
  const failCount = result.errors.length;
  const warnCount = result.warnings.length;

  const description = passed
    ? `PR checks passed${warnCount > 0 ? ` (${warnCount} warning${warnCount > 1 ? 's' : ''})` : ''}`
    : `PR checks failed: ${failCount} error${failCount > 1 ? 's' : ''}`;

  return {
    state: passed ? 'success' : 'failure',
    description: description.slice(0, 140),
    context: 'prcheck / validation',
  };
}

export function postCommitStatus(
  owner: string,
  repo: string,
  sha: string,
  result: ValidationResult,
  token: string
): Promise<void> {
  const payload = buildStatusPayload(result);
  const body = JSON.stringify(payload);

  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/statuses/${sha}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Authorization: `token ${token}`,
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github.v3+json',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        logInfo(`Commit status posted: ${payload.state} — ${payload.description}`);
        resolve();
      } else {
        reject(new Error(`Failed to post commit status: HTTP ${res.statusCode}`));
      }
      res.resume();
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
