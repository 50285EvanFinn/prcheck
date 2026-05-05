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
      const regex = new RegExp(field.pattern, 'im');
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
