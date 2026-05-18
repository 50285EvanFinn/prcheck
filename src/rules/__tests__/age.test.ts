import { evaluateAgeRules } from '../age';
import { CheckInput } from '../../config/schema';

function makeInput(overrides: Partial<CheckInput> = {}): CheckInput {
  return {
    title: 'Test PR',
    body: 'Description',
    author: 'user',
    labels: [],
    isDraft: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    ...overrides,
  } as CheckInput;
}

describe('evaluateAgeRules', () => {
  it('passes when age is under warnAgeDays', () => {
    const input = makeInput();
    const results = evaluateAgeRules(input, { warnAgeDays: 5, maxAgeDays: 10 });
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].warning).toBeFalsy();
  });

  it('warns when age exceeds warnAgeDays but not maxAgeDays', () => {
    const input = makeInput({
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const results = evaluateAgeRules(input, { warnAgeDays: 5, maxAgeDays: 10 });
    expect(results[0].passed).toBe(true);
    expect(results[0].warning).toBe(true);
    expect(results[0].message).toMatch(/warning threshold/);
  });

  it('fails when age exceeds maxAgeDays', () => {
    const input = makeInput({
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const results = evaluateAgeRules(input, { warnAgeDays: 5, maxAgeDays: 10 });
    expect(results[0].passed).toBe(false);
    expect(results[0].message).toMatch(/exceeding the maximum/);
  });

  it('returns no results when createdAt is missing', () => {
    const input = makeInput({ createdAt: undefined });
    const results = evaluateAgeRules(input, { maxAgeDays: 10 });
    expect(results).toHaveLength(0);
  });

  it('skips draft PRs when ignoreDraftPRs is true', () => {
    const input = makeInput({
      isDraft: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const results = evaluateAgeRules(input, { maxAgeDays: 10, ignoreDraftPRs: true });
    expect(results).toHaveLength(0);
  });

  it('does not skip non-draft PRs when ignoreDraftPRs is true', () => {
    const input = makeInput({
      isDraft: false,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const results = evaluateAgeRules(input, { maxAgeDays: 10, ignoreDraftPRs: true });
    expect(results[0].passed).toBe(false);
  });
});
