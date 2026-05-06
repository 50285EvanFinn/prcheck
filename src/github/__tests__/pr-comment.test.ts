import { buildCommentBody } from '../pr-comment';
import { ValidationResult } from '../../rules/validator';

function makeResult(overrides: Partial<ValidationResult> = {}): ValidationResult {
  return {
    passed: true,
    errors: [],
    warnings: [],
    ...overrides,
  };
}

describe('buildCommentBody', () => {
  it('returns a passing message when result is passed', () => {
    const result = makeResult({ passed: true });
    const body = buildCommentBody(result);
    expect(body).toContain('✅ PR Check Passed');
    expect(body).toContain('All checks passed successfully.');
    expect(body).not.toContain('❌');
  });

  it('returns a failing message with errors listed', () => {
    const result = makeResult({
      passed: false,
      errors: ['Missing description section', 'No reviewers assigned'],
    });
    const body = buildCommentBody(result);
    expect(body).toContain('❌ PR Check Failed');
    expect(body).toContain('- Missing description section');
    expect(body).toContain('- No reviewers assigned');
  });

  it('includes warnings section when warnings are present', () => {
    const result = makeResult({
      passed: true,
      warnings: ['Consider adding more detail to the summary'],
    });
    const body = buildCommentBody(result);
    expect(body).toContain('⚠️ Warnings');
    expect(body).toContain('- Consider adding more detail to the summary');
  });

  it('omits warnings section when there are no warnings', () => {
    const result = makeResult({ passed: true, warnings: [] });
    const body = buildCommentBody(result);
    expect(body).not.toContain('Warnings');
  });

  it('always includes the prcheck footer', () => {
    const body = buildCommentBody(makeResult());
    expect(body).toContain('_Posted by [prcheck]');
  });

  it('includes both errors and warnings when both are present', () => {
    const result = makeResult({
      passed: false,
      errors: ['Template mismatch'],
      warnings: ['Reviewer count is low'],
    });
    const body = buildCommentBody(result);
    expect(body).toContain('- Template mismatch');
    expect(body).toContain('- Reviewer count is low');
  });
});
