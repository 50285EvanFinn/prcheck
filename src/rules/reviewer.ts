import { PrcheckConfig } from '../config/schema';

export interface ReviewerRule {
  pattern: string;
  reviewers: string[];
  minReviewers?: number;
}

export interface ReviewerResult {
  satisfied: boolean;
  required: string[];
  missing: string[];
  assigned: string[];
  errors: string[];
}

export function evaluateReviewerRules(
  config: PrcheckConfig,
  changedFiles: string[],
  assignedReviewers: string[]
): ReviewerResult {
  const result: ReviewerResult = {
    satisfied: true,
    required: [],
    missing: [],
    assigned: assignedReviewers,
    errors: [],
  };

  const rules: ReviewerRule[] = config.reviewerRules ?? [];

  if (rules.length === 0) {
    return result;
  }

  for (const rule of rules) {
    const regex = new RegExp(rule.pattern);
    const matches = changedFiles.some((file) => regex.test(file));

    if (!matches) continue;

    const minRequired = rule.minReviewers ?? 1;
    const matchingAssigned = rule.reviewers.filter((r) =>
      assignedReviewers.includes(r)
    );

    result.required.push(...rule.reviewers.filter((r) => !result.required.includes(r)));

    if (matchingAssigned.length < minRequired) {
      const missing = rule.reviewers.filter((r) => !assignedReviewers.includes(r));
      result.missing.push(...missing.filter((r) => !result.missing.includes(r)));
      result.errors.push(
        `Rule '${rule.pattern}' requires at least ${minRequired} of [${rule.reviewers.join(', ')}], but only ${matchingAssigned.length} assigned.`
      );
      result.satisfied = false;
    }
  }

  return result;
}
