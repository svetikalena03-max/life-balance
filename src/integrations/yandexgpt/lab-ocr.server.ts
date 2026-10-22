import { z } from "zod";

export async function recognizeLabFile(input: { content: string; mimeType: string }) {
  const apiKey = process.env.YANDEX_VISION_API_KEY || process.env.YANDEX_CLOUD_API_KEY;
  const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;
  if (!apiKey || !folderId)
    throw new Error(
      "Распознавание файлов пока недоступно. Можно вставить текст или ввести показатели вручную.",
    );
  const bytes = Buffer.from(input.content, "base64");
  const valid =
    input.mimeType === "application/pdf"
      ? bytes.subarray(0, 5).toString() === "%PDF-"
      : input.mimeType === "image/png"
        ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!valid || bytes.length > 2 * 1024 * 1024)
    throw new Error("Нужен JPEG, PNG или одностраничный PDF до 2 МБ.");
  const response = await fetch("https://ai.api.cloud.yandex.net/ocr/v1/recognizeText", {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      Authorization: `Api-Key ${apiKey}`,
      "Content-Type": "application/json",
      "x-folder-id": folderId,
      "x-data-logging-enabled": "false",
    },
    body: JSON.stringify({ ...input, languageCodes: ["ru", "en"], model: "page" }),
  });
  if (response.status === 401 || response.status === 403)
    throw new Error(
      "Распознавание ещё не подключено. Пока вставьте текст или заполните показатели вручную.",
    );
  if (!response.ok)
    throw new Error(
      "Не удалось прочитать файл. Попробуйте чёткое фото одной страницы или вставьте текст.",
    );
  const parsed = z
    .object({ result: z.object({ textAnnotation: z.object({ fullText: z.string().max(16000) }) }) })
    .parse(await response.json());
  if (!parsed.result.textAnnotation.fullText.trim())
    throw new Error("Текст не найден. Попробуйте более чёткое фото.");
  return parsed.result.textAnnotation.fullText;
}
