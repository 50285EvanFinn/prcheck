import { buildCommentBody } from '../pr-comment';
import { postCommitStatus, CommitStatusPayload } from '../status-reporter';
import * as https from 'https';
import { EventEmitter } from 'events';

const makeResult = (passed: boolean, errors: string[] = [], warnings: string[] = []) => ({
  passed,
  errors,
  warnings,
});

function mockHttpsRequest(
  statusCode: number
): { req: EventEmitter & { write: jest.Mock; end: jest.Mock } } {
  const res = Object.assign(new EventEmitter(), { statusCode, resume: jest.fn() });
  const req = Object.assign(new EventEmitter(), {
    write: jest.fn(),
    end: jest.fn(() => res.emit('data')),
  });
  jest.spyOn(https, 'request').mockImplementation((_opts: any, cb?: any) => {
    if (cb) cb(res);
    return req as any;
  });
  return { req };
}

/** Parses the JSON body written to the request from the first write() call. */
function getWrittenBody(req: { write: jest.Mock }): Record<string, unknown> {
  const raw = req.write.mock.calls[0][0] as string;
  return JSON.parse(raw);
}

afterEach(() => jest.restoreAllMocks());

describe('postCommitStatus', () => {
  it('posts success state when PR checks pass', async () => {
    const { req } = mockHttpsRequest(201);
    await postCommitStatus('owner', 'repo', 'abc123', makeResult(true), 'tok');
    expect(req.write).toHaveBeenCalledWith(expect.stringContaining('"state":"success"'));
  });

  it('posts failure state when PR checks fail', async () => {
    const { req } = mockHttpsRequest(201);
    await postCommitStatus('owner', 'repo', 'abc123', makeResult(false, ['Missing section']), 'tok');
    expect(req.write).toHaveBeenCalledWith(expect.stringContaining('"state":"failure"'));
  });

  it('includes warning count in description when passing with warnings', async () => {
    const { req } = mockHttpsRequest(201);
    await postCommitStatus('owner', 'repo', 'sha', makeResult(true, [], ['warn1', 'warn2']), 'tok');
    const written = req.write.mock.calls[0][0] as string;
    expect(written).toContain('2 warnings');
  });

  it('rejects on non-2xx HTTP response', async () => {
    mockHttpsRequest(403);
    await expect(
      postCommitStatus('owner', 'repo', 'sha', makeResult(true), 'tok')
    ).rejects.toThrow('HTTP 403');
  });

  it('uses correct GitHub API path', async () => {
    mockHttpsRequest(201);
    await postCommitStatus('myorg', 'myrepo', 'deadbeef', makeResult(true), 'tok');
    const spy = https.request as jest.Mock;
    const opts = spy.mock.calls[0][0];
    expect(opts.path).toBe('/repos/myorg/myrepo/statuses/deadbeef');
  });

  it('sends valid JSON body with expected fields', async () => {
    const { req } = mockHttpsRequest(201);
    await postCommitStatus('owner', 'repo', 'sha', makeResult(false, ['err1']), 'tok');
    const body = getWrittenBody(req);
    expect(body).toHaveProperty('state');
    expect(body).toHaveProperty('description');
    expect(body).toHaveProperty('context');
  });
});
