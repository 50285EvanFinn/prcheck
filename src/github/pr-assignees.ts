import * as https from 'https';

export interface AssigneeResult {
  added: string[];
  skipped: string[];
  errors: string[];
}

function httpsRequest(
  options: https.RequestOptions,
  body: string
): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function assignReviewers(
  owner: string,
  repo: string,
  prNumber: number,
  reviewers: string[],
  token: string
): Promise<AssigneeResult> {
  if (reviewers.length === 0) {
    return { added: [], skipped: [], errors: [] };
  }

  const body = JSON.stringify({ reviewers });
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/pulls/${prNumber}/requested_reviewers`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Authorization: `token ${token}`,
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github.v3+json',
    },
  };

  try {
    const { statusCode, data } = await httpsRequest(options, body);
    if (statusCode === 201 || statusCode === 200) {
      const parsed = JSON.parse(data);
      const added: string[] = (parsed.reviewers ?? []).map((r: { login: string }) => r.login);
      const skipped = reviewers.filter((r) => !added.includes(r));
      return { added, skipped, errors: [] };
    }
    return { added: [], skipped: [], errors: [`HTTP ${statusCode}: ${data}`] };
  } catch (err) {
    return { added: [], skipped: [], errors: [String(err)] };
  }
}
