import * as https from 'https';
import { getPRMilestone, setPRMilestone } from '../pr-milestone';
import { EventEmitter } from 'events';

function mockRequest(
  responseBody: string,
  cb: (opts: https.RequestOptions, body?: string) => void = () => {}
) {
  const res = new EventEmitter() as any;
  const req = new EventEmitter() as any;
  req.write = jest.fn();
  req.end = jest.fn(() => {
    res.emit('data', responseBody);
    res.emit('end');
  });
  jest.spyOn(https, 'request').mockImplementation((options: any, handler: any) => {
    cb(options);
    handler(res);
    return req;
  });
  return req;
}

afterEach(() => jest.restoreAllMocks());

describe('getPRMilestone', () => {
  it('returns milestone when present', async () => {
    const milestone = { number: 1, title: 'v1.0', state: 'open', due_on: null };
    mockRequest(JSON.stringify({ milestone }));
    const result = await getPRMilestone('owner', 'repo', 42, 'token');
    expect(result).toEqual(milestone);
  });

  it('returns null when no milestone', async () => {
    mockRequest(JSON.stringify({ milestone: null }));
    const result = await getPRMilestone('owner', 'repo', 42, 'token');
    expect(result).toBeNull();
  });

  it('calls correct GitHub API path', async () => {
    let capturedPath = '';
    mockRequest(JSON.stringify({ milestone: null }), (opts) => {
      capturedPath = opts.path as string;
    });
    await getPRMilestone('myorg', 'myrepo', 7, 'token');
    expect(capturedPath).toBe('/repos/myorg/myrepo/pulls/7');
  });
});

describe('setPRMilestone', () => {
  it('sends PATCH request with milestone number', async () => {
    let capturedMethod = '';
    let capturedPath = '';
    const req = mockRequest('{}', (opts) => {
      capturedMethod = opts.method as string;
      capturedPath = opts.path as string;
    });
    await setPRMilestone('owner', 'repo', 10, 3, 'token');
    expect(capturedMethod).toBe('PATCH');
    expect(capturedPath).toBe('/repos/owner/repo/issues/10');
    expect(req.write).toHaveBeenCalledWith(JSON.stringify({ milestone: 3 }));
  });
});
