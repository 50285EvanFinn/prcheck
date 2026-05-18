import * as https from 'https';

export interface PRMetadata {
  createdAt: string;
  isDraft: boolean;
  number: number;
  title: string;
}

function httpsRequest(options: https.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

export async function fetchPRMetadata(
  owner: string,
  repo: string,
  prNumber: number,
  token: string
): Promise<PRMetadata> {
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'prcheck',
      Accept: 'application/vnd.github+json',
    },
  };

  const raw = await httpsRequest(options);
  const data = JSON.parse(raw);

  return {
    createdAt: data.created_at,
    isDraft: data.draft === true,
    number: data.number,
    title: data.title,
  };
}
