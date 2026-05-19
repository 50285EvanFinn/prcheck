import { PRCheckInput, RuleResult } from '../config/schema';

export interface DraftRuleConfig {
  blockIfDraft?: boolean;
  allowMergeWhenDraft?: boolean;
  draftLabel?: string;
}

export function evaluateDraftRules(
  input: PRCheckInput,
  config: DraftRuleConfig
): RuleResult[] {
  const results: RuleResult[] = [];

  if (!config || Object.keys(config).length === 0) {
    return results;
  }

  const isDraft = input.isDraft ?? false;

  if (config.blockIfDraft && isDraft) {
    results.push({
      rule: 'draft/block-if-draft',
      status: 'failure',
      message: 'Pull request is in draft state and cannot be merged until marked ready for review.',
    });
  }

  if (config.draftLabel) {
    const labels: string[] = input.labels ?? [];
    const hasLabel = labels.includes(config.draftLabel);

    if (isDraft && !hasLabel) {
      results.push({
        rule: 'draft/label-sync',
        status: 'warning',
        message: `Draft PR is missing the expected label "${config.draftLabel}".`,
      });
    }

    if (!isDraft && hasLabel) {
      results.push({
        rule: 'draft/label-sync',
        status: 'warning',
        message: `PR is marked ready but still has the draft label "${config.draftLabel}".`,
      });
    }
  }

  if (!isDraft) {
    results.push({
      rule: 'draft/ready-for-review',
      status: 'success',
      message: 'Pull request is marked as ready for review.',
    });
  }

  return results;
}
