import { httpsGet } from './pr-fetcher';

export interface PRDiff {
  filesChanged: string[];
  additions: number;
  deletions: number;
  totalChanges: number;
}

export interface PRDiffOptions {
  owner: string;
  repo: string;
  pullNumber: number;
  token: string;
}

export interface GitHubFileSummary {
  filename: string;
  additions: number;
  deletions: number;
  changes: number;
  status: string;
}

export async function fetchPRDiff(options: PRDiffOptions): Promise<PRDiff> {
  const { owner, repo, pullNumber, token } = options;
  const path = `/repos/${owner}/${repo}/pulls/${pullNumber}/files`;

  const raw = await httpsGet({
    hostname: 'api.github.com',
    path,
    headers: {
      Authorization: `token ${token}`,
      'User-Agent': 'prcheck',
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const files: GitHubFileSummary[] = JSON.parse(raw);

  const filesChanged = files.map((f) => f.filename);
  const additions = files.reduce((sum, f) => sum + f.additions, 0);
  const deletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const totalChanges = additions + deletions;

  return { filesChanged, additions, deletions, totalChanges };
}

export function summarizeDiff(diff: PRDiff): string {
  const { filesChanged, additions, deletions, totalChanges } = diff;
  return (
    `Changed ${filesChanged.length} file(s): ` +
    `+${additions} -${deletions} (${totalChanges} total)`
  );
}
