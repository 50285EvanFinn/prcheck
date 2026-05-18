import { CheckInput, RuleResult } from '../config/schema';

export interface CommitRulesConfig {
  pattern?: string;
  minCount?: number;
  maxCount?: number;
  requireConventional?: boolean;
}

const CONVENTIONAL_COMMIT_RE =
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+/;

export function evaluateCommitRules(
  input: CheckInput,
  config: CommitRulesConfig
): RuleResult[] {
  const results: RuleResult[] = [];
  const commits: string[] = input.commits ?? [];

  if (config.minCount !== undefined && commits.length < config.minCount) {
    results.push({
      rule: 'commits.minCount',
      passed: false,
      message: `PR has ${commits.length} commit(s); at least ${config.minCount} required.`,
    });
  }

  if (config.maxCount !== undefined && commits.length > config.maxCount) {
    results.push({
      rule: 'commits.maxCount',
      passed: false,
      message: `PR has ${commits.length} commit(s); no more than ${config.maxCount} allowed.`,
    });
  }

  if (config.pattern) {
    const re = new RegExp(config.pattern);
    const failing = commits.filter((c) => !re.test(c));
    if (failing.length > 0) {
      results.push({
        rule: 'commits.pattern',
        passed: false,
        message: `${failing.length} commit message(s) do not match pattern \`${config.pattern}\`: ${failing.slice(0, 3).map((c) => `"${c}"`).join(', ')}`,
      });
    }
  }

  if (config.requireConventional) {
    const failing = commits.filter((c) => !CONVENTIONAL_COMMIT_RE.test(c));
    if (failing.length > 0) {
      results.push({
        rule: 'commits.requireConventional',
        passed: false,
        message: `${failing.length} commit message(s) do not follow Conventional Commits: ${failing.slice(0, 3).map((c) => `"${c}"`).join(', ')}`,
      });
    }
  }

  return results;
}
