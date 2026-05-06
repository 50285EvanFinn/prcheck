import { ValidationResult } from '../rules/validator';
import { applyValidationLabels } from './label-manager';
import { LabelConfig } from '../config/schema';

export function setOutput(name: string, value: string): void {
  const core = tryRequireCore();
  if (core) {
    core.setOutput(name, value);
  } else {
    process.stdout.write(`::set-output name=${name}::${value}\n`);
  }
}

export function setFailed(message: string): void {
  const core = tryRequireCore();
  if (core) {
    core.setFailed(message);
  } else {
    process.stderr.write(`::error::${message}\n`);
    process.exitCode = 1;
  }
}

export function logInfo(message: string): void {
  const core = tryRequireCore();
  if (core) {
    core.info(message);
  } else {
    process.stdout.write(`${message}\n`);
  }
}

export function emitValidationOutputs(result: ValidationResult): void {
  setOutput('passed', String(result.passed));
  setOutput('violations', JSON.stringify(result.violations));
  setOutput('violation_count', String(result.violations.length));
}

export async function applyLabelsIfConfigured(
  result: ValidationResult,
  labelConfig: LabelConfig | undefined,
  owner: string,
  repo: string,
  prNumber: number,
  token: string
): Promise<void> {
  if (!labelConfig) return;
  if (!token) {
    logInfo('No GITHUB_TOKEN provided; skipping label management.');
    return;
  }
  await applyValidationLabels(result.passed, labelConfig, {
    owner,
    repo,
    prNumber,
    token,
  });
}

function tryRequireCore(): any {
  try {
    return require('@actions/core');
  } catch {
    return null;
  }
}
