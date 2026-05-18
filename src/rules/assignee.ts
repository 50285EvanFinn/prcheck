import { CheckInput, RuleResult } from '../config/schema';

export interface AssigneeRulesConfig {
  requireAssignee?: boolean;
  minAssignees?: number;
  maxAssignees?: number;
  allowedAssignees?: string[];
  forbiddenAssignees?: string[];
}

export function evaluateAssigneeRules(
  input: CheckInput,
  config: AssigneeRulesConfig
): RuleResult[] {
  const results: RuleResult[] = [];
  const assignees: string[] = input.assignees ?? [];

  if (config.requireAssignee && assignees.length === 0) {
    results.push({
      rule: 'assignee.required',
      passed: false,
      message: 'PR must have at least one assignee.',
    });
  }

  if (config.minAssignees !== undefined && assignees.length < config.minAssignees) {
    results.push({
      rule: 'assignee.minAssignees',
      passed: false,
      message: `PR must have at least ${config.minAssignees} assignee(s), but has ${assignees.length}.`,
    });
  }

  if (config.maxAssignees !== undefined && assignees.length > config.maxAssignees) {
    results.push({
      rule: 'assignee.maxAssignees',
      passed: false,
      message: `PR must have at most ${config.maxAssignees} assignee(s), but has ${assignees.length}.`,
    });
  }

  if (config.allowedAssignees && config.allowedAssignees.length > 0) {
    const disallowed = assignees.filter((a) => !config.allowedAssignees!.includes(a));
    if (disallowed.length > 0) {
      results.push({
        rule: 'assignee.allowedAssignees',
        passed: false,
        message: `Assignee(s) not in allowed list: ${disallowed.join(', ')}.`,
      });
    }
  }

  if (config.forbiddenAssignees && config.forbiddenAssignees.length > 0) {
    const forbidden = assignees.filter((a) => config.forbiddenAssignees!.includes(a));
    if (forbidden.length > 0) {
      results.push({
        rule: 'assignee.forbiddenAssignees',
        passed: false,
        message: `Forbidden assignee(s) found: ${forbidden.join(', ')}.`,
      });
    }
  }

  if (results.length === 0 && (config.requireAssignee || config.minAssignees || config.maxAssignees)) {
    results.push({
      rule: 'assignee',
      passed: true,
      message: 'Assignee rules passed.',
    });
  }

  return results;
}
