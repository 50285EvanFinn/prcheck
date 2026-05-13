import { getPRMilestone } from './pr-milestone';
import { evaluateMilestoneRules, MilestoneRule } from '../rules/milestone';
import { logInfo } from './action-output';

export interface MilestoneRunnerOptions {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
  rule: MilestoneRule;
}

export interface MilestoneRunnerResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  milestoneTitle: string | null;
}

export async function runMilestoneCheck(
  options: MilestoneRunnerOptions
): Promise<MilestoneRunnerResult> {
  const { owner, repo, prNumber, token, rule } = options;

  const milestone = await getPRMilestone(owner, repo, prNumber, token);
  const milestoneTitle = milestone?.title ?? null;

  logInfo(
    milestone
      ? `PR #${prNumber} has milestone: "${milestoneTitle}"`
      : `PR #${prNumber} has no milestone assigned.`
  );

  const { passed, errors, warnings } = evaluateMilestoneRules(milestone, rule);

  for (const warning of warnings) {
    logInfo(`[milestone warning] ${warning}`);
  }
  for (const error of errors) {
    logInfo(`[milestone error] ${error}`);
  }

  return { passed, errors, warnings, milestoneTitle };
}
