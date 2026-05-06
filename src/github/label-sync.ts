import { ValidationResult } from '../rules/validator';
import {
  fetchPRLabels,
  addLabelsToPR,
  removeLabelFromPR,
  extractLabelNames,
} from './pr-labels';

export interface LabelSyncOptions {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
  passLabel?: string;
  failLabel?: string;
}

const DEFAULT_PASS_LABEL = 'pr-check: passed';
const DEFAULT_FAIL_LABEL = 'pr-check: failed';

export async function syncValidationLabels(
  result: ValidationResult,
  opts: LabelSyncOptions
): Promise<void> {
  const { owner, repo, prNumber, token } = opts;
  const passLabel = opts.passLabel ?? DEFAULT_PASS_LABEL;
  const failLabel = opts.failLabel ?? DEFAULT_FAIL_LABEL;

  const existing = await fetchPRLabels(owner, repo, prNumber, token);
  const currentNames = extractLabelNames(existing);

  const isPassing = result.passed;
  const labelToAdd = isPassing ? passLabel : failLabel;
  const labelToRemove = isPassing ? failLabel : passLabel;

  if (!currentNames.includes(labelToAdd)) {
    await addLabelsToPR(owner, repo, prNumber, [labelToAdd], token);
  }

  if (currentNames.includes(labelToRemove)) {
    await removeLabelFromPR(owner, repo, prNumber, labelToRemove, token);
  }
}
