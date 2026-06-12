import { test, expect } from "@playwright/test";

// Core flow from APP_SPEC.md success checks 1-3 and 6, exercised in a browser.
test("sample data -> tick 3 dates -> live totals -> edit fee -> PDF", async ({ page }) => {
  await page.goto("/");

  // Privacy statement visible without clicking (check 5)
  await expect(
    page.getByText("Everything stays in this browser. Nothing is ever sent to a server", {
      exact: false,
    })
  ).toBeVisible();

  // Check 1: load sample data
  await page.getByRole("button", { name: /Load sample data/ }).click();
  await expect(page.getByText("Dr. Sam Demo, LCSW")).toBeVisible();
  await expect(page.getByText("NPI 1234567893", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Alex Rivera/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Jordan Lee/ })).toBeVisible();

  // Check 6: persists across reload
  await page.reload();
  await expect(page.getByRole("button", { name: /^Alex Rivera/ })).toBeVisible();

  // Check 2: select Alex, tick 3 dates in the shown month
  await page.getByRole("button", { name: /^Alex Rivera/ }).click();
  const grid = page.locator("div.grid-cols-7");
  for (const day of ["3", "10", "17"]) {
    await grid.getByRole("button", { name: day, exact: true }).click();
  }
  await expect(page.getByTestId("total-charges")).toHaveText("Total charges: $450.00");
  const rows = page.getByTestId("session-table").locator("tbody tr");
  await expect(rows).toHaveCount(3);
  await expect(rows.first().getByLabel(/CPT/)).toHaveValue("90837");
  await expect(rows.first().getByLabel(/POS/)).toHaveValue("11");
  await expect(rows.first().getByLabel(/Fee/)).toHaveValue("150");
  await expect(rows.first().getByLabel(/ICD-10/)).toHaveValue("F41.1");

  // Check 3: edit one fee to 100, amount paid 400
  await rows.first().getByLabel(/Fee/).fill("100");
  await expect(page.getByTestId("total-charges")).toHaveText("Total charges: $400.00");
  await page.getByLabel(/Amount paid/).fill("400");
  await expect(page.getByTestId("amount-paid")).toHaveText("Amount paid: $400.00");
  await expect(page.getByTestId("balance")).toHaveText("Balance: $0.00");

  // PDF downloads client-side
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Generate PDF" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^superbill-alex-rivera-\d{4}-\d{2}\.pdf$/);
});

test("export backup downloads JSON with practice and both clients", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Load sample data/ }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("superbatch-backup.json");
  const path = await download.path();
  const fs = await import("node:fs/promises");
  const parsed = JSON.parse(await fs.readFile(path, "utf8"));
  expect(parsed.practice.npi).toBe("1234567893");
  expect(parsed.clients.map((c: { name: string }) => c.name)).toEqual([
    "Alex Rivera",
    "Jordan Lee",
  ]);

  // Check 7 (restore): wipe storage, confirm clients gone, import the backup
  await page.evaluate(() => window.localStorage.clear());
  await page.reload();
  await expect(page.getByRole("button", { name: /Load sample data/ })).toBeVisible();
  await page.getByLabel("Import backup file").setInputFiles(path!);
  await expect(page.getByRole("button", { name: /^Alex Rivera/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Jordan Lee/ })).toBeVisible();
  await expect(page.getByText("Dr. Sam Demo, LCSW")).toBeVisible();
});
