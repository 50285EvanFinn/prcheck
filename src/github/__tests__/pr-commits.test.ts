import * as https from 'https';
import { EventEmitter } from 'events';
import { fetchPRCommits } from '../pr-commits';

function mockRequest(responseBody: string) {
  const res = Object.assign(new EventEmitter(), { statusCode: 200 });
  const req = Object.assign(new EventEmitter(), { end: jest.fn() });
  jest.spyOn(https, 'request').mockImplementation((_opts: any, cb: any) => {
    cb(res);
    setTimeout(() => {
      res.emit('data', responseBody);
      res.emit('end');
    }, 0);
    return req as any;
  });
}

describe('fetchPRCommits', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns first lines of commit messages', async () => {
    const commits = [
      { sha: 'abc', commit: { message: 'feat: add thing\n\nBody text' } },
      { sha: 'def', commit: { message: 'fix: bug\n' } },
    ];
    mockRequest(JSON.stringify(commits));
    const result = await fetchPRCommits('owner', 'repo', 1, 'token');
    expect(result).toEqual(['feat: add thing', 'fix: bug']);
  });

  it('returns empty array for empty list', async () => {
    mockRequest(JSON.stringify([]));
    const result = await fetchPRCommits('owner', 'repo', 2, 'token');
    expect(result).toEqual([]);
  });

  it('throws on invalid JSON', async () => {
    mockRequest('not json');
    await expect(fetchPRCommits('owner', 'repo', 3, 'token')).rejects.toThrow(
      'Failed to parse commits response'
    );
  });

  it('throws when response is not an array', async () => {
    mockRequest(JSON.stringify({ message: 'Not Found' }));
    await expect(fetchPRCommits('owner', 'repo', 4, 'token')).rejects.toThrow(
      'Unexpected commits response shape'
    );
  });

  it('calls the correct GitHub API path', async () => {
    mockRequest(JSON.stringify([]));
    await fetchPRCommits('myorg', 'myrepo', 42, 'tok');
    const spy = https.request as jest.Mock;
    const opts = spy.mock.calls[0][0];
    expect(opts.path).toContain('/repos/myorg/myrepo/pulls/42/commits');
    expect(opts.headers['Authorization']).toBe('token tok');
  });
});
