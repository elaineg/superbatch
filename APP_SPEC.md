# Superbatch
Purpose: lets a private-practice clinician who doesn't take insurance turn saved practice/client defaults plus a set of ticked session dates into a monthly multi-session superbill PDF — generated entirely in the browser, no account, no PHI ever sent to a server.
Problem: A solo therapist, dietitian, or PT who doesn't take insurance hands each self-pay client a monthly superbill for out-of-network reimbursement; for 5–15 clients that's a recurring monthly batch.
Beats alternative: EasyMindCare's free superbill generator (verified: ungated, client-side, no account — but a one-off form: nothing saved, one superbill at a time, full re-entry each use), static Word/PDF templates (SimplePractice, WebPT — free, hand-typed codes), or full EHRs at $49–99/mo. Clarity Cooperative's generator is paywalled at $199/mo Pro. Re-validation 2026-06-12 also found Superbilled.com (free batch + saved clients, but signup required, client PHI stored server-side, free tier capped at 5 superbills/month, $15–29/mo above that). Superbatch's edge: saved defaults + multi-session batch (vs EasyMindCare's full re-entry, ~4 min × 5–15 superbills/month ≈ 5–15 min/week) with no signup, no monthly cap, and zero PHI transmission verifiable in the devtools network tab (vs Superbilled).

Core flows:
1. Setup with memory (the differentiator): on first visit, fill a practice profile (provider name, credential/license #, NPI, EIN/tax ID, address, phone, default CPT code, POS code, modifier, fee, ICD-10 code) and add clients (name, DOB, optional per-client overrides of CPT/fee/ICD-10) — everything persists in localStorage so a returning user only ever ticks session dates. A prominent "Load sample data" button populates a realistic demo practice plus 2 demo clients in one click so anyone can exercise the whole app in seconds. A visible privacy statement on the page states that all data stays in this browser (localStorage), nothing is ever sent to any server, and recommends the JSON backup.
2. Generate a multi-session superbill: pick a saved client, tick session dates on a month-grid date picker; each ticked date becomes an editable session row pre-filled from defaults (date, CPT, POS, modifier, fee, ICD-10); add an amount-paid field; click "Generate PDF" → a superbill PDF is rendered fully client-side (pdf-lib or @react-pdf/renderer, no API call) containing practice header (name, credential, NPI, EIN, license, address, phone), client name + DOB, one row per session with date/CPT/POS/modifier/fee/ICD-10, total charges, amount paid, and balance.
3. Backup and restore: an "Export backup" button downloads all saved data (practice profile + all clients) as a JSON file; "Import backup" restores it from that file (Safari ITP can evict localStorage after ~7 days, and this enables moving devices).

Success checks:
1. Clicking "Load sample data" instantly fills the practice form (e.g. provider "Dr. Sam Demo, LCSW", NPI "1234567893") and shows exactly 2 clients in the client list (e.g. "Alex Rivera", "Jordan Lee") — no typing required.
2. With sample data loaded: select Alex Rivera, tick 3 dates in the current month, click Generate PDF → a PDF downloads whose text contains 3 session rows, each with a date, CPT "90837", POS "11", fee "$150.00", ICD-10 "F41.1", plus "Total charges: $450.00", the client's name and DOB, and the practice's NPI and EIN.
3. Editing one session row's fee from 150 to 100 before generating changes the PDF to show "$100.00" on that row and "Total charges: $400.00"; entering amount paid 400 shows "Amount paid: $400.00" and "Balance: $0.00".
4. Zero server transmission: with the devtools network tab open from page load through PDF generation, no request contains any entered or sample profile/client/session data (static assets only); after the page has loaded, setting the browser to offline and generating a PDF still succeeds.
5. A privacy statement is visible on the page (without clicking anything) stating that data never leaves the browser and no server ever receives it.
6. Reloading the page after check 1 still shows the saved practice profile and both clients — a returning user reaches a finished PDF by only selecting a client and ticking dates.
7. "Export backup" downloads a JSON file containing the practice profile and both clients; after clearing the app's data (or in a fresh private window), "Import backup" with that file restores the profile and both clients, verifiable in the UI.

Out of scope:
- Accounts, auth, or any server-side storage of practice/client data (no database at all).
- Insurance claim submission, CMS-1500 forms, EDI/clearinghouse integration, or eligibility checks.
- Batch "generate all clients at once" ZIP output — MVP is one client per PDF.
- Multiple sessions on the same date, sliding-scale schedules, or multi-provider practices.
- Emailing/sharing PDFs, payment processing, scheduling, notes, or any other EHR feature.
- CPT/ICD-10 code validation or lookup databases — codes are free-text fields the clinician owns.

Production URL: https://superbatch-theta.vercel.app
