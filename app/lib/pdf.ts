import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Client, Practice, SessionRow } from "./types";
import { money, parseFee } from "./types";

const PAGE_W = 612; // US Letter
const PAGE_H = 792;
const MARGIN = 54;

const INK = rgb(0.09, 0.11, 0.15);
const MUTED = rgb(0.4, 0.45, 0.5);
const LINE = rgb(0.78, 0.82, 0.86);

type Ctx = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  bold: PDFFont;
};

function newPage(ctx: Ctx) {
  ctx.page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  ctx.y = PAGE_H - MARGIN;
}

function text(
  ctx: Ctx,
  str: string,
  opts: { x?: number; size?: number; bold?: boolean; color?: ReturnType<typeof rgb> } = {}
) {
  const size = opts.size ?? 10;
  ctx.page.drawText(str, {
    x: opts.x ?? MARGIN,
    y: ctx.y,
    size,
    font: opts.bold ? ctx.bold : ctx.font,
    color: opts.color ?? INK,
  });
}

function formatDateUS(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

const COLS = [
  { label: "Date", x: MARGIN },
  { label: "CPT", x: MARGIN + 90 },
  { label: "POS", x: MARGIN + 150 },
  { label: "Modifier", x: MARGIN + 200 },
  { label: "ICD-10", x: MARGIN + 270 },
  { label: "Fee", x: MARGIN + 360 },
];

function drawTableHeader(ctx: Ctx) {
  for (const c of COLS) text(ctx, c.label, { x: c.x, size: 9, bold: true, color: MUTED });
  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.75,
    color: LINE,
  });
  ctx.y -= 14;
}

export async function buildSuperbillPdf(
  practice: Practice,
  client: Client,
  sessions: SessionRow[],
  amountPaid: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const ctx: Ctx = { doc, page: null as unknown as PDFPage, y: 0, font, bold };
  newPage(ctx);

  // Header — practice block
  text(ctx, "SUPERBILL", { size: 18, bold: true });
  text(ctx, "Statement for insurance reimbursement", {
    x: PAGE_W - MARGIN - font.widthOfTextAtSize("Statement for insurance reimbursement", 9),
    size: 9,
    color: MUTED,
  });
  ctx.y -= 26;

  text(ctx, practice.providerName, { size: 12, bold: true });
  ctx.y -= 15;
  const headerLines = [
    `NPI: ${practice.npi}    EIN/Tax ID: ${practice.ein}    License: ${practice.licenseNumber}`,
    practice.address,
    `Phone: ${practice.phone}`,
  ];
  for (const line of headerLines) {
    text(ctx, line, { size: 10 });
    ctx.y -= 13;
  }

  ctx.y -= 6;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 1,
    color: LINE,
  });
  ctx.y -= 20;

  // Client block
  text(ctx, "Client", { size: 9, bold: true, color: MUTED });
  ctx.y -= 13;
  text(ctx, `${client.name}    DOB: ${formatDateUS(client.dob)}`, { size: 11 });
  ctx.y -= 24;

  // Sessions table
  text(ctx, "Sessions", { size: 9, bold: true, color: MUTED });
  ctx.y -= 14;
  drawTableHeader(ctx);

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  for (const s of sorted) {
    if (ctx.y < MARGIN + 90) {
      newPage(ctx);
      drawTableHeader(ctx);
    }
    const cells = [
      formatDateUS(s.date),
      s.cpt,
      s.pos,
      s.modifier || "—",
      s.icd10,
      money(parseFee(s.fee)),
    ];
    cells.forEach((cell, i) => text(ctx, cell, { x: COLS[i].x, size: 10 }));
    ctx.y -= 16;
  }

  ctx.y -= 4;
  ctx.page.drawLine({
    start: { x: MARGIN, y: ctx.y },
    end: { x: PAGE_W - MARGIN, y: ctx.y },
    thickness: 0.75,
    color: LINE,
  });
  ctx.y -= 18;

  // Totals
  const total = sorted.reduce((sum, s) => sum + parseFee(s.fee), 0);
  const paid = parseFee(amountPaid);
  const balance = total - paid;

  if (ctx.y < MARGIN + 60) newPage(ctx);
  text(ctx, `Total charges: ${money(total)}`, { size: 11, bold: true });
  ctx.y -= 16;
  text(ctx, `Amount paid: ${money(paid)}`, { size: 11 });
  ctx.y -= 16;
  text(ctx, `Balance: ${money(balance)}`, { size: 11, bold: true });
  ctx.y -= 28;

  text(
    ctx,
    "Generated with Superbatch — all data stays in the clinician's browser; nothing is sent to a server.",
    { size: 8, color: MUTED }
  );

  return doc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
