import PDFDocument from "pdfkit";
import type { Response } from "express";

export function sendPdfTable(
  res: Response,
  filename: string,
  title: string,
  columns: string[],
  rows: Record<string, unknown>[],
) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  doc.fontSize(16).text(title, { align: "left" });
  doc.moveDown();

  const colWidth = (doc.page.width - 80) / columns.length;
  const rowHeight = 20;

  function drawRow(values: string[], y: number, bold = false) {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
    values.forEach((val, i) => {
      doc.text(val, 40 + i * colWidth, y, { width: colWidth, ellipsis: true });
    });
  }

  let y = doc.y;
  drawRow(columns, y, true);
  y += rowHeight;
  doc
    .moveTo(40, y - 4)
    .lineTo(doc.page.width - 40, y - 4)
    .stroke();

  for (const row of rows) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = 40;
      drawRow(columns, y, true);
      y += rowHeight;
    }
    drawRow(
      columns.map((c) => String(row[c] ?? "")),
      y,
    );
    y += rowHeight;
  }

  doc.end();
}
