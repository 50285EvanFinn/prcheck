import { evaluateTitleRules } from '../title';
import { PRCheckInput } from '../../config/schema';

function makeInput(title: string): PRCheckInput {
  return {
    title,
    body: '',
    author: 'user',
    reviewers: [],
    labels: [],
    baseBranch: 'main',
    headBranch: 'feature/test',
    changedFiles: 0,
    additions: 0,
    deletions: 0,
    milestone: null,
    assignees: [],
  };
}

describe('evaluateTitleRules', () => {
  it('passes when title matches pattern', () => {
    const results = evaluateTitleRules(makeInput('feat: add login'), { pattern: '^(feat|fix|chore):' });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it('fails when title does not match pattern', () => {
    const results = evaluateTitleRules(makeInput('added login'), { pattern: '^(feat|fix|chore):' });
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('pattern');
  });

  it('fails when title is shorter than minLength', () => {
    const results = evaluateTitleRules(makeInput('fix'), { minLength: 10 });
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('at least 10');
  });

  it('passes when title meets minLength', () => {
    const results = evaluateTitleRules(makeInput('fix the login bug'), { minLength: 10 });
    expect(results[0].passed).toBe(true);
  });

  it('fails when title exceeds maxLength', () => {
    const results = evaluateTitleRules(makeInput('a'.repeat(80)), { maxLength: 72 });
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('at most 72');
  });

  it('passes when title is within maxLength', () => {
    const results = evaluateTitleRules(makeInput('short title'), { maxLength: 72 });
    expect(results[0].passed).toBe(true);
  });

  it('fails when title starts with a disallowed prefix', () => {
    const results = evaluateTitleRules(makeInput('WIP: do stuff'), {
      disallowedPrefixes: ['WIP', 'DRAFT'],
    });
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('WIP');
  });

  it('passes when title does not use any disallowed prefix', () => {
    const results = evaluateTitleRules(makeInput('feat: proper title'), {
      disallowedPrefixes: ['WIP', 'DRAFT'],
    });
    expect(results[0].passed).toBe(true);
  });

  it('returns no results when config is empty', () => {
    const results = evaluateTitleRules(makeInput('anything'), {});
    expect(results).toHaveLength(0);
  });

  it('evaluates multiple rules together', () => {
    const results = evaluateTitleRules(makeInput('feat: ok'), {
      pattern: '^feat:',
      minLength: 5,
      maxLength: 72,
    });
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.passed)).toBe(true);
  });
});
