import { evaluateReviewerRules } from './reviewer';
import { evaluateTemplate } from './template';
import { PrcheckConfig } from '../config/schema';

export interface PRData {
  title: string;
  body: string;
  author: string;
  reviewers: string[];
  labels: string[];
  baseBranch: string;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  rule: string;
  message: string;
}

export interface ValidationWarning {
  rule: string;
  message: string;
}

export function validatePR(
  pr: PRData,
  config: PrcheckConfig
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Evaluate template rules
  const templateResult = evaluateTemplate(pr.body, config);
  if (!templateResult.passed) {
    for (const msg of templateResult.messages) {
      errors.push({ rule: 'template', message: msg });
    }
  }

  // Evaluate reviewer rules
  const reviewerResult = evaluateReviewerRules(pr, config);
  if (!reviewerResult.passed) {
    for (const msg of reviewerResult.messages) {
      errors.push({ rule: 'reviewers', message: msg });
    }
  }

  for (const msg of reviewerResult.warnings ?? []) {
    warnings.push({ rule: 'reviewers', message: msg });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.passed) {
    lines.push('✅ PR validation passed.');
  } else {
    lines.push('❌ PR validation failed.');
  }

  for (const err of result.errors) {
    lines.push(`  [ERROR] (${err.rule}) ${err.message}`);
  }

  for (const warn of result.warnings) {
    lines.push(`  [WARN]  (${warn.rule}) ${warn.message}`);
  }

  return lines.join('\n');
}
