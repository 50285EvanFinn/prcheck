import * as https from 'https';
import { ValidationResult } from '../rules/validator';

export interface CommentPayload {
  body: string;
}

export function buildCommentBody(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.passed) {
    lines.push('## ✅ PR Check Passed');
    lines.push('');
    lines.push('All checks passed successfully.');
  } else {
    lines.push('## ❌ PR Check Failed');
    lines.push('');
    lines.push('The following issues were found:');
    lines.push('');
    for (const error of result.errors) {
      lines.push(`- ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('### ⚠️ Warnings');
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push('');
  lines.push('_Posted by [prcheck](https://github.com/marketplace/actions/prcheck)_');

  return lines.join('\n');
}

export function postPRComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  token: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ body });
    const options: https.RequestOptions = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        Authorization: `Bearer ${token}`,
        'User-Agent': 'prcheck-action',
        Accept: 'application/vnd.github+json',
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
        resolve();
      } else {
        reject(new Error(`GitHub API responded with status ${res.statusCode}`));
      }
      res.resume();
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
