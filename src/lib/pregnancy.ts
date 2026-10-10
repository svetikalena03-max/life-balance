export type PregnancySettings = { user_id: string; due_date: string; updated_at: string };
export type PregnancyRecord = {
  id: string;
  user_id: string;
  record_date: string;
  kind: string;
  weight_kg: number | null;
  systolic: number | null;
  diastolic: number | null;
  note: string;
  recommendations: string;
  created_at: string;
  updated_at: string;
};

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function pregnancyTerm(dueDate: string, today: string) {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(due) || !Number.isFinite(now)) return null;
  const days = 280 - Math.round((due - now) / 86400000);
  if (days < 0 || days > 294) return null;
  return { weeks: Math.floor(days / 7), days: days % 7 };
}

export function optionalNumber(value: string, max: number, integer = false) {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error("number");
  const number = Number(normalized);
  if (number <= 0 || number > max || (integer && !Number.isInteger(number)))
    throw new Error("number");
  return number;
}

export function pregnancyCsv(records: PregnancyRecord[]) {
  const cell = (value: string | number | null) => {
    let text = value === null ? "" : String(value);
    if (/^\s*[=+\-@]/.test(text) || /^[\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const rows = [
    [
      "Дата",
      "Запись",
      "Вес, кг",
      "Верхнее давление",
      "Нижнее давление",
      "Самочувствие / визит",
      "Рекомендации врача",
    ],
    ...records.map((r) => [
      r.record_date,
      r.kind === "visit" ? "Визит к врачу" : "Самочувствие",
      r.weight_kg,
      r.systolic,
      r.diastolic,
      r.note,
      r.recommendations,
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;
}
