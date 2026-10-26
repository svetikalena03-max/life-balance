import { z } from "zod";

export const examinationInputSchema = z.object({
  text: z.string().trim().min(20).max(32000),
  context: z.string().trim().max(1500),
  consent: z.literal(true),
  reviewed: z.literal(true),
});
export const examinationResultSchema = z.object({
  summary: z.string().trim().min(1).max(4000),
  terms: z
    .array(
      z.object({
        term: z.string().trim().min(1).max(200),
        explanation: z.string().trim().min(1).max(1200),
      }),
    )
    .max(20),
  questions: z.array(z.string().trim().min(1).max(500)).max(8),
  limitations: z.string().trim().min(1).max(2000),
});
export type ExaminationResult = z.infer<typeof examinationResultSchema>;
export function parseExamination(text: string): ExaminationResult {
  return examinationResultSchema.parse(
    JSON.parse(text.trim().replace(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i, "$1")),
  );
}
export function examinationReportText(result: ExaminationResult): string {
  return [
    "Баланс жизни - объяснение заключения обследования",
    "Справочное объяснение письменного заключения врача. Не является диагнозом, оценкой снимков или назначением лечения.",
    "Простыми словами",
    result.summary,
    "Термины из заключения",
    ...result.terms.map((item) => `${item.term}\n${item.explanation}`),
    "Что обсудить с врачом",
    ...result.questions.map((item) => `• ${item}`),
    "Ограничения объяснения",
    result.limitations,
    "Следуйте рекомендациям лечащего врача. При тяжёлом текущем состоянии обращайтесь за экстренной помощью.",
  ].join("\n\n");
}
