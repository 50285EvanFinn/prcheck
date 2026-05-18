import * as https from 'https';
import { IncomingMessage } from 'http';

export interface CommitItem {
  sha: string;
  commit: { message: string };
}

function httpsRequest(options: https.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function fetchPRCommits(
  owner: string,
  repo: string,
  prNumber: number,
  token: string
): Promise<string[]> {
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}/commits?per_page=100`,
    method: 'GET',
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github.v3+json',
    },
  };

  const raw = await httpsRequest(options);
  let items: CommitItem[];
  try {
    items = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse commits response: ${raw.slice(0, 200)}`);
  }

  if (!Array.isArray(items)) {
    throw new Error(`Unexpected commits response shape`);
  }

  return items.map((item) => {
    const full: string = item?.commit?.message ?? '';
    return full.split('\n')[0].trim();
  });
}
