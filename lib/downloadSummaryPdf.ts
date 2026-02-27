import { jsPDF } from "jspdf";
import type { SummaryPoint } from "./studyTypes";

const FONT_SIZE_TITLE = 16;
const FONT_SIZE_SUBTITLE = 12;
const FONT_SIZE_BODY = 10;
const MARGIN = 20;
const LINE_HEIGHT = 6;
const MAX_WIDTH = 170;

export function downloadSummaryPdf(
  courseCode: string,
  courseTitle: string,
  points: SummaryPoint[],
  filename?: string
): void {
  const doc = new jsPDF();
  let y = MARGIN;

  doc.setFontSize(FONT_SIZE_SUBTITLE);
  doc.setTextColor(100, 116, 139);
  doc.text(courseCode, MARGIN, y);
  y += LINE_HEIGHT + 2;

  doc.setFontSize(FONT_SIZE_TITLE);
  doc.setTextColor(30, 41, 59);
  const titleLines = doc.splitTextToSize(courseTitle, MAX_WIDTH);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * LINE_HEIGHT + 8;

  doc.setFontSize(FONT_SIZE_BODY);
  doc.setTextColor(51, 65, 85);

  points.forEach((point) => {
    const bullet = `${point.index}. `;
    const text = bullet + point.text;
    const lines = doc.splitTextToSize(text, MAX_WIDTH - doc.getTextWidth(bullet));
    if (y + lines.length * LINE_HEIGHT > 270) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(lines, MARGIN, y);
    y += lines.length * LINE_HEIGHT + 2;
  });

  const name = filename ?? `summary-${courseCode.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
  doc.save(name);
}
