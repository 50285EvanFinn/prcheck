import { CheckInput, RuleResult } from '../config/schema';

export interface LabelRuleConfig {
  required?: string[];
  forbidden?: string[];
  requireAtLeastOne?: string[][];
}

export function evaluateLabelRules(
  input: CheckInput,
  config: LabelRuleConfig
): RuleResult[] {
  const results: RuleResult[] = [];
  const labels: string[] = input.labels ?? [];

  if (config.required && config.required.length > 0) {
    for (const required of config.required) {
      if (!labels.includes(required)) {
        results.push({
          rule: 'label.required',
          passed: false,
          message: `Required label "${required}" is missing from this PR.`,
        });
      } else {
        results.push({
          rule: 'label.required',
          passed: true,
          message: `Required label "${required}" is present.`,
        });
      }
    }
  }

  if (config.forbidden && config.forbidden.length > 0) {
    for (const forbidden of config.forbidden) {
      if (labels.includes(forbidden)) {
        results.push({
          rule: 'label.forbidden',
          passed: false,
          message: `Forbidden label "${forbidden}" is present on this PR.`,
        });
      } else {
        results.push({
          rule: 'label.forbidden',
          passed: true,
          message: `Forbidden label "${forbidden}" is not present.`,
        });
      }
    }
  }

  if (config.requireAtLeastOne && config.requireAtLeastOne.length > 0) {
    for (const group of config.requireAtLeastOne) {
      const hasOne = group.some((label) => labels.includes(label));
      if (!hasOne) {
        results.push({
          rule: 'label.requireAtLeastOne',
          passed: false,
          message: `At least one of the following labels is required: ${group.map((l) => `"${l}"`).join(', ')}.`,
        });
      } else {
        results.push({
          rule: 'label.requireAtLeastOne',
          passed: true,
          message: `At least one label from group [${group.join(', ')}] is present.`,
        });
      }
    }
  }

  return results;
}
