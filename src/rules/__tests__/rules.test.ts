import { evaluateReviewerRules } from '../reviewer';
import { evaluateTemplate } from '../template';
import { PrcheckConfig } from '../../config/schema';

const baseConfig: PrcheckConfig = {
  reviewerRules: [
    { pattern: 'src/.*\.ts', reviewers: ['alice', 'bob'], minReviewers: 1 },
  ],
  templateFields: [
    { name: 'Summary', required: true },
    { name: 'Testing', required: true, pattern: '##\\s*Testing' },
  ],
};

describe('evaluateReviewerRules', () => {
  it('passes when a required reviewer is assigned', () => {
    const result = evaluateReviewerRules(baseConfig, ['src/index.ts'], ['alice']);
    expect(result.satisfied).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('fails when no required reviewer is assigned', () => {
    const result = evaluateReviewerRules(baseConfig, ['src/index.ts'], ['charlie']);
    expect(result.satisfied).toBe(false);
    expect(result.missing).toContain('alice');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('passes when changed files do not match any rule', () => {
    const result = evaluateReviewerRules(baseConfig, ['docs/readme.md'], []);
    expect(result.satisfied).toBe(true);
  });

  it('returns satisfied when no rules configured', () => {
    const result = evaluateReviewerRules({ reviewerRules: [] }, ['src/index.ts'], []);
    expect(result.satisfied).toBe(true);
  });
});

describe('evaluateTemplate', () => {
  it('passes when all required sections are present', () => {
    const body = '## Summary\nDid stuff.\n## Testing\nRan tests.';
    const result = evaluateTemplate(baseConfig, body);
    expect(result.satisfied).toBe(true);
    expect(result.missingFields).toHaveLength(0);
  });

  it('fails when a required heading is missing', () => {
    const body = '## Testing\nRan tests.';
    const result = evaluateTemplate(baseConfig, body);
    expect(result.satisfied).toBe(false);
    expect(result.missingFields).toContain('Summary');
  });

  it('fails when a pattern-based field is missing', () => {
    const body = '## Summary\nDid stuff.';
    const result = evaluateTemplate(baseConfig, body);
    expect(result.satisfied).toBe(false);
    expect(result.missingFields).toContain('Testing');
  });

  it('returns satisfied when no fields configured', () => {
    const result = evaluateTemplate({ templateFields: [] }, 'empty body');
    expect(result.satisfied).toBe(true);
  });
});
