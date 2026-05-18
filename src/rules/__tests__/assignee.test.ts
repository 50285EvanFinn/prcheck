import { evaluateAssigneeRules } from '../assignee';
import { CheckInput } from '../../config/schema';

function makeInput(assignees: string[]): CheckInput {
  return {
    title: 'Test PR',
    body: 'Some description',
    author: 'dev',
    assignees,
    labels: [],
    baseBranch: 'main',
    headBranch: 'feature/test',
    additions: 10,
    deletions: 5,
    changedFiles: 2,
    commitCount: 1,
    createdAt: new Date().toISOString(),
  } as CheckInput;
}

describe('evaluateAssigneeRules', () => {
  it('fails when requireAssignee is true and no assignees', () => {
    const results = evaluateAssigneeRules(makeInput([]), { requireAssignee: true });
    expect(results.some((r) => r.rule === 'assignee.required' && !r.passed)).toBe(true);
  });

  it('passes when requireAssignee is true and assignee is set', () => {
    const results = evaluateAssigneeRules(makeInput(['alice']), { requireAssignee: true });
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails when below minAssignees', () => {
    const results = evaluateAssigneeRules(makeInput(['alice']), { minAssignees: 2 });
    expect(results.some((r) => r.rule === 'assignee.minAssignees' && !r.passed)).toBe(true);
  });

  it('passes when meeting minAssignees', () => {
    const results = evaluateAssigneeRules(makeInput(['alice', 'bob']), { minAssignees: 2 });
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails when exceeding maxAssignees', () => {
    const results = evaluateAssigneeRules(makeInput(['alice', 'bob', 'carol']), { maxAssignees: 2 });
    expect(results.some((r) => r.rule === 'assignee.maxAssignees' && !r.passed)).toBe(true);
  });

  it('fails when assignee not in allowedAssignees', () => {
    const results = evaluateAssigneeRules(makeInput(['alice', 'eve']), {
      allowedAssignees: ['alice', 'bob'],
    });
    expect(results.some((r) => r.rule === 'assignee.allowedAssignees' && !r.passed)).toBe(true);
  });

  it('passes when all assignees are allowed', () => {
    const results = evaluateAssigneeRules(makeInput(['alice']), {
      allowedAssignees: ['alice', 'bob'],
    });
    expect(results.every((r) => r.passed)).toBe(true);
  });

  it('fails when forbidden assignee is present', () => {
    const results = evaluateAssigneeRules(makeInput(['alice', 'bot']), {
      forbiddenAssignees: ['bot'],
    });
    expect(results.some((r) => r.rule === 'assignee.forbiddenAssignees' && !r.passed)).toBe(true);
  });

  it('returns empty results when no rules configured', () => {
    const results = evaluateAssigneeRules(makeInput([]), {});
    expect(results).toHaveLength(0);
  });
});
