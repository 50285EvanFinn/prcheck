import { fetchPRDiff, summarizeDiff, PRDiff } from '../pr-diff';
import * as prFetcher from '../pr-fetcher';

const mockFiles = [
  { filename: 'src/index.ts', additions: 10, deletions: 2, changes: 12, status: 'modified' },
  { filename: 'src/utils.ts', additions: 5, deletions: 0, changes: 5, status: 'added' },
  { filename: 'README.md', additions: 1, deletions: 3, changes: 4, status: 'modified' },
];

describe('fetchPRDiff', () => {
  let httpsGetSpy: jest.SpyInstance;

  beforeEach(() => {
    httpsGetSpy = jest
      .spyOn(prFetcher, 'httpsGet')
      .mockResolvedValue(JSON.stringify(mockFiles));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the correct GitHub API path', async () => {
    await fetchPRDiff({ owner: 'acme', repo: 'app', pullNumber: 42, token: 'tok' });
    expect(httpsGetSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        hostname: 'api.github.com',
        path: '/repos/acme/app/pulls/42/files',
      })
    );
  });

  it('returns correct file list', async () => {
    const diff = await fetchPRDiff({ owner: 'acme', repo: 'app', pullNumber: 1, token: 'tok' });
    expect(diff.filesChanged).toEqual(['src/index.ts', 'src/utils.ts', 'README.md']);
  });

  it('aggregates additions and deletions correctly', async () => {
    const diff = await fetchPRDiff({ owner: 'acme', repo: 'app', pullNumber: 1, token: 'tok' });
    expect(diff.additions).toBe(16);
    expect(diff.deletions).toBe(5);
    expect(diff.totalChanges).toBe(21);
  });

  it('handles an empty file list', async () => {
    httpsGetSpy.mockResolvedValue(JSON.stringify([]));
    const diff = await fetchPRDiff({ owner: 'acme', repo: 'app', pullNumber: 1, token: 'tok' });
    expect(diff.filesChanged).toHaveLength(0);
    expect(diff.totalChanges).toBe(0);
  });

  it('throws when httpsGet rejects', async () => {
    httpsGetSpy.mockRejectedValue(new Error('Network error'));
    await expect(
      fetchPRDiff({ owner: 'acme', repo: 'app', pullNumber: 1, token: 'tok' })
    ).rejects.toThrow('Network error');
  });
});

describe('summarizeDiff', () => {
  it('formats the summary string correctly', () => {
    const diff: PRDiff = { filesChanged: ['a.ts', 'b.ts'], additions: 8, deletions: 3, totalChanges: 11 };
    expect(summarizeDiff(diff)).toBe('Changed 2 file(s): +8 -3 (11 total)');
  });

  it('handles zero changes', () => {
    const diff: PRDiff = { filesChanged: [], additions: 0, deletions: 0, totalChanges: 0 };
    expect(summarizeDiff(diff)).toBe('Changed 0 file(s): +0 -0 (0 total)');
  });
});
