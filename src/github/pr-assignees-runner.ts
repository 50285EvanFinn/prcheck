import { ValidationResult } from '../rules/validator';
import { assignReviewers, AssigneeResult } from './pr-assignees';

export interface AssigneeRunnerOptions {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
  dryRun?: boolean;
}

export async function runReviewerAssignment(
  result: ValidationResult,
  options: AssigneeRunnerOptions
): Promise<AssigneeResult> {
  const { owner, repo, prNumber, token, dryRun = false } = options;

  const requiredReviewers = result.reviewerRules
    .filter((r) => r.passed && r.suggestedReviewers && r.suggestedReviewers.length > 0)
    .flatMap((r) => r.suggestedReviewers as string[]);

  const unique = [...new Set(requiredReviewers)];

  if (unique.length === 0) {
    return { added: [], skipped: [], errors: [] };
  }

  if (dryRun) {
    console.log(`[dry-run] Would assign reviewers: ${unique.join(', ')}`);
    return { added: [], skipped: unique, errors: [] };
  }

  const assignResult = await assignReviewers(owner, repo, prNumber, unique, token);

  if (assignResult.added.length > 0) {
    console.log(`Assigned reviewers: ${assignResult.added.join(', ')}`);
  }
  if (assignResult.skipped.length > 0) {
    console.log(`Skipped reviewers (already assigned or not collaborators): ${assignResult.skipped.join(', ')}`);
  }
  if (assignResult.errors.length > 0) {
    console.error(`Reviewer assignment errors: ${assignResult.errors.join('; ')}`);
  }

  return assignResult;
}
