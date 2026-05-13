import { Milestone } from '../github/pr-milestone';

export interface MilestoneRule {
  require_milestone?: boolean;
  allowed_states?: Array<'open' | 'closed'>;
  due_within_days?: number;
}

export interface MilestoneCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

export function evaluateMilestoneRules(
  milestone: Milestone | null,
  rule: MilestoneRule
): MilestoneCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (rule.require_milestone && !milestone) {
    errors.push('PR must have a milestone assigned.');
    return { passed: false, warnings, errors };
  }

  if (!milestone) {
    return { passed: true, warnings, errors };
  }

  if (rule.allowed_states && !rule.allowed_states.includes(milestone.state)) {
    errors.push(
      `Milestone "${milestone.title}" is in state "${milestone.state}", expected one of: ${rule.allowed_states.join(', ')}.`
    );
  }

  if (rule.due_within_days !== undefined && milestone.due_on) {
    const dueDate = new Date(milestone.due_on);
    const now = new Date();
    const diffMs = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      warnings.push(`Milestone "${milestone.title}" is past due by ${Math.abs(diffDays)} day(s).`);
    } else if (diffDays <= rule.due_within_days) {
      warnings.push(
        `Milestone "${milestone.title}" is due in ${diffDays} day(s) (within threshold of ${rule.due_within_days}).`
      );
    }
  }

  return { passed: errors.length === 0, warnings, errors };
}
