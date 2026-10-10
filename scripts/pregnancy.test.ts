import assert from "node:assert/strict";
import { test } from "node:test";
import {
  optionalNumber,
  pregnancyCsv,
  pregnancyTerm,
  type PregnancyRecord,
} from "../src/lib/pregnancy.ts";

test("gestational estimate uses calendar dates across leap day", () => {
  assert.deepEqual(pregnancyTerm("2028-03-01", "2028-02-29"), { weeks: 39, days: 6 });
  assert.deepEqual(pregnancyTerm("2026-10-10", "2026-10-10"), { weeks: 40, days: 0 });
  assert.equal(pregnancyTerm("invalid", "2026-10-10"), null);
  assert.equal(pregnancyTerm("2028-01-01", "2026-10-10"), null);
});

test("optional measurements accept decimal comma and reject partial or invalid values", () => {
  assert.equal(optionalNumber("82,5", 500), 82.5);
  assert.equal(optionalNumber("", 500), null);
  for (const value of ["0", "-1", "501", "12kg", "1e2"])
    assert.throws(() => optionalNumber(value, 500));
  assert.throws(() => optionalNumber("120.5", 400, true));
});

test("doctor export neutralizes spreadsheet formulas and retains quoted multiline notes", () => {
  const record: PregnancyRecord = {
    id: "a",
    user_id: "b",
    record_date: "2026-10-10",
    kind: "daily",
    weight_kg: null,
    systolic: null,
    diastolic: null,
    note: '=HYPERLINK("x")\nline',
    recommendations: " +cmd",
    created_at: "",
    updated_at: "",
  };
  const csv = pregnancyCsv([record]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(""x"")\nline"'));
  assert.ok(csv.includes('"\' +cmd"'));
});
