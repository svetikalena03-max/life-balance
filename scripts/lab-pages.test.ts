import { test } from "node:test";
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { splitLabPdf, appendLabRows } from "../src/lib/lab-pages.ts";

test("two-page PDF is split into ordered single-page PDFs without losing page sizes", async () => {
  const input = await PDFDocument.create();
  input.addPage([400, 600]);
  input.addPage([500, 700]);
  const pages = await splitLabPdf(await input.save());
  assert.equal(pages.length, 2);
  for (let index = 0; index < pages.length; index++) {
    const page = await PDFDocument.load(pages[index]);
    assert.equal(page.getPageCount(), 1);
    assert.equal(page.getPage(0).getWidth(), 400 + index * 100);
    assert.equal(page.getPage(0).getHeight(), 600 + index * 100);
  }
});

test("files above limits fail before processing any pages", async () => {
  const input = await PDFDocument.create();
  for (let index = 0; index < 11; index++) input.addPage();
  const bytes = await input.save();
  await assert.rejects(() => splitLabPdf(bytes), /10 страниц/);
  await assert.rejects(() => splitLabPdf(new Uint8Array(10 * 1024 * 1024 + 1)), /10 МБ/);
  await assert.rejects(() => splitLabPdf(new Uint8Array([1, 2, 3])));
});

test("adding another page retains earlier rows including repeated names, and never truncates overflow", () => {
  const first = [{ name: "Пример", value: "1" }];
  assert.deepEqual(appendLabRows(first, [{ name: "Пример", value: "2" }]), [
    { name: "Пример", value: "1" },
    { name: "Пример", value: "2" },
  ]);
  assert.equal(first.length, 1);
  assert.throws(() => appendLabRows(Array(200).fill(1), [2]), /200/);
});
