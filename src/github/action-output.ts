import * as fs from 'fs';
import * as path from 'path';
import { ValidationResult } from '../rules/validator';

/**
 * Writes key=value pairs to GITHUB_OUTPUT for use in subsequent workflow steps.
 */
export function setOutput(key: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${key}=${value}\n`, 'utf8');
  } else {
    // Fallback for older GitHub Actions runner or local testing
    process.stdout.write(`::set-output name=${key}::${value}\n`);
  }
}

export function setFailed(message: string): void {
  process.stdout.write(`::error::${message}\n`);
  process.exitCode = 1;
}

export function logInfo(message: string): void {
  process.stdout.write(`::notice::${message}\n`);
}

export function emitValidationOutputs(result: ValidationResult): void {
  setOutput('passed', String(result.passed));
  setOutput('error_count', String(result.errors.length));
  setOutput('warning_count', String(result.warnings.length));

  if (result.errors.length > 0) {
    setOutput('errors', result.errors.join('|'));
  } else {
    setOutput('errors', '');
  }

  if (!result.passed) {
    setFailed(
      `PR check failed with ${result.errors.length} error(s). Run prcheck locally for details.`
    );
  } else {
    logInfo('PR check passed.');
  }
}
