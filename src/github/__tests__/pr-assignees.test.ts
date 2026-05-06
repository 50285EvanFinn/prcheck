import * as https from 'https';
import { EventEmitter } from 'events';
import { assignReviewers } from '../pr-assignees';
import { runReviewerAssignment } from '../pr-assignees-runner';
import { ValidationResult } from '../../rules/validator';

function mockRequest(
  statusCode: number,
  responseData: string
): jest.SpyInstance {
  return jest.spyOn(https, 'request').mockImplementation((_opts, cb) => {
    const res = Object.assign(new EventEmitter(), { statusCode });
    const req = Object.assign(new EventEmitter(), { write: jest.fn(), end: jest.fn() });
    setTimeout(() => {
      (cb as Function)(res);
      res.emit('data', responseData);
      res.emit('end');
    }, 0);
    return req as unknown as https.ClientRequest;
  });
}

const BASE_OPTS = { owner: 'org', repo: 'repo', prNumber: 42, token: 'tok' };

const makeResult = (reviewers: string[]): ValidationResult => ({
  passed: true,
  templateCheck: { passed: true, missingFields: [], presentFields: [] },
  reviewerRules: reviewers.length
    ? [{ ruleName: 'test', passed: true, suggestedReviewers: reviewers }]
    : [],
  summary: '',
});

describe('assignReviewers', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns added reviewers on 201', async () => {
    mockRequest(201, JSON.stringify({ reviewers: [{ login: 'alice' }, { login: 'bob' }] }));
    const result = await assignReviewers('org', 'repo', 1, ['alice', 'bob'], 'tok');
    expect(result.added).toEqual(['alice', 'bob']);
    expect(result.errors).toHaveLength(0);
  });

  it('returns error on non-2xx status', async () => {
    mockRequest(422, 'Unprocessable Entity');
    const result = await assignReviewers('org', 'repo', 1, ['ghost'], 'tok');
    expect(result.errors[0]).toMatch('422');
    expect(result.added).toHaveLength(0);
  });

  it('returns empty result when no reviewers provided', async () => {
    const spy = jest.spyOn(https, 'request');
    const result = await assignReviewers('org', 'repo', 1, [], 'tok');
    expect(result.added).toHaveLength(0);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('runReviewerAssignment', () => {
  afterEach(() => jest.restoreAllMocks());

  it('skips all in dry-run mode', async () => {
    const result = await runReviewerAssignment(makeResult(['alice']), { ...BASE_OPTS, dryRun: true });
    expect(result.skipped).toContain('alice');
    expect(result.added).toHaveLength(0);
  });

  it('returns empty result when no suggested reviewers', async () => {
    const result = await runReviewerAssignment(makeResult([]), BASE_OPTS);
    expect(result.added).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);
  });

  it('deduplicates reviewers before assigning', async () => {
    mockRequest(201, JSON.stringify({ reviewers: [{ login: 'alice' }] }));
    const vr: ValidationResult = {
      passed: true,
      templateCheck: { passed: true, missingFields: [], presentFields: [] },
      reviewerRules: [
        { ruleName: 'r1', passed: true, suggestedReviewers: ['alice'] },
        { ruleName: 'r2', passed: true, suggestedReviewers: ['alice'] },
      ],
      summary: '',
    };
    const result = await runReviewerAssignment(vr, BASE_OPTS);
    expect(result.added).toEqual(['alice']);
  });
});
