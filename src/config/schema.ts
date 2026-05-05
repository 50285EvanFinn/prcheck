import { z } from 'zod';

export const ReviewerRuleSchema = z.object({
  pattern: z.string().describe('Glob or regex pattern matching file paths'),
  reviewers: z.array(z.string()).min(1).describe('GitHub usernames to assign'),
  minApprovals: z.number().int().positive().default(1),
});

export const TemplateRuleSchema = z.object({
  requiredSections: z.array(z.string()).describe('Section headings that must appear in PR body'),
  minBodyLength: z.number().int().nonneg().default(0),
  forbiddenPhrases: z.array(z.string()).default([]),
});

export const PrCheckConfigSchema = z.object({
  version: z.literal(1),
  template: TemplateRuleSchema.optional(),
  reviewerRules: z.array(ReviewerRuleSchema).default([]),
  ignoreLabels: z.array(z.string()).default(['skip-prcheck']),
});

export type ReviewerRule = z.infer<typeof ReviewerRuleSchema>;
export type TemplateRule = z.infer<typeof TemplateRuleSchema>;
export type PrCheckConfig = z.infer<typeof PrCheckConfigSchema>;
