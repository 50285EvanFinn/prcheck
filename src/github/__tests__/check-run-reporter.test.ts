import { reportCheckRun, resolveCheckRunOptions } from '../check-run-reporter';
import * as checkRun from '../check-run';

function makeResult(passed: boolean, issues: string[] = []) {
  return { passed, issues, warnings: [], details: {} };
}

describe('reportCheckRun', () => {
  const opts = { owner: 'acme', repo: 'api', sha: 'abc', token: 'tok' };

  afterEach(() => jest.restoreAllMocks());

  it('calls postCheckRun with built payload', async () => {
    const spy = jest.spyOn(checkRun, 'postCheckRun').mockResolvedValue(undefined);
    await reportCheckRun(opts, makeResult(true));
    expect(spy).toHaveBeenCalledTimes(1);
    const [owner, repo, token] = spy.mock.calls[0];
    expect(owner).toBe('acme');
    expect(repo).toBe('api');
    expect(token).toBe('tok');
  });

  it('rethrows error from postCheckRun', async () => {
    jest.spyOn(checkRun, 'postCheckRun').mockRejectedValue(new Error('network'));
    await expect(reportCheckRun(opts, makeResult(false, ['x']))).rejects.toThrow('network');
  });
});

describe('resolveCheckRunOptions', () => {
  const env = process.env;

  beforeEach(() => { process.env = { ...env }; });
  afterEach(() => { process.env = env; });

  it('returns null when env vars are missing', () => {
    delete process.env.GITHUB_TOKEN;
    expect(resolveCheckRunOptions()).toBeNull();
  });

  it('parses repo from GITHUB_REPOSITORY', () => {
    process.env.GITHUB_REPOSITORY_OWNER = 'acme';
    process.env.GITHUB_REPOSITORY = 'acme/my-repo';
    process.env.GITHUB_SHA = 'deadbeef';
    process.env.GITHUB_TOKEN = 'secret';
    const result = resolveCheckRunOptions();
    expect(result?.repo).toBe('my-repo');
    expect(result?.owner).toBe('acme');
    expect(result?.sha).toBe('deadbeef');
  });
});
