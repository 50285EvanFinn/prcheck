import { PrCheckConfig } from './schema';

/**
 * Returns a minimal valid default configuration.
 * Useful for testing or when a repo opts in without a config file.
 */
export function getDefaultConfig(): PrCheckConfig {
  return {
    version: 1,
    template: undefined,
    reviewerRules: [],
    ignoreLabels: ['skip-prcheck'],
  };
}

/**
 * Merges a partial user config on top of the defaults.
 * Fields not specified by the user fall back to defaults.
 */
export function mergeWithDefaults(
  partial: Partial<PrCheckConfig>
): PrCheckConfig {
  const defaults = getDefaultConfig();
  return {
    ...defaults,
    ...partial,
    ignoreLabels: partial.ignoreLabels ?? defaults.ignoreLabels,
    reviewerRules: partial.reviewerRules ?? defaults.reviewerRules,
  };
}
