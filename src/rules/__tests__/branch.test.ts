import { evaluateBranchRules } from '../branch';
import { PRCheckInput } from '../../config/schema';

function makeInput(overrides: Partial<PRCheckInput> = {}): PRCheckInput {
  return {
    title: 'Test PR',
    body: '',
    author: 'user',
    reviewers: [],
    headBranch: 'feature/my-feature',
    baseBranch: 'main',
    labels: [],
    ...overrides,
  };
}

describe('evaluateBranchRules', () => {
  it('passes when branch matches pattern', () => {
    const results = evaluateBranchRules(makeInput(), { pattern: '^feature/' });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it('fails when branch does not match pattern', () => {
    const results = evaluateBranchRules(
      makeInput({ headBranch: 'my-random-branch' }),
      { pattern: '^feature/' }
    );
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('does not match required pattern');
  });

  it('fails when branch uses a forbidden prefix', () => {
    const results = evaluateBranchRules(
      makeInput({ headBranch: 'wip/something' }),
      { forbiddenPrefixes: ['wip/', 'tmp/'] }
    );
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('forbidden prefix');
  });

  it('passes when branch does not use any forbidden prefix', () => {
    const results = evaluateBranchRules(makeInput(), {
      forbiddenPrefixes: ['wip/', 'tmp/'],
    });
    expect(results[0].passed).toBe(true);
  });

  it('fails when base branch is wrong', () => {
    const results = evaluateBranchRules(
      makeInput({ baseBranch: 'develop' }),
      { requiredBaseBranch: 'main' }
    );
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('Base branch must be');
  });

  it('passes when base branch matches required', () => {
    const results = evaluateBranchRules(makeInput(), {
      requiredBaseBranch: 'main',
    });
    expect(results[0].passed).toBe(true);
  });

  it('fails when branch name exceeds maxLength', () => {
    const results = evaluateBranchRules(
      makeInput({ headBranch: 'feature/this-is-a-very-long-branch-name-that-exceeds-limit' }),
      { maxLength: 30 }
    );
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('exceeds maximum');
  });

  it('passes when branch name is within maxLength', () => {
    const results = evaluateBranchRules(makeInput(), { maxLength: 50 });
    expect(results[0].passed).toBe(true);
  });

  it('returns multiple results for multiple rules', () => {
    const results = evaluateBranchRules(makeInput(), {
      pattern: '^feature/',
      requiredBaseBranch: 'main',
      maxLength: 100,
    });
    expect(results).toHaveLength(3);
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('returns empty array when no rules provided', () => {
    const results = evaluateBranchRules(makeInput(), {});
    expect(results).toHaveLength(0);
  });
});
