import { evaluateSizeRules, SizeRule } from '../size';
import { PRCheckInput } from '../../config/schema';

function makeInput(overrides: Partial<PRCheckInput> = {}): PRCheckInput {
  return {
    title: 'Test PR',
    body: 'Some description',
    author: 'dev',
    reviewers: [],
    labels: [],
    additions: 0,
    deletions: 0,
    changedFiles: 0,
    ...overrides,
  } as PRCheckInput;
}

describe('evaluateSizeRules', () => {
  it('passes when all values are within limits', () => {
    const rule: SizeRule = { maxAdditions: 500, maxDeletions: 200, maxChangedFiles: 10 };
    const input = makeInput({ additions: 100, deletions: 50, changedFiles: 3 });
    const results = evaluateSizeRules(input, rule);
    expect(results).toHaveLength(1);
    expect(results[0].passed).toBe(true);
    expect(results[0].rule).toBe('size');
  });

  it('fails when additions exceed limit', () => {
    const rule: SizeRule = { maxAdditions: 100 };
    const input = makeInput({ additions: 250 });
    const results = evaluateSizeRules(input, rule);
    const fail = results.find(r => r.rule === 'size.maxAdditions');
    expect(fail).toBeDefined();
    expect(fail?.passed).toBe(false);
    expect(fail?.severity).toBe('error');
  });

  it('fails when deletions exceed limit', () => {
    const rule: SizeRule = { maxDeletions: 50 };
    const input = makeInput({ deletions: 80 });
    const results = evaluateSizeRules(input, rule);
    const fail = results.find(r => r.rule === 'size.maxDeletions');
    expect(fail).toBeDefined();
    expect(fail?.passed).toBe(false);
  });

  it('fails when changedFiles exceed limit', () => {
    const rule: SizeRule = { maxChangedFiles: 5 };
    const input = makeInput({ changedFiles: 12 });
    const results = evaluateSizeRules(input, rule);
    const fail = results.find(r => r.rule === 'size.maxChangedFiles');
    expect(fail).toBeDefined();
    expect(fail?.passed).toBe(false);
  });

  it('uses warning severity when warnOnly is true', () => {
    const rule: SizeRule = { maxAdditions: 10, warnOnly: true };
    const input = makeInput({ additions: 999 });
    const results = evaluateSizeRules(input, rule);
    const fail = results.find(r => r.rule === 'size.maxAdditions');
    expect(fail?.severity).toBe('warning');
  });

  it('returns multiple failures when multiple limits are exceeded', () => {
    const rule: SizeRule = { maxAdditions: 10, maxDeletions: 10, maxChangedFiles: 2 };
    const input = makeInput({ additions: 500, deletions: 300, changedFiles: 20 });
    const results = evaluateSizeRules(input, rule);
    const failures = results.filter(r => !r.passed);
    expect(failures).toHaveLength(3);
  });

  it('defaults missing size fields to 0', () => {
    const rule: SizeRule = { maxAdditions: 50 };
    const input = makeInput({});
    const results = evaluateSizeRules(input, rule);
    expect(results[0].passed).toBe(true);
  });
});
