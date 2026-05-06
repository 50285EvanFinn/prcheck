import { Config } from './schema';

export function getDefaultConfig(): Config {
  return {
    template: {
      requiredSections: [],
      minLength: 0,
      forbiddenPhrases: [],
    },
    reviewers: [],
    labels: {
      onSuccess: [],
      onFailure: [],
    },
    failOnViolation: true,
    postComment: true,
  };
}

export function mergeWithDefaults(partial: Partial<Config>): Config {
  const defaults = getDefaultConfig();
  return {
    ...defaults,
    ...partial,
    template: {
      ...defaults.template,
      ...(partial.template ?? {}),
    },
    reviewers: partial.reviewers ?? defaults.reviewers,
    labels: {
      ...defaults.labels,
      ...(partial.labels ?? {}),
    },
  };
}
