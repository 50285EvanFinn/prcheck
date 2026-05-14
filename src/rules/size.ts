import { PRCheckInput, RuleResult } from '../config/schema';

export interface SizeRule {
  maxAdditions?: number;
  maxDeletions?: number;
  maxChangedFiles?: number;
  warnOnly?: boolean;
}

export interface PRSizeInfo {
  additions: number;
  deletions: number;
  changedFiles: number;
}

export function evaluateSizeRules(
  input: PRCheckInput,
  rule: SizeRule
): RuleResult[] {
  const results: RuleResult[] = [];

  const size: PRSizeInfo = {
    additions: input.additions ?? 0,
    deletions: input.deletions ?? 0,
    changedFiles: input.changedFiles ?? 0,
  };

  if (
    rule.maxAdditions !== undefined &&
    size.additions > rule.maxAdditions
  ) {
    results.push({
      rule: 'size.maxAdditions',
      passed: false,
      severity: rule.warnOnly ? 'warning' : 'error',
      message: `PR has ${size.additions} additions, exceeding the limit of ${rule.maxAdditions}.`,
    });
  }

  if (
    rule.maxDeletions !== undefined &&
    size.deletions > rule.maxDeletions
  ) {
    results.push({
      rule: 'size.maxDeletions',
      passed: false,
      severity: rule.warnOnly ? 'warning' : 'error',
      message: `PR has ${size.deletions} deletions, exceeding the limit of ${rule.maxDeletions}.`,
    });
  }

  if (
    rule.maxChangedFiles !== undefined &&
    size.changedFiles > rule.maxChangedFiles
  ) {
    results.push({
      rule: 'size.maxChangedFiles',
      passed: false,
      severity: rule.warnOnly ? 'warning' : 'error',
      message: `PR touches ${size.changedFiles} files, exceeding the limit of ${rule.maxChangedFiles}.`,
    });
  }

  if (results.length === 0) {
    results.push({
      rule: 'size',
      passed: true,
      severity: 'info',
      message: 'PR size is within configured limits.',
    });
  }

  return results;
}
