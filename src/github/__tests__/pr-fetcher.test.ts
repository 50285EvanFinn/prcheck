import { parsePRReference, FetchOptions } from '../pr-fetcher';

describe('parsePRReference', () => {
  it('parses a valid owner/repo#number reference', () => {
    const result = parsePRReference('myorg/myrepo#42');
    expect(result).toEqual({ owner: 'myorg', repo: 'myrepo', prNumber: 42 });
  });

  it('returns null for invalid format', () => {
    expect(parsePRReference('not-a-reference')).toBeNull();
    expect(parsePRReference('owner/repo')).toBeNull();
    expect(parsePRReference('owner/repo#abc')).toBeNull();
  });

  it('handles hyphenated owner and repo names', () => {
    const result = parsePRReference('my-org/my-repo#100');
    expect(result).toEqual({ owner: 'my-org', repo: 'my-repo', prNumber: 100 });
  });
});

describe('getContextFromEnv (via context module)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws when GITHUB_TOKEN is missing', () => {
    delete process.env.GITHUB_TOKEN;
    const { getContextFromEnv } = require('../context');
    expect(() => getContextFromEnv()).toThrow('GITHUB_TOKEN');
  });

  it('throws when GITHUB_REPOSITORY is missing', () => {
    process.env.GITHUB_TOKEN = 'test-token';
    delete process.env.GITHUB_REPOSITORY;
    const { getContextFromEnv } = require('../context');
    expect(() => getContextFromEnv()).toThrow('GITHUB_REPOSITORY');
  });

  it('throws when PR number cannot be determined', () => {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    delete process.env.GITHUB_EVENT_PATH;
    delete process.env.PR_NUMBER;
    const { getContextFromEnv } = require('../context');
    expect(() => getContextFromEnv()).toThrow('PR number');
  });

  it('reads PR number from PR_NUMBER env var', () => {
    process.env.GITHUB_TOKEN = 'test-token';
    process.env.GITHUB_REPOSITORY = 'owner/repo';
    process.env.PR_NUMBER = '7';
    delete process.env.GITHUB_EVENT_PATH;
    jest.resetModules();
    const { getContextFromEnv } = require('../context');
    const ctx = getContextFromEnv();
    expect(ctx).toEqual({ owner: 'owner', repo: 'repo', prNumber: 7, token: 'test-token' });
  });
});
