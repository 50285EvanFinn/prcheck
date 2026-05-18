import { CheckInput, RuleResult } from '../config/schema';

export interface AgeRulesConfig {
  maxAgeDays?: number;
  warnAgeDays?: number;
  ignoreDraftPRs?: boolean;
}

function daysBetween(dateStr: string, now: Date): number {
  const created = new Date(dateStr);
  const diffMs = now.getTime() - created.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

export function evaluateAgeRules(
  input: CheckInput,
  config: AgeRulesConfig
): RuleResult[] {
  const results: RuleResult[] = [];

  if (!input.createdAt) {
    return results;
  }

  if (config.ignoreDraftPRs && input.isDraft) {
    return results;
  }

  const now = new Date();
  const ageDays = daysBetween(input.createdAt, now);
  const ageLabel = ageDays < 1
    ? `${Math.round(ageDays * 24)}h`
    : `${Math.floor(ageDays)}d`;

  if (config.maxAgeDays !== undefined && ageDays > config.maxAgeDays) {
    results.push({
      rule: 'pr-age',
      passed: false,
      message: `PR is ${ageLabel} old, exceeding the maximum of ${config.maxAgeDays} days.`,
    });
    return results;
  }

  if (config.warnAgeDays !== undefined && ageDays > config.warnAgeDays) {
    results.push({
      rule: 'pr-age',
      passed: true,
      message: `PR is ${ageLabel} old (warning threshold: ${config.warnAgeDays} days).`,
      warning: true,
    });
    return results;
  }

  results.push({
    rule: 'pr-age',
    passed: true,
    message: `PR age is within acceptable range (${ageLabel}).`,
  });

  return results;
}
