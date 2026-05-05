import { validatePR, formatValidationResult, PRData } from '../validator';
import { PrcheckConfig } from '../../config/schema';
import { getDefaultConfig } from '../../config/defaults';

const basePR: PRData = {
  title: 'feat: add new feature',
  body: '## Summary\nThis PR adds a new feature.\n\n## Testing\nUnit tests added.',
  author: 'alice',
  reviewers: ['bob'],
  labels: [],
  baseBranch: 'main',
};

const baseConfig: PrcheckConfig = getDefaultConfig();

describe('validatePR', () => {
  it('returns passed=true for a valid PR', () => {
    const result = validatePR(basePR, baseConfig);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns errors when template sections are missing', () => {
    const pr: PRData = { ...basePR, body: 'No sections here.' };
    const config: PrcheckConfig = {
      ...baseConfig,
      template: {
        requiredSections: ['## Summary', '## Testing'],
      },
    };
    const result = validatePR(pr, config);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.rule === 'template')).toBe(true);
  });

  it('returns errors when required reviewers are missing', () => {
    const pr: PRData = { ...basePR, reviewers: [] };
    const config: PrcheckConfig = {
      ...baseConfig,
      reviewers: {
        required: ['bob'],
        minCount: 1,
      },
    };
    const result = validatePR(pr, config);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.rule === 'reviewers')).toBe(true);
  });

  it('collects both template and reviewer errors', () => {
    const pr: PRData = { ...basePR, body: '', reviewers: [] };
    const config: PrcheckConfig = {
      ...baseConfig,
      template: { requiredSections: ['## Summary'] },
      reviewers: { required: ['bob'], minCount: 1 },
    };
    const result = validatePR(pr, config);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('formatValidationResult', () => {
  it('shows passed message on success', () => {
    const result = validatePR(basePR, baseConfig);
    const output = formatValidationResult(result);
    expect(output).toContain('✅');
  });

  it('shows failed message and errors on failure', () => {
    const pr: PRData = { ...basePR, body: '' };
    const config: PrcheckConfig = {
      ...baseConfig,
      template: { requiredSections: ['## Summary'] },
    };
    const result = validatePR(pr, config);
    const output = formatValidationResult(result);
    expect(output).toContain('❌');
    expect(output).toContain('[ERROR]');
  });
});
