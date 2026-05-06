import { buildCheckRunPayload } from '../check-run';
import { reportCheckRun } from '../check-run-reporter';
import * as checkRun from '../check-run';

describe('check-run integration', () => {
  afterEach(() => jest.restoreAllMocks());

  it('builds a failure payload and posts it end-to-end (mocked)', async () => {
    const posted: any[] = [];
    jest.spyOn(checkRun, 'postCheckRun').mockImplementation(
      async (_o, _r, _t, payload) => { posted.push(payload); }
    );

    const result = {
      passed: false,
      issues: ['Missing ## Description section', 'No reviewers assigned'],
      warnings: ['CODEOWNERS not found'],
      details: {},
    };

    await reportCheckRun(
      { owner: 'org', repo: 'svc', sha: 'cafebabe', token: 'gh_tok' },
      result
    );

    expect(posted).toHaveLength(1);
    expect(posted[0].conclusion).toBe('failure');
    expect(posted[0].output.text).toContain('Missing ## Description section');
    expect(posted[0].output.text).toContain('CODEOWNERS not found');
    expect(posted[0].head_sha).toBe('cafebabe');
  });

  it('builds a success payload when all checks pass', async () => {
    jest.spyOn(checkRun, 'postCheckRun').mockResolvedValue(undefined);

    const result = { passed: true, issues: [], warnings: [], details: {} };
    const payload = buildCheckRunPayload('sha123', result);

    expect(payload.conclusion).toBe('success');
    expect(payload.output.text).toBeUndefined();
    expect(payload.name).toBe('prcheck');
  });
});
