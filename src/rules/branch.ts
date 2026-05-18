import { PRCheckInput, RuleResult } from '../config/schema';

export interface BranchRules {
  pattern?: string;
  forbiddenPrefixes?: string[];
  requiredBaseBranch?: string;
  maxLength?: number;
}

export function evaluateBranchRules(
  input: PRCheckInput,
  rules: BranchRules
): RuleResult[] {
  const results: RuleResult[] = [];
  const branch = input.headBranch ?? '';
  const base = input.baseBranch ?? '';

  if (rules.pattern) {
    const regex = new RegExp(rules.pattern);
    if (!regex.test(branch)) {
      results.push({
        rule: 'branch.pattern',
        passed: false,
        message: `Branch "${branch}" does not match required pattern: ${rules.pattern}`,
      });
    } else {
      results.push({
        rule: 'branch.pattern',
        passed: true,
        message: `Branch "${branch}" matches required pattern.`,
      });
    }
  }

  if (rules.forbiddenPrefixes && rules.forbiddenPrefixes.length > 0) {
    const matched = rules.forbiddenPrefixes.find((prefix) =>
      branch.startsWith(prefix)
    );
    if (matched) {
      results.push({
        rule: 'branch.forbiddenPrefixes',
        passed: false,
        message: `Branch "${branch}" uses forbidden prefix "${matched}".`,
      });
    } else {
      results.push({
        rule: 'branch.forbiddenPrefixes',
        passed: true,
        message: `Branch "${branch}" does not use any forbidden prefix.`,
      });
    }
  }

  if (rules.requiredBaseBranch) {
    if (base !== rules.requiredBaseBranch) {
      results.push({
        rule: 'branch.requiredBaseBranch',
        passed: false,
        message: `Base branch must be "${rules.requiredBaseBranch}", got "${base}".`,
      });
    } else {
      results.push({
        rule: 'branch.requiredBaseBranch',
        passed: true,
        message: `Base branch is "${base}" as required.`,
      });
    }
  }

  if (rules.maxLength !== undefined) {
    if (branch.length > rules.maxLength) {
      results.push({
        rule: 'branch.maxLength',
        passed: false,
        message: `Branch name length ${branch.length} exceeds maximum of ${rules.maxLength}.`,
      });
    } else {
      results.push({
        rule: 'branch.maxLength',
        passed: true,
        message: `Branch name length ${branch.length} is within limit.`,
      });
    }
  }

  return results;
}
