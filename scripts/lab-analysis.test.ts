import assert from "node:assert/strict";
import { test } from "node:test";
import {
  compareLabRow,
  labFailureMessage,
  labInputSchema,
  parseLabExplanation,
} from "../src/lib/lab-analysis.ts";
import { recognizeLabFile } from "../src/integrations/yandexgpt/lab-ocr.server.ts";
import {
  prepareVoice,
  prepareWorkoutClips,
} from "../src/integrations/yandexgpt/recovery-voice.server.ts";

const row = (value: string, reference: string, unit = "г/л") => ({
  name: "Пример",
  value,
  reference,
  unit,
});

test("lab failures distinguish access, limits and invalid responses without exposing private data", () => {
  assert.match(labFailureMessage(new Error("YandexGPT request failed with status 403")), /доступ/);
  assert.match(labFailureMessage(new Error("YandexGPT request failed with status 429")), /лимит/);
  assert.match(labFailureMessage(new SyntaxError("private lab input")), /прочитать/);
  assert.doesNotMatch(labFailureMessage(new Error("private lab input")), /private lab input/);
});

test("workout voice accepts only known programs and reuses fixed Yandex clips", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.YANDEX_SPEECHKIT_API_KEY;
  process.env.YANDEX_SPEECHKIT_API_KEY = "test-placeholder";
  let requests = 0;
  try {
    globalThis.fetch = async (_url, init) => {
      requests++;
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get("voice"), "marina");
      assert.equal(body.get("format"), "mp3");
      return new Response(new Uint8Array([1, 2, 3]));
    };
    await assert.rejects(() => prepareWorkoutClips("arbitrary-user-text"));
    assert.equal(requests, 0);
    const first = await prepareWorkoutClips("gentle-morning");
    assert.equal(first.length, 5);
    const count = requests;
    assert.deepEqual(await prepareWorkoutClips("gentle-morning"), first);
    assert.equal(requests, count);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.YANDEX_SPEECHKIT_API_KEY;
    else process.env.YANDEX_SPEECHKIT_API_KEY = previousKey;
  }
});

test("lab comparison uses only the supplied range, including decimal commas and exact boundaries", () => {
  for (const separator of ["-", "–", "—"]) {
    assert.equal(compareLabRow(row("120", `120${separator}150`)), "within");
    assert.equal(compareLabRow(row("150", `120${separator}150`)), "within");
    assert.equal(compareLabRow(row("119,9", `120${separator}150`)), "low");
    assert.equal(compareLabRow(row("150,1", `120${separator}150`)), "high");
  }
  assert.equal(compareLabRow(row("3,5", "3,2–5,5", "ммоль/л")), "within");
  assert.equal(compareLabRow(row("5", "<5")), "high");
  assert.equal(compareLabRow(row("5", "≤5")), "within");
  assert.equal(compareLabRow(row("5", ">5")), "low");
  assert.equal(compareLabRow(row("5", ">=5")), "within");
});

test("missing, ambiguous, qualitative and differently labelled ranges never get a normal flag", () => {
  for (const [value, reference, unit] of [
    ["125", "", "г/л"],
    ["125", "120–150", ""],
    ["125", "150–120", "г/л"],
    ["<5", "0–10", "мг/л"],
    ["отрицательно", "отрицательно", "ед"],
    ["125", "жен.120–150 муж.130–170", "г/л"],
    ["5", "3–6 мг/дл", "ммоль/л"],
    ["1e2", "0–150", "г/л"],
    ["5*", "3–6", "ммоль/л"],
  ])
    assert.equal(compareLabRow(row(value, reference, unit)), "unknown");
});

test("analysis rejects missing, duplicate or unrelated explanations and oversized input", () => {
  const json = (indexes: number[]) =>
    JSON.stringify({
      indicators: indexes.map((index) => ({ index, explanation: "Объяснение" })),
      questions: [],
      limitations: "Нужен контекст",
    });
  assert.equal(parseLabExplanation(json([1, 0]), 2).indicators.length, 2);
  for (const indexes of [[0], [0, 0], [0, 2]])
    assert.throws(() => parseLabExplanation(json(indexes), 2));
  assert.equal(
    labInputSchema.safeParse({ rows: Array(41).fill(row("1", "0–2")), context: "" }).success,
    false,
  );
});

test("OCR validates file signatures, disables provider logging and handles missing permissions", async () => {
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.YANDEX_VISION_API_KEY;
  const oldFolder = process.env.YANDEX_CLOUD_FOLDER_ID;
  process.env.YANDEX_VISION_API_KEY = "test-placeholder";
  process.env.YANDEX_CLOUD_FOLDER_ID = "test-folder";
  const data = {
    mimeType: "application/pdf",
    content: Buffer.from("%PDF-1.4\nfictional test").toString("base64"),
  };
  try {
    await assert.rejects(() =>
      recognizeLabFile({ ...data, content: Buffer.from("not a pdf").toString("base64") }),
    );
    globalThis.fetch = async (_url, init) => {
      assert.equal(new Headers(init?.headers).get("x-data-logging-enabled"), "false");
      return Response.json({ result: { textAnnotation: { fullText: "Пример 125 г/л 120–150" } } });
    };
    assert.match(await recognizeLabFile(data), /125/);
    globalThis.fetch = async () => new Response("", { status: 403 });
    await assert.rejects(() => recognizeLabFile(data), /вручную/);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.YANDEX_VISION_API_KEY;
    else process.env.YANDEX_VISION_API_KEY = oldKey;
    if (oldFolder === undefined) delete process.env.YANDEX_CLOUD_FOLDER_ID;
    else process.env.YANDEX_CLOUD_FOLDER_ID = oldFolder;
  }
});

test("voice accepts only fixed scripts, uses MP3 and coalesces concurrent synthesis requests", async () => {
  const originalFetch = globalThis.fetch;
  const oldKey = process.env.YANDEX_SPEECHKIT_API_KEY;
  process.env.YANDEX_SPEECHKIT_API_KEY = "test-placeholder";
  let requests = 0;
  try {
    globalThis.fetch = async (_url, init) => {
      requests += 1;
      const body = new URLSearchParams(String(init?.body));
      assert.equal(body.get("format"), "mp3");
      assert.equal(body.get("voice"), "marina");
      assert.ok(body.get("text"));
      return new Response(new Uint8Array([73, 68, 51]));
    };
    await assert.rejects(() => prepareVoice("arbitrary text"));
    await assert.rejects(() => prepareVoice("rain"));
    const [a, b] = await Promise.all([prepareVoice("meditation"), prepareVoice("meditation")]);
    assert.equal(requests, 7);
    assert.equal(a.length, 7);
    assert.deepEqual(a, b);
    assert.ok(a.every((s) => s.startsWith("data:audio/mpeg;base64,")));
  } finally {
    globalThis.fetch = originalFetch;
    if (oldKey === undefined) delete process.env.YANDEX_SPEECHKIT_API_KEY;
    else process.env.YANDEX_SPEECHKIT_API_KEY = oldKey;
  }
});
