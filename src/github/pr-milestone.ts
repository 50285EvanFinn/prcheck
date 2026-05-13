import * as https from 'https';
import { IncomingMessage } from 'http';

export interface Milestone {
  number: number;
  title: string;
  state: 'open' | 'closed';
  due_on: string | null;
}

function httpsRequest(options: https.RequestOptions, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function getPRMilestone(
  owner: string,
  repo: string,
  prNumber: number,
  token: string
): Promise<Milestone | null> {
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}`,
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github.v3+json',
    },
  };

  const raw = await httpsRequest(options);
  const pr = JSON.parse(raw);
  return pr.milestone ?? null;
}

export async function setPRMilestone(
  owner: string,
  repo: string,
  prNumber: number,
  milestoneNumber: number,
  token: string
): Promise<void> {
  const body = JSON.stringify({ milestone: milestoneNumber });
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/issues/${prNumber}`,
    method: 'PATCH',
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  await httpsRequest(options, body);
}
