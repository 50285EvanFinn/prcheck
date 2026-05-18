import { loadConfigFromDir } from '../config/loader';
import { getContextFromEnv, prToCheckInput } from './context';
import { evaluateTitleRules } from '../rules/title';
import { formatValidationResult } from '../rules/validator';
import { emitValidationOutputs } from './action-output';

export async function runTitleChecks(workdir: string = process.cwd()): Promise<void> {
  const config = loadConfigFromDir(workdir);
  const titleRules = (config as any).titleRules;

  if (!titleRules || Object.keys(titleRules).length === 0) {
    console.log('[prcheck] No title rules configured, skipping.');
    return;
  }

  let input;
  try {
    const ctx = getContextFromEnv();
    input = prToCheckInput(ctx);
  } catch (err) {
    console.error('[prcheck] Failed to resolve PR context:', (err as Error).message);
    process.exitCode = 1;
    return;
  }

  const results = evaluateTitleRules(input, titleRules);
  const failed = results.filter((r) => !r.passed);

  const summary = formatValidationResult({
    passed: failed.length === 0,
    results,
    summary:
      failed.length === 0
        ? 'All title checks passed.'
        : `${failed.length} title rule(s) failed.`,
  });

  console.log(summary);
  emitValidationOutputs({ passed: failed.length === 0, results, summary: '' });

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}
