import { describe, it, expect } from "vitest";
import { money, parseFee } from "../../app/lib/types";
import { SAMPLE_DATA } from "../../app/lib/sample";
import { buildSuperbillPdf } from "../../app/lib/pdf";

describe("fee parsing and money formatting", () => {
  it("formats spec totals exactly", () => {
    expect(money(450)).toBe("$450.00");
    expect(money(3 * parseFee("150"))).toBe("$450.00");
    expect(money(parseFee("100") + 2 * parseFee("150"))).toBe("$400.00");
    expect(money(400 - parseFee("400"))).toBe("$0.00");
  });

  it("tolerates $ signs and junk", () => {
    expect(parseFee("$150.00")).toBe(150);
    expect(parseFee("")).toBe(0);
    expect(parseFee("abc")).toBe(0);
  });
});

describe("sample data matches APP_SPEC.md success checks", () => {
  it("has the exact provider, NPI, and two clients the spec asserts on", () => {
    expect(SAMPLE_DATA.practice?.providerName).toBe("Dr. Sam Demo, LCSW");
    expect(SAMPLE_DATA.practice?.npi).toBe("1234567893");
    expect(SAMPLE_DATA.clients.map((c) => c.name)).toEqual(["Alex Rivera", "Jordan Lee"]);
  });

  it("Alex Rivera uses practice defaults 90837 / 11 / 150 / F41.1", () => {
    const alex = SAMPLE_DATA.clients[0];
    expect(alex.cpt).toBeUndefined();
    expect(alex.fee).toBeUndefined();
    expect(alex.icd10).toBeUndefined();
    expect(SAMPLE_DATA.practice?.defaultCpt).toBe("90837");
    expect(SAMPLE_DATA.practice?.defaultPos).toBe("11");
    expect(SAMPLE_DATA.practice?.defaultFee).toBe("150");
    expect(SAMPLE_DATA.practice?.defaultIcd10).toBe("F41.1");
  });
});

describe("client-side PDF generation", () => {
  it("builds a valid multi-session PDF with no network access", async () => {
    const practice = SAMPLE_DATA.practice!;
    const alex = SAMPLE_DATA.clients[0];
    const sessions = ["2026-06-03", "2026-06-10", "2026-06-17"].map((date) => ({
      date,
      cpt: practice.defaultCpt,
      pos: practice.defaultPos,
      modifier: practice.defaultModifier,
      fee: practice.defaultFee,
      icd10: practice.defaultIcd10,
    }));
    const bytes = await buildSuperbillPdf(practice, alex, sessions, "400");
    expect(bytes.length).toBeGreaterThan(1000);
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
  });
});
