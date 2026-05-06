import { loadConfigFromDir } from '../config/loader';
import { validatePR, formatValidationResult } from '../rules/validator';
import { parsePRReference } from '../github/pr-fetcher';
import { CheckInput } from '../config/schema';

export interface CLIOptions {
  configDir?: string;
  prRef?: string;
  owner?: string;
  repo?: string;
  prNumber?: number;
  title?: string;
  body?: string;
  reviewers?: string[];
  labels?: string[];
  verbose?: boolean;
}

export interface CLIResult {
  exitCode: number;
  output: string[];
}

export async function runCLI(options: CLIOptions): Promise<CLIResult> {
  const output: string[] = [];

  try {
    const config = await loadConfigFromDir(options.configDir ?? process.cwd());

    let input: CheckInput;

    if (options.prRef) {
      const parsed = parsePRReference(options.prRef);
      if (!parsed) {
        return { exitCode: 1, output: [`Invalid PR reference: ${options.prRef}`] };
      }
      input = {
        owner: parsed.owner,
        repo: parsed.repo,
        prNumber: parsed.prNumber,
        title: options.title ?? '',
        body: options.body ?? '',
        reviewers: options.reviewers ?? [],
        labels: options.labels ?? [],
      };
    } else if (options.owner && options.repo && options.prNumber !== undefined) {
      input = {
        owner: options.owner,
        repo: options.repo,
        prNumber: options.prNumber,
        title: options.title ?? '',
        body: options.body ?? '',
        reviewers: options.reviewers ?? [],
        labels: options.labels ?? [],
      };
    } else {
      return { exitCode: 1, output: ['Must provide either --pr-ref or --owner, --repo, and --pr-number'] };
    }

    const result = validatePR(input, config);
    const formatted = formatValidationResult(result);

    output.push(...formatted);

    if (options.verbose) {
      output.push(`\nChecked PR #${input.prNumber} in ${input.owner}/${input.repo}`);
    }

    return { exitCode: result.passed ? 0 : 1, output };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { exitCode: 1, output: [`Error: ${message}`] };
  }
}
