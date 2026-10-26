// Called only from the file-input handler; no browser APIs run during server rendering.
const MAX_BYTES = 2 * 1024 * 1024;

export async function prepareLabFile(
  file: File,
): Promise<{ content: string; mimeType: "image/jpeg" | "image/png" | "application/pdf" }> {
  let mimeType = file.type.toLowerCase();
  if (!mimeType) {
    if (/\.pdf$/i.test(file.name)) mimeType = "application/pdf";
    else if (/\.png$/i.test(file.name)) mimeType = "image/png";
    else if (/\.jpe?g$/i.test(file.name)) mimeType = "image/jpeg";
  }
  if (!["image/jpeg", "image/png", "application/pdf"].includes(mimeType))
    throw new Error(
      "Нужен JPEG, PNG или PDF. Для фото HEIC выберите в iPhone отправку в формате JPEG или загрузите скриншот бланка.",
    );
  let blob: Blob = file;
  if (mimeType !== "application/pdf" && file.size > MAX_BYTES) {
    if (file.size > 30 * 1024 * 1024)
      throw new Error("Фото слишком большое. Выберите одну страницу бланка.");
    const url = URL.createObjectURL(file);
    try {
      const photo = new Image();
      photo.src = url;
      await photo.decode();
      const scale = Math.min(1, 3200 / Math.max(photo.naturalWidth, photo.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Не удалось подготовить фото. Загрузите скриншот бланка.");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.92, 0.82, 0.72]) {
        blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (value) => (value ? resolve(value) : reject(new Error("Не удалось подготовить фото."))),
            "image/jpeg",
            quality,
          ),
        );
        if (blob.size <= MAX_BYTES) break;
      }
      mimeType = "image/jpeg";
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  if (blob.size > MAX_BYTES)
    throw new Error(
      "Файл больше 2 МБ. Для PDF сохраните одну страницу, для фото обрежьте лишние края.",
    );
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Не удалось открыть файл."));
    reader.readAsDataURL(blob);
  });
  return { content, mimeType: mimeType as "image/jpeg" | "image/png" | "application/pdf" };
}
