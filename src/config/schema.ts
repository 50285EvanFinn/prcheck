import { z } from 'zod';

export const LabelConfigSchema = z.object({
  onSuccess: z.array(z.string()).optional(),
  onFailure: z.array(z.string()).optional(),
});

export const ReviewerRuleSchema = z.object({
  pattern: z.string(),
  reviewers: z.array(z.string()).min(1),
  minCount: z.number().int().positive().optional().default(1),
});

export const TemplateRuleSchema = z.object({
  requiredSections: z.array(z.string()).optional(),
  minLength: z.number().int().nonnegative().optional(),
  forbiddenPhrases: z.array(z.string()).optional(),
});

export const ConfigSchema = z.object({
  template: TemplateRuleSchema.optional(),
  reviewers: z.array(ReviewerRuleSchema).optional(),
  labels: LabelConfigSchema.optional(),
  failOnViolation: z.boolean().optional().default(true),
  postComment: z.boolean().optional().default(true),
});

export type Config = z.infer<typeof ConfigSchema>;
export type ReviewerRule = z.infer<typeof ReviewerRuleSchema>;
export type TemplateRule = z.infer<typeof TemplateRuleSchema>;
export type LabelConfig = z.infer<typeof LabelConfigSchema>;
