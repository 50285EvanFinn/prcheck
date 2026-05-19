import { loadConfigFromDir } from '../config/loader';
import { getContextFromEnv, prToCheckInput } from './context';
import { evaluateDraftRules } from '../rules/draft';
import { formatValidationResult } from '../rules/validator';
import { emitValidationOutputs } from './action-output';
import { postPRComment } from './pr-comment';

export async function runDraftCheck(workdir: string = process.cwd()): Promise<void> {
  const config = loadConfigFromDir(workdir);
  const draftConfig = (config as any).draft ?? {};

  if (!draftConfig || Object.keys(draftConfig).length === 0) {
    console.log('[prcheck] No draft rules configured, skipping.');
    return;
  }

  const ctx = getContextFromEnv();
  if (!ctx) {
    console.error('[prcheck] Could not resolve GitHub context from environment.');
    process.exit(1);
  }

  const input = prToCheckInput(ctx);
  const results = evaluateDraftRules(input, draftConfig);
  const formatted = formatValidationResult(results);

  emitValidationOutputs(formatted);

  const token = process.env.GITHUB_TOKEN;
  if (token && config.postComment) {
    await postPRComment(ctx, formatted, token);
  }

  if (!formatted.passed) {
    process.exit(1);
  }
}
