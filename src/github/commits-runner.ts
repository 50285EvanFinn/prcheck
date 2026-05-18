import { fetchPRCommits } from './pr-commits';
import { evaluateCommitRules, CommitRulesConfig } from '../rules/commits';
import { formatValidationResult } from '../rules/validator';
import { CheckInput } from '../config/schema';

export interface CommitsRunnerOptions {
  owner: string;
  repo: string;
  prNumber: number;
  token: string;
  rules: CommitRulesConfig;
}

export async function runCommitsCheck(
  input: CheckInput,
  options: CommitsRunnerOptions
): Promise<{ passed: boolean; summary: string }> {
  const { owner, repo, prNumber, token, rules } = options;

  let commits: string[];
  try {
    commits = await fetchPRCommits(owner, repo, prNumber, token);
  } catch (err) {
    return {
      passed: false,
      summary: `Failed to fetch commits: ${(err as Error).message}`,
    };
  }

  const enriched: CheckInput = { ...input, commits };
  const results = evaluateCommitRules(enriched, rules);

  const failures = results.filter((r) => !r.passed);
  if (failures.length === 0) {
    return { passed: true, summary: `All commit checks passed (${commits.length} commit(s)).` };
  }

  const lines = failures.map((r) => formatValidationResult(r)).join('\n');
  return {
    passed: false,
    summary: `Commit checks failed:\n${lines}`,
  };
}
