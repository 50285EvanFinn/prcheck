import { loadConfigFromDir } from '../config/loader';
import { getContextFromEnv, prToCheckInput } from './context';
import { evaluateBranchRules } from '../rules/branch';
import { logInfo, setFailed } from './action-output';

export async function runBranchCheck(configDir: string = process.cwd()): Promise<void> {
  const config = loadConfigFromDir(configDir);

  if (!config.branchRules) {
    logInfo('No branchRules defined in config — skipping branch checks.');
    return;
  }

  const context = getContextFromEnv();
  if (!context) {
    setFailed('Could not determine PR context from environment.');
    return;
  }

  const input = prToCheckInput(context);
  const results = evaluateBranchRules(input, config.branchRules);

  const failures = results.filter((r) => !r.passed);

  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    logInfo(`${icon} [${result.rule}] ${result.message}`);
  }

  if (failures.length > 0) {
    const summary = failures.map((f) => `- ${f.message}`).join('\n');
    setFailed(`Branch check failed:\n${summary}`);
  } else {
    logInfo('All branch checks passed.');
  }
}
