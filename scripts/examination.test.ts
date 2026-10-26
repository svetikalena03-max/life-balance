import { test } from "node:test";
import assert from "node:assert/strict";
import {
  examinationInputSchema,
  parseExamination,
  examinationReportText,
} from "../src/lib/examination.ts";

const example = {
  summary:
    "В заключении написано: очаговых изменений не выявлено. Это не оценка снимков приложением.",
  terms: [
    {
      term: "не исключается",
      explanation: "Врач описывает возможность, а не подтверждённый факт.",
    },
  ],
  questions: ["Как заключение связано с моими жалобами?"],
  limitations: "По одному тексту нельзя подтвердить диагноз.",
};

test("conclusion explanation requires consent, verified text and enforces input limits", () => {
  const input = {
    text: "Вымышленное письменное заключение обследования",
    context: "",
    consent: true,
    reviewed: true,
  };
  assert.equal(examinationInputSchema.safeParse(input).success, true);
  for (const patch of [
    { consent: false },
    { reviewed: false },
    { text: "" },
    { text: "x".repeat(32001) },
    { context: "x".repeat(1501) },
  ])
    assert.equal(examinationInputSchema.safeParse({ ...input, ...patch }).success, false);
});

test("explanation and PDF text preserve negations and uncertainty without adding measurements", () => {
  const result = parseExamination("```json\n" + JSON.stringify(example) + "\n```");
  const report = examinationReportText(result);
  assert.match(report, /изменений не выявлено/);
  assert.match(report, /не исключается/);
  assert.match(report, /не подтверждённый факт/);
  assert.match(report, /Не является диагнозом/);
  assert.match(report, /Как заключение связано/);
  assert.doesNotMatch(report, /Норма на бланке/);
});

test("malformed, incomplete and oversized model responses are rejected", () => {
  assert.throws(() => parseExamination('{"summary":'));
  assert.throws(() => parseExamination(JSON.stringify({ summary: "текст" })));
  assert.throws(() => parseExamination(JSON.stringify({ ...example, summary: "x".repeat(4001) })));
});
