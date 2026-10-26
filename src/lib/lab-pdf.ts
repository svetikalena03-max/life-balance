import { jsPDF } from "jspdf";
import { labReportText } from "./lab-export.ts";
import { LAB_PDF_FONT } from "./lab-pdf-font.ts";

// Entirely local: no report content is sent to a server to create this file.
export function createLabPdf(result: Parameters<typeof labReportText>[0]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("LabSans.ttf", LAB_PDF_FONT);
  doc.addFont("LabSans.ttf", "LabSans", "normal");
  doc.setFont("LabSans");
  doc.setProperties({ title: "Баланс жизни - разбор анализов", creator: "Баланс жизни" });
  const margin = 18;
  const width = 174;
  let y = 22;
  const paragraphs = labReportText(result).split("\n\n");
  paragraphs.forEach((paragraph, index) => {
    const heading = index === 0 || paragraph === "Что обсудить с врачом";
    doc.setFontSize(index === 0 ? 17 : heading ? 13 : 10.5);
    doc.setTextColor(...((heading ? [22, 104, 102] : [30, 45, 50]) as [number, number, number]));
    const lines: string[] = doc.splitTextToSize(paragraph, width);
    const lineHeight = index === 0 ? 8 : 5.6;
    for (const line of lines) {
      if (y + lineHeight > 276) {
        doc.addPage();
        y = 22;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += heading ? 4 : 3;
  });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(90, 105, 110);
    doc.text(`Баланс жизни | ${page} / ${pages}`, margin, 287);
  }
  return doc;
}
