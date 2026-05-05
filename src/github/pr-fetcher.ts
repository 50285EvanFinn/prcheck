import * as https from 'https';

export interface PullRequest {
  number: number;
  title: string;
  body: string | null;
  user: { login: string };
  requested_reviewers: Array<{ login: string }>;
  labels: Array<{ name: string }>;
  base: { ref: string };
  head: { ref: string };
}

export interface FetchOptions {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
}

function httpsGet(url: string, token: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'prcheck-action',
        'Accept': 'application/vnd.github.v3+json',
      },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`GitHub API error: ${res.statusCode} ${data}`));
        } else {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

export async function fetchPullRequest(options: FetchOptions): Promise<PullRequest> {
  const { owner, repo, prNumber, token } = options;
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`;
  const raw = await httpsGet(url, token);
  return JSON.parse(raw) as PullRequest;
}

export function parsePRReference(ref: string): { owner: string; repo: string; prNumber: number } | null {
  const match = ref.match(/^([\w.-]+)\/([\w.-]+)#(\d+)$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) };
}
