import { PrcheckConfig } from '../config/schema';

export interface TemplateResult {
  satisfied: boolean;
  missingFields: string[];
  errors: string[];
}

export interface TemplateField {
  name: string;
  required: boolean;
  pattern?: string;
}

/**
 * Evaluates whether a PR body satisfies the required template fields
 * defined in the prcheck configuration.
 *
 * @param config - The prcheck configuration containing templateFields.
 * @param prBody - The PR description/body text to evaluate.
 * @returns A TemplateResult indicating satisfaction status and any missing fields or errors.
 */
export function evaluateTemplate(
  config: PrcheckConfig,
  prBody: string
): TemplateResult {
  const result: TemplateResult = {
    satisfied: true,
    missingFields: [],
    errors: [],
  };

  const fields: TemplateField[] = config.templateFields ?? [];

  if (fields.length === 0) {
    return result;
  }

  for (const field of fields) {
    if (!field.required) continue;

    if (field.pattern) {
      let regex: RegExp;
      try {
        regex = new RegExp(field.pattern, 'im');
      } catch {
        result.errors.push(
          `Invalid regex pattern for field '${field.name}': ${field.pattern}`
        );
        result.satisfied = false;
        continue;
      }
      if (!regex.test(prBody)) {
        result.missingFields.push(field.name);
        result.errors.push(
          `Required field '${field.name}' not found in PR description (pattern: ${field.pattern}).`
        );
        result.satisfied = false;
      }
    } else {
      const heading = new RegExp(`#{1,6}\\s*${field.name}`, 'im');
      if (!heading.test(prBody)) {
        result.missingFields.push(field.name);
        result.errors.push(
          `Required section '${field.name}' not found in PR description.`
        );
        result.satisfied = false;
      }
    }
  }

  return result;
}
