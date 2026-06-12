import { test, expect, type Page, type Download } from "@playwright/test";
import { inflateSync } from "node:zlib";
import { readFile } from "node:fs/promises";

/**
 * Independent verification suite — assertions derived directly from
 * APP_SPEC.md success checks 1–7, run against the DEPLOYED preview URL
 * (BASE_URL env). Written by the verifier; do not assume core-flow.spec.ts
 * covers the spec.
 *
 * Locator policy (memory/friction/playwright-transient-label-locators.md):
 * only stable handles — data-testids, aria-labels that never change, and
 * button labels that are static for the lifetime of the element.
 */

// ---------- helpers ----------

/** Extract all show-text strings from a pdf-lib PDF (hex operands in flate streams). */
async function pdfText(download: Download): Promise<string> {
  const path = await download.path();
  const buf = await readFile(path!);
  let inflated = "";
  let idx = 0;
  while ((idx = buf.indexOf("stream", idx)) !== -1) {
    const start = buf.indexOf("\n", idx) + 1;
    const end = buf.indexOf("endstream", start);
    if (end === -1) break;
    try {
      inflated += inflateSync(buf.subarray(start, end)).toString("latin1");
    } catch {
      /* not a flate stream */
    }
    idx = end;
  }
  // pdf-lib writes show-text operands as hex strings: <48656c6c6f> Tj
  const parts: string[] = [];
  for (const m of inflated.matchAll(/<([0-9a-fA-F]+)>\s*Tj/g)) {
    parts.push(Buffer.from(m[1], "hex").toString("latin1"));
  }
  return parts.join("\n");
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

async function loadSample(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Load sample data/ }).click();
  await expect(page.getByTestId("client-list").locator("li")).toHaveCount(2);
}

/** Select Alex Rivera and tick days 3, 10, 17 of the displayed (current) month. */
async function alexWithThreeDates(page: Page) {
  await page.getByRole("button", { name: /^Alex Rivera/ }).click();
  const grid = page.locator("div.grid-cols-7");
  for (const day of ["3", "10", "17"]) {
    await grid.getByRole("button", { name: day, exact: true }).click();
  }
  await expect(page.getByTestId("session-table").locator("tbody tr")).toHaveCount(3);
}

function currentMonthDatesUS(days: number[]): string[] {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return days.map((d) => `${mm}/${String(d).padStart(2, "0")}/${yyyy}`);
}

// Strings that must never appear in any network request (check 4).
const SENSITIVE = [
  "Sam Demo",
  "Sam%20Demo",
  "1234567893",
  "12-3456789",
  "Rivera",
  "Jordan",
  "Lee",
  "LCSW-104872",
  "455 Demo",
  "455%20Demo",
  "F41.1",
  "90837",
];

// ---------- check 5 + 1 + 6: privacy statement, sample data, persistence ----------

test("check 5: privacy statement visible without any interaction", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText(/Everything stays in this browser\. Nothing is ever sent to a server/)
  ).toBeVisible();
});

test("check 1: Load sample data fills practice and exactly 2 clients", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Load sample data/ }).click();
  await expect(page.getByText("Dr. Sam Demo, LCSW")).toBeVisible();
  await expect(page.getByText(/NPI 1234567893/)).toBeVisible();
  const clients = page.getByTestId("client-list").locator("li");
  await expect(clients).toHaveCount(2);
  await expect(clients.nth(0)).toContainText("Alex Rivera");
  await expect(clients.nth(1)).toContainText("Jordan Lee");
});

test("check 6: profile and clients persist across reload (localStorage)", async ({ page }) => {
  await loadSample(page);
  await page.reload();
  await expect(page.getByText("Dr. Sam Demo, LCSW")).toBeVisible();
  await expect(page.getByText(/NPI 1234567893/)).toBeVisible();
  const clients = page.getByTestId("client-list").locator("li");
  await expect(clients).toHaveCount(2);
  await expect(clients.nth(0)).toContainText("Alex Rivera");
  await expect(clients.nth(1)).toContainText("Jordan Lee");
  // Returning user reaches a PDF by only selecting a client and ticking dates:
  await alexWithThreeDates(page);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate PDF" }).click();
  expect((await dl).suggestedFilename()).toMatch(/^superbill-alex-rivera-\d{4}-\d{2}\.pdf$/);
});

// ---------- check 2: PDF content with defaults ----------

test("check 2: PDF has 3 default rows, $450.00 total, client + practice ids", async ({
  page,
}) => {
  await loadSample(page);
  await alexWithThreeDates(page);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate PDF" }).click();
  const text = await pdfText(await dl);

  // 3 session rows, each with a date in the current month
  for (const date of currentMonthDatesUS([3, 10, 17])) {
    expect(text, `missing session date ${date}`).toContain(date);
  }
  // each row: CPT 90837, fee $150.00, ICD-10 F41.1 (exactly 3 of each)
  expect(count(text, "90837"), "CPT 90837 should appear on all 3 rows").toBe(3);
  expect(count(text, "$150.00"), "$150.00 should appear on all 3 rows").toBe(3);
  expect(count(text, "F41.1"), "F41.1 should appear on all 3 rows").toBe(3);
  // POS column present (header + value "11" on rows)
  expect(text).toContain("POS");
  expect(count(text, "\n11"), 'POS "11" should appear on all 3 rows').toBeGreaterThanOrEqual(3);
  // totals, client identity, practice ids
  expect(text).toContain("Total charges: $450.00");
  expect(text).toContain("Alex Rivera");
  expect(text).toContain("DOB: 04/12/1990");
  expect(text).toContain("NPI: 1234567893");
  expect(text).toContain("12-3456789");
});

// ---------- check 3: edited fee + amount paid flow into the PDF ----------

test("check 3: fee edit 150->100 and amount paid 400 change PDF totals", async ({ page }) => {
  await loadSample(page);
  await alexWithThreeDates(page);

  const firstRow = page.getByTestId("session-table").locator("tbody tr").first();
  await firstRow.getByLabel(/^Fee/).fill("100");
  await expect(page.getByTestId("total-charges")).toHaveText("Total charges: $400.00");
  await page.getByLabel(/Amount paid/).fill("400");
  await expect(page.getByTestId("amount-paid")).toHaveText("Amount paid: $400.00");
  await expect(page.getByTestId("balance")).toHaveText("Balance: $0.00");

  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate PDF" }).click();
  const text = await pdfText(await dl);
  expect(count(text, "$100.00"), "edited row fee").toBe(1);
  expect(count(text, "$150.00"), "two untouched rows").toBe(2);
  expect(text).toContain("Total charges: $400.00");
  expect(text).toContain("Amount paid: $400.00");
  expect(text).toContain("Balance: $0.00");
});

// ---------- check 4: zero server transmission + offline PDF ----------

test("check 4: no practice/client data in any request; PDF generates offline", async ({
  page,
  context,
}) => {
  const requests: { method: string; url: string; body: string }[] = [];
  page.on("request", (req) => {
    requests.push({ method: req.method(), url: req.url(), body: req.postData() ?? "" });
  });

  await loadSample(page);
  await alexWithThreeDates(page);
  await page.getByLabel(/Amount paid/).fill("400");
  const dl1 = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate PDF" }).click();
  await dl1;

  // No request from page load through PDF generation carries entered/sample data.
  for (const req of requests) {
    for (const needle of SENSITIVE) {
      expect(
        req.url.toLowerCase(),
        `request URL leaks "${needle}": ${req.method} ${req.url}`
      ).not.toContain(needle.toLowerCase());
      expect(
        req.body.toLowerCase(),
        `request body leaks "${needle}": ${req.method} ${req.url}`
      ).not.toContain(needle.toLowerCase());
    }
  }
  // Static assets only — no data-bearing methods at all.
  const nonGet = requests.filter((r) => !["GET", "HEAD"].includes(r.method));
  expect(
    nonGet.map((r) => `${r.method} ${r.url}`),
    "expected zero non-GET requests during the whole flow"
  ).toEqual([]);

  // Offline: PDF generation must still succeed with the network cut.
  await context.setOffline(true);
  const dl2 = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate PDF" }).click();
  const offlineDownload = await dl2;
  const text = await pdfText(offlineDownload);
  expect(text).toContain("Total charges: $450.00");
  expect(text).toContain("Alex Rivera");
  await context.setOffline(false);
});

// ---------- check 7: export/import round-trip ----------

test("check 7: export backup JSON, wipe storage, import restores everything", async ({
  page,
}) => {
  await loadSample(page);

  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe("superbatch-backup.json");
  const path = (await download.path())!;
  const parsed = JSON.parse(await readFile(path, "utf8"));
  expect(parsed.practice.providerName).toBe("Dr. Sam Demo, LCSW");
  expect(parsed.practice.npi).toBe("1234567893");
  expect(parsed.practice.ein).toBe("12-3456789");
  expect(parsed.clients).toHaveLength(2);
  expect(parsed.clients.map((c: { name: string }) => c.name)).toEqual([
    "Alex Rivera",
    "Jordan Lee",
  ]);

  // Wipe the app's data and prove the UI is empty again.
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("button", { name: /Load sample data/ })).toBeVisible();
  await expect(page.getByTestId("client-list")).toHaveCount(0);

  // Import restores profile and both clients, verifiable in the UI.
  await page.getByLabel("Import backup file").setInputFiles(path);
  const clients = page.getByTestId("client-list").locator("li");
  await expect(clients).toHaveCount(2);
  await expect(clients.nth(0)).toContainText("Alex Rivera");
  await expect(clients.nth(1)).toContainText("Jordan Lee");
  await expect(page.getByText("Dr. Sam Demo, LCSW")).toBeVisible();
  await expect(page.getByText(/NPI 1234567893/)).toBeVisible();
});
