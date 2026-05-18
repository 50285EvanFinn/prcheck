import { evaluateCommitRules } from '../commits';
import { CheckInput } from '../../config/schema';

function makeInput(commits: string[]): CheckInput {
  return {
    title: 'Test PR',
    body: '',
    author: 'dev',
    reviewers: [],
    labels: [],
    commits,
    additions: 0,
    deletions: 0,
    baseBranch: 'main',
    headBranch: 'feature/test',
  } as CheckInput;
}

describe('evaluateCommitRules', () => {
  it('passes when commits meet minCount', () => {
    const results = evaluateCommitRules(makeInput(['fix: a', 'feat: b']), { minCount: 2 });
    expect(results).toHaveLength(0);
  });

  it('fails when commits below minCount', () => {
    const results = evaluateCommitRules(makeInput(['fix: a']), { minCount: 2 });
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('commits.minCount');
    expect(results[0].passed).toBe(false);
  });

  it('fails when commits exceed maxCount', () => {
    const results = evaluateCommitRules(makeInput(['a', 'b', 'c', 'd']), { maxCount: 3 });
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('commits.maxCount');
  });

  it('passes when commits match pattern', () => {
    const results = evaluateCommitRules(makeInput(['fix: foo', 'feat: bar']), {
      pattern: '^(fix|feat): .+',
    });
    expect(results).toHaveLength(0);
  });

  it('fails when some commits do not match pattern', () => {
    const results = evaluateCommitRules(makeInput(['fix: foo', 'WIP stuff']), {
      pattern: '^(fix|feat): .+',
    });
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('commits.pattern');
    expect(results[0].message).toContain('WIP stuff');
  });

  it('passes conventional commits check', () => {
    const results = evaluateCommitRules(
      makeInput(['feat(api): add endpoint', 'fix!: breaking change']),
      { requireConventional: true }
    );
    expect(results).toHaveLength(0);
  });

  it('fails when commits are not conventional', () => {
    const results = evaluateCommitRules(makeInput(['Added stuff', 'feat: ok']), {
      requireConventional: true,
    });
    expect(results).toHaveLength(1);
    expect(results[0].rule).toBe('commits.requireConventional');
    expect(results[0].message).toContain('Added stuff');
  });

  it('returns no results when no rules configured', () => {
    const results = evaluateCommitRules(makeInput(['anything']), {});
    expect(results).toHaveLength(0);
  });

  it('handles empty commits array gracefully', () => {
    const results = evaluateCommitRules(makeInput([]), { minCount: 1 });
    expect(results[0].passed).toBe(false);
  });
});
