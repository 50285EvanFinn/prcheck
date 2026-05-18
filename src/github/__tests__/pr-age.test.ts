import * as https from 'https';
import { EventEmitter } from 'events';
import { fetchPRMetadata } from '../pr-age';

function mockRequest(responseBody: object) {
  const res = new EventEmitter() as any;
  res.statusCode = 200;

  jest.spyOn(https, 'request').mockImplementation((_opts: any, cb: any) => {
    cb(res);
    setTimeout(() => {
      res.emit('data', JSON.stringify(responseBody));
      res.emit('end');
    }, 0);
    const req = new EventEmitter() as any;
    req.end = jest.fn();
    return req;
  });
}

describe('fetchPRMetadata', () => {
  afterEach(() => jest.restoreAllMocks());

  it('parses created_at and draft fields', async () => {
    mockRequest({
      number: 42,
      title: 'My PR',
      created_at: '2024-01-15T10:00:00Z',
      draft: false,
    });

    const result = await fetchPRMetadata('owner', 'repo', 42, 'token');
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
    expect(result.isDraft).toBe(false);
    expect(result.number).toBe(42);
    expect(result.title).toBe('My PR');
  });

  it('marks draft PRs correctly', async () => {
    mockRequest({
      number: 7,
      title: 'Draft PR',
      created_at: '2024-03-01T08:00:00Z',
      draft: true,
    });

    const result = await fetchPRMetadata('owner', 'repo', 7, 'token');
    expect(result.isDraft).toBe(true);
  });

  it('calls the correct GitHub API endpoint', async () => {
    mockRequest({ number: 1, title: 'T', created_at: '2024-01-01T00:00:00Z', draft: false });
    await fetchPRMetadata('myorg', 'myrepo', 1, 'tok');
    const call = (https.request as jest.Mock).mock.calls[0][0];
    expect(call.path).toBe('/repos/myorg/myrepo/pulls/1');
    expect(call.headers['Authorization']).toBe('Bearer tok');
  });
});
