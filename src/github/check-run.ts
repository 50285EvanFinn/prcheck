import * as https from 'https';
import { ValidationResult } from '../rules/validator';

export interface CheckRunPayload {
  name: string;
  head_sha: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped';
  output: {
    title: string;
    summary: string;
    text?: string;
  };
}

export function buildCheckRunPayload(
  sha: string,
  result: ValidationResult
): CheckRunPayload {
  const passed = result.passed;
  const lines: string[] = [];

  for (const issue of result.issues) {
    lines.push(`- ❌ ${issue}`);
  }
  for (const warning of result.warnings ?? []) {
    lines.push(`- ⚠️ ${warning}`);
  }

  return {
    name: 'prcheck',
    head_sha: sha,
    status: 'completed',
    conclusion: passed ? 'success' : 'failure',
    output: {
      title: passed ? 'PR checks passed' : 'PR checks failed',
      summary: passed
        ? 'All template and reviewer rules passed.'
        : `Found ${result.issues.length} issue(s).`,
      text: lines.length > 0 ? lines.join('\n') : undefined,
    },
  };
}

export function postCheckRun(
  owner: string,
  repo: string,
  token: string,
  payload: CheckRunPayload
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options: https.RequestOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/check-runs`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        Authorization: `Bearer ${token}`,
        'User-Agent': 'prcheck-action',
        Accept: 'application/vnd.github+json',
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 400) {
        return reject(new Error(`Check run API returned ${res.statusCode}`));
      }
      res.resume();
      res.on('end', resolve);
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
