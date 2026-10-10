import { z } from "zod";

export const recipeImportInputSchema = z
  .object({
    text: z.string().trim().min(20).max(8000),
  })
  .strict();

const line = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine((value) => !/[\r\n]/.test(value));
export const recipeDraftSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000),
    ingredients: z.array(line).min(1).max(30),
    steps: z.array(line).min(1).max(20),
  })
  .strict();
export type RecipeDraft = z.infer<typeof recipeDraftSchema>;

export function parseRecipeDraft(content: string): RecipeDraft {
  const json = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return recipeDraftSchema.parse(JSON.parse(json));
}
