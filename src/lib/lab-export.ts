import { LAB_STATUS_LABELS } from "./lab-analysis.ts";
import type { LabRow, LabStatus } from "./lab-analysis.ts";

type ExportResult = {
  rows: Array<LabRow & { index: number; status: LabStatus }>;
  indicators: Array<{ index: number; explanation: string }>;
  questions: string[];
  limitations: string;
};

export function labReportText(result: ExportResult): string {
  return [
    "Баланс жизни — разбор анализов",
    "Справочная информация. Не является диагнозом или назначением лечения.",
    ...result.rows.map((row) =>
      [
        `${row.name}: ${row.value} ${row.unit}`.trim(),
        `Норма на бланке: ${row.reference || "не указана"}`,
        LAB_STATUS_LABELS[row.status],
        result.indicators.find((item) => item.index === row.index)?.explanation ?? "",
      ].join("\n"),
    ),
    "Что обсудить с врачом",
    ...result.questions.map((question) => `• ${question}`),
    result.limitations,
    "Нормальный интервал не исключает заболевание, а отклонение само по себе не является диагнозом. При критической отметке лаборатории оперативно свяжитесь с врачом. При тяжёлом текущем состоянии обращайтесь за экстренной помощью.",
  ].join("\n\n");
}
