import * as https from 'https';

export interface LabelConfig {
  onSuccess?: string[];
  onFailure?: string[];
}

export interface LabelManagerOptions {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
}

function httpsRequest(
  options: https.RequestOptions,
  body?: string
): Promise<{ statusCode: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function addLabels(
  labels: string[],
  opts: LabelManagerOptions
): Promise<void> {
  if (labels.length === 0) return;
  const body = JSON.stringify({ labels });
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${opts.owner}/${opts.repo}/issues/${opts.prNumber}/labels`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github+json',
    },
  };
  const { statusCode } = await httpsRequest(options, body);
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Failed to add labels: HTTP ${statusCode}`);
  }
}

export async function removeLabel(
  label: string,
  opts: LabelManagerOptions
): Promise<void> {
  const encoded = encodeURIComponent(label);
  const options: https.RequestOptions = {
    hostname: 'api.github.com',
    path: `/repos/${opts.owner}/${opts.repo}/issues/${opts.prNumber}/labels/${encoded}`,
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      'User-Agent': 'prcheck-action',
      Accept: 'application/vnd.github+json',
    },
  };
  const { statusCode } = await httpsRequest(options);
  if (statusCode !== 200 && statusCode !== 404) {
    throw new Error(`Failed to remove label "${label}": HTTP ${statusCode}`);
  }
}

export async function applyValidationLabels(
  passed: boolean,
  labelConfig: LabelConfig,
  opts: LabelManagerOptions
): Promise<void> {
  if (passed) {
    await addLabels(labelConfig.onSuccess ?? [], opts);
    for (const l of labelConfig.onFailure ?? []) {
      await removeLabel(l, opts);
    }
  } else {
    await addLabels(labelConfig.onFailure ?? [], opts);
    for (const l of labelConfig.onSuccess ?? []) {
      await removeLabel(l, opts);
    }
  }
}
