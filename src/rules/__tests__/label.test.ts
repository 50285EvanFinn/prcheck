import { evaluateLabelRules } from '../label';
import { CheckInput } from '../../config/schema';

function makeInput(labels: string[]): CheckInput {
  return {
    title: 'Test PR',
    body: 'Some description',
    author: 'user',
    labels,
    reviewers: [],
    baseBranch: 'main',
    headBranch: 'feature/test',
    additions: 10,
    deletions: 5,
    changedFiles: 2,
    commitCount: 1,
    createdAt: new Date().toISOString(),
  };
}

describe('evaluateLabelRules', () => {
  it('passes when required label is present', () => {
    const results = evaluateLabelRules(makeInput(['bug']), { required: ['bug'] });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it('fails when required label is missing', () => {
    const results = evaluateLabelRules(makeInput([]), { required: ['bug'] });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('"bug"');
  });

  it('passes when forbidden label is absent', () => {
    const results = evaluateLabelRules(makeInput(['bug']), { forbidden: ['wip'] });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
  });

  it('fails when forbidden label is present', () => {
    const results = evaluateLabelRules(makeInput(['wip']), { forbidden: ['wip'] });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('"wip"');
  });

  it('passes requireAtLeastOne when one label from group is present', () => {
    const results = evaluateLabelRules(makeInput(['enhancement']), {
      requireAtLeastOne: [['bug', 'enhancement', 'feature']],
    });
    expect(results[0].passed).toBe(true);
  });

  it('fails requireAtLeastOne when no label from group is present', () => {
    const results = evaluateLabelRules(makeInput(['wip']), {
      requireAtLeastOne: [['bug', 'enhancement', 'feature']],
    });
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toContain('bug');
  });

  it('returns empty results when no rules configured', () => {
    const results = evaluateLabelRules(makeInput(['bug']), {});
    expect(results).toHaveLength(0);
  });

  it('handles missing labels field on input gracefully', () => {
    const input = makeInput([]);
    (input as any).labels = undefined;
    const results = evaluateLabelRules(input, { required: ['bug'] });
    expect(results[0].passed).toBe(false);
  });
});
