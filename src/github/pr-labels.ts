import { httpsRequest } from './label-manager';

export interface PRLabel {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export async function fetchPRLabels(
  owner: string,
  repo: string,
  prNumber: number,
  token: string
): Promise<PRLabel[]> {
  const path = `/repos/${owner}/${repo}/issues/${prNumber}/labels`;
  const raw = await httpsRequest('GET', path, token);
  return JSON.parse(raw) as PRLabel[];
}

export async function addLabelsToPR(
  owner: string,
  repo: string,
  prNumber: number,
  labels: string[],
  token: string
): Promise<void> {
  const path = `/repos/${owner}/${repo}/issues/${prNumber}/labels`;
  const body = JSON.stringify({ labels });
  await httpsRequest('POST', path, token, body);
}

export async function removeLabelFromPR(
  owner: string,
  repo: string,
  prNumber: number,
  label: string,
  token: string
): Promise<void> {
  const encodedLabel = encodeURIComponent(label);
  const path = `/repos/${owner}/${repo}/issues/${prNumber}/labels/${encodedLabel}`;
  await httpsRequest('DELETE', path, token);
}

export function extractLabelNames(labels: PRLabel[]): string[] {
  return labels.map((l) => l.name);
}
