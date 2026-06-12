import { describe, it, expect } from "vitest";
import { inflateSync } from "node:zlib";
import { SAMPLE_DATA } from "../../app/lib/sample";
import { buildSuperbillPdf } from "../../app/lib/pdf";

describe("PDF text content (spec checks 2-3)", () => {
  it("contains practice/client identifiers and exact totals", async () => {
    const practice = SAMPLE_DATA.practice!;
    const alex = SAMPLE_DATA.clients[0];
    const mk = (fee: string, date: string) => ({
      date, cpt: "90837", pos: "11", modifier: "", fee, icd10: "F41.1",
    });
    const bytes = await buildSuperbillPdf(
      practice, alex,
      [mk("100", "2026-06-03"), mk("150", "2026-06-10"), mk("150", "2026-06-17")],
      "400"
    );
    const buf = Buffer.from(bytes);
    // inflate every flate stream and concatenate text
    let text = "";
    let idx = 0;
    while ((idx = buf.indexOf("stream", idx)) !== -1) {
      const start = buf.indexOf("\n", idx) + 1;
      const end = buf.indexOf("endstream", start);
      if (end === -1) break;
      try { text += inflateSync(buf.subarray(start, end)).toString("latin1"); } catch {}
      idx = end;
    }
    // pdf-lib writes show-text operands as hex strings: <48656c6c6f> Tj
    text += text.replace(/<([0-9a-fA-F]+)>/g, (_, hex: string) =>
      Buffer.from(hex, "hex").toString("latin1")
    );
    for (const needle of [
      "Dr. Sam Demo, LCSW", "1234567893", "12-3456789",
      "Alex Rivera", "04/12/1990",
      "90837", "F41.1", "$100.00", "$150.00",
      "Total charges: $400.00", "Amount paid: $400.00", "Balance: $0.00",
    ]) {
      expect(text, `missing: ${needle}`).toContain(needle);
    }
  });
});
