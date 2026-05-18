import { PRCheckInput, RuleResult } from '../config/schema';

export interface TitleRulesConfig {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  disallowedPrefixes?: string[];
}

export function evaluateTitleRules(
  input: PRCheckInput,
  config: TitleRulesConfig
): RuleResult[] {
  const results: RuleResult[] = [];
  const title = input.title ?? '';

  if (config.pattern) {
    const regex = new RegExp(config.pattern);
    if (!regex.test(title)) {
      results.push({
        rule: 'title.pattern',
        passed: false,
        message: `PR title must match pattern: ${config.pattern}`,
      });
    } else {
      results.push({
        rule: 'title.pattern',
        passed: true,
        message: 'PR title matches required pattern',
      });
    }
  }

  if (config.minLength !== undefined) {
    const passed = title.length >= config.minLength;
    results.push({
      rule: 'title.minLength',
      passed,
      message: passed
        ? `PR title meets minimum length of ${config.minLength}`
        : `PR title must be at least ${config.minLength} characters (got ${title.length})`,
    });
  }

  if (config.maxLength !== undefined) {
    const passed = title.length <= config.maxLength;
    results.push({
      rule: 'title.maxLength',
      passed,
      message: passed
        ? `PR title is within maximum length of ${config.maxLength}`
        : `PR title must be at most ${config.maxLength} characters (got ${title.length})`,
    });
  }

  if (config.disallowedPrefixes && config.disallowedPrefixes.length > 0) {
    const matched = config.disallowedPrefixes.find((prefix) =>
      title.toLowerCase().startsWith(prefix.toLowerCase())
    );
    if (matched) {
      results.push({
        rule: 'title.disallowedPrefixes',
        passed: false,
        message: `PR title must not start with disallowed prefix: "${matched}"`,
      });
    } else {
      results.push({
        rule: 'title.disallowedPrefixes',
        passed: true,
        message: 'PR title does not use any disallowed prefix',
      });
    }
  }

  return results;
}
