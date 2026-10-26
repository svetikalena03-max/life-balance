export const MAX_LAB_PAGES = 10;
export const MAX_LAB_ROWS = 200;

export async function splitLabPdf(bytes: Uint8Array): Promise<Uint8Array[]> {
  if (bytes.length > 10 * 1024 * 1024) throw new Error("Для PDF допустимо до 10 МБ.");
  const { PDFDocument } = await import("pdf-lib");
  const source = await PDFDocument.load(bytes);
  const count = source.getPageCount();
  if (!count || count > MAX_LAB_PAGES) throw new Error("Загрузите PDF от 1 до 10 страниц.");
  const pages: Uint8Array[] = [];
  for (let index = 0; index < count; index++) {
    const pageDoc = await PDFDocument.create();
    const [page] = await pageDoc.copyPages(source, [index]);
    pageDoc.addPage(page);
    const data = await pageDoc.save();
    if (data.length > 2 * 1024 * 1024)
      throw new Error(`Страница ${index + 1} больше 2 МБ. Загрузите её отдельным фото.`);
    pages.push(data);
  }
  return pages;
}

export function appendLabRows<T>(current: T[], added: T[]): T[] {
  if (current.length + added.length > MAX_LAB_ROWS)
    throw new Error(
      "В одном разборе допустимо до 200 показателей. Завершите этот разбор, затем начните следующий.",
    );
  return [...current, ...added];
}
