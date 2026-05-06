import { buildCheckRunPayload, postCheckRun, CheckRunPayload } from '../check-run';
import * as https from 'https';
import { EventEmitter } from 'events';

function makeResult(passed: boolean, issues: string[] = [], warnings: string[] = []) {
  return { passed, issues, warnings, details: {} };
}

describe('buildCheckRunPayload', () => {
  it('returns success conclusion when passed', () => {
    const payload = buildCheckRunPayload('abc123', makeResult(true));
    expect(payload.conclusion).toBe('success');
    expect(payload.head_sha).toBe('abc123');
    expect(payload.status).toBe('completed');
    expect(payload.output.title).toContain('passed');
  });

  it('returns failure conclusion when not passed', () => {
    const payload = buildCheckRunPayload('def456', makeResult(false, ['Missing section']));
    expect(payload.conclusion).toBe('failure');
    expect(payload.output.text).toContain('Missing section');
  });

  it('includes warnings in output text', () => {
    const payload = buildCheckRunPayload('sha1', makeResult(true, [], ['Optional reviewer missing']));
    expect(payload.output.text).toContain('Optional reviewer missing');
  });

  it('sets text to undefined when no issues or warnings', () => {
    const payload = buildCheckRunPayload('sha2', makeResult(true));
    expect(payload.output.text).toBeUndefined();
  });
});

describe('postCheckRun', () => {
  function mockRequest(statusCode: number) {
    const res = Object.assign(new EventEmitter(), { statusCode, resume: jest.fn() });
    const req = Object.assign(new EventEmitter(), { write: jest.fn(), end: jest.fn() });
    jest.spyOn(https, 'request').mockImplementation((_opts: any, cb: any) => {
      cb(res);
      setTimeout(() => res.emit('end'), 0);
      return req as any;
    });
    return { req, res };
  }

  afterEach(() => jest.restoreAllMocks());

  it('resolves on 201 response', async () => {
    mockRequest(201);
    const payload = buildCheckRunPayload('sha', makeResult(true));
    await expect(postCheckRun('owner', 'repo', 'token', payload)).resolves.toBeUndefined();
  });

  it('rejects on 4xx response', async () => {
    const { res } = mockRequest(403);
    res.resume = jest.fn();
    const payload = buildCheckRunPayload('sha', makeResult(false, ['err']));
    await expect(postCheckRun('owner', 'repo', 'token', payload)).rejects.toThrow('403');
  });
});
