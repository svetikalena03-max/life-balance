import assert from "node:assert/strict";
import { test } from "node:test";
import { labReportText } from "../src/lib/lab-export.ts";

test("download keeps literal results, units, references and matches explanations by index", () => {
  const report = labReportText({
    rows: [
      {
        index: 0,
        name: "Пример A",
        value: "<0,5",
        unit: "мг/л",
        reference: "<1",
        status: "unknown",
      },
      { index: 1, name: "Пример B", value: "125", unit: "г/л", reference: "", status: "unknown" },
    ],
    indicators: [
      { index: 1, explanation: "Объяснение B" },
      { index: 0, explanation: "Объяснение A" },
    ],
    questions: ["Вопрос врачу"],
    limitations: "Недостаточно контекста",
  });
  assert.match(report, /Пример A: <0,5 мг\/л\nНорма на бланке: <1\n[^\n]+\nОбъяснение A/);
  assert.match(report, /Пример B: 125 г\/л\nНорма на бланке: не указана\n[^\n]+\nОбъяснение B/);
  assert.match(report, /Вопрос врачу/);
  assert.match(report, /Недостаточно контекста/);
  assert.match(report, /Не является диагнозом/);
});
