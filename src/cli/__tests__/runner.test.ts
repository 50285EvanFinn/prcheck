import { runCLI } from '../runner';
import * as loader from '../../config/loader';
import * as validator from '../../rules/validator';
import { getDefaultConfig } from '../../config/defaults';

jest.mock('../../config/loader');
jest.mock('../../rules/validator');

const mockLoadConfigFromDir = loader.loadConfigFromDir as jest.MockedFunction<typeof loader.loadConfigFromDir>;
const mockValidatePR = validator.validatePR as jest.MockedFunction<typeof validator.validatePR>;
const mockFormatValidationResult = validator.formatValidationResult as jest.MockedFunction<typeof validator.formatValidationResult>;

const defaultConfig = getDefaultConfig();

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadConfigFromDir.mockResolvedValue(defaultConfig);
  mockValidatePR.mockReturnValue({ passed: true, errors: [], warnings: [] });
  mockFormatValidationResult.mockReturnValue(['✅ All checks passed']);
});

describe('runCLI', () => {
  it('returns exit code 0 when validation passes', async () => {
    const result = await runCLI({
      owner: 'acme',
      repo: 'api',
      prNumber: 42,
      title: 'feat: add endpoint',
      body: '## Summary\nAdded new endpoint.',
    });

    expect(result.exitCode).toBe(0);
    expect(result.output).toContain('✅ All checks passed');
  });

  it('returns exit code 1 when validation fails', async () => {
    mockValidatePR.mockReturnValue({ passed: false, errors: ['Missing reviewers'], warnings: [] });
    mockFormatValidationResult.mockReturnValue(['❌ Missing reviewers']);

    const result = await runCLI({
      owner: 'acme',
      repo: 'api',
      prNumber: 7,
      title: 'fix: bug',
      body: '',
    });

    expect(result.exitCode).toBe(1);
    expect(result.output).toContain('❌ Missing reviewers');
  });

  it('parses pr-ref shorthand correctly', async () => {
    const result = await runCLI({ prRef: 'acme/api#99', title: 'chore: update deps', body: 'Updated.' });
    expect(result.exitCode).toBe(0);
    expect(mockValidatePR).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'acme', repo: 'api', prNumber: 99 }),
      defaultConfig
    );
  });

  it('returns error when no PR reference provided', async () => {
    const result = await runCLI({});
    expect(result.exitCode).toBe(1);
    expect(result.output[0]).toMatch(/Must provide/);
  });

  it('returns error on invalid pr-ref format', async () => {
    const result = await runCLI({ prRef: 'not-a-valid-ref' });
    expect(result.exitCode).toBe(1);
    expect(result.output[0]).toMatch(/Invalid PR reference/);
  });

  it('includes verbose output when flag is set', async () => {
    const result = await runCLI({
      owner: 'acme',
      repo: 'api',
      prNumber: 1,
      title: 'docs: update readme',
      body: 'Updated readme.',
      verbose: true,
    });

    expect(result.output.some((line) => line.includes('acme/api'))).toBe(true);
  });
});
