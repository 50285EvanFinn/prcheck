import { loadConfigFromDir } from '../config/loader';
import { getContextFromEnv, prToCheckInput } from './context';
import { fetchPRMetadata } from './pr-age';
import { evaluateAgeRules } from '../rules/age';
import { formatValidationResult } from '../rules/validator';
import { emitValidationOutputs } from './action-output';

export async function runAgeCheck(): Promise<void> {
  const config = loadConfigFromDir(process.cwd());
  const ageConfig = (config as any).age;

  if (!ageConfig) {
    console.log('[prcheck] No age rules configured, skipping.');
    return;
  }

  const ctx = getContextFromEnv();
  const token = process.env.GITHUB_TOKEN ?? '';

  const metadata = await fetchPRMetadata(
    ctx.owner,
    ctx.repo,
    ctx.prNumber,
    token
  );

  const input = prToCheckInput(ctx, metadata.createdAt, metadata.isDraft);
  const results = evaluateAgeRules(input, ageConfig);

  const summary = formatValidationResult(results);
  emitValidationOutputs(summary);

  if (!summary.passed) {
    console.error('[prcheck] Age check failed:\n' + summary.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('[prcheck] Age check passed.');
    if (summary.warnings && summary.warnings.length > 0) {
      console.warn('[prcheck] Warnings:\n' + summary.warnings.join('\n'));
    }
  }
}

if (require.main === module) {
  runAgeCheck().catch((err) => {
    console.error('[prcheck] Unexpected error:', err);
    process.exit(1);
  });
}
