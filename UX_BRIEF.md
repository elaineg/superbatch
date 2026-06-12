# UX Brief — Superbatch

## 1. Problem statement
Make a month of superbills for your clients in one minute — and your client info never leaves your computer.

## 2. Primary user action
Tick session dates on a month grid and click "Generate PDF". The landing view shows the
month grid and client picker immediately. For a cold visitor with nothing saved, a large
"Load sample data" button sits exactly where the client picker will be — one click fills
the practice profile and two demo clients, so the visitor sees a finished, real-looking
superbill PDF before typing a single field. Returning users land straight on: their client
list → tick dates → Generate PDF. Setup forms never block this path; they live below or
behind an "Edit practice profile" affordance once filled.

## 3. Emotional tone
Trustworthy and businesslike, like good accounting software. Clean sans-serif with a
slightly formal feel; cool, paper-white temperature with one calm accent (deep teal or
navy) for actions; generous spacing in the workflow, dense tabular spacing in session
rows and the PDF (this is a billing document — alignment signals competence).

## 4. Design decisions
1. **The privacy line is part of the header, not a footer.** Directly under the subtitle,
   before any input: "Everything stays in this browser. Nothing is ever sent to a server —
   check the network tab." Plus a small "Export backup" link beside it framed as routine
   bookkeeping ("Back up your data — browsers can clear storage"). Trust is the wedge;
   it must be readable before the first keystroke.
2. **Ticked dates become editable rows instantly, with a live total.** Every tick on the
   month grid appends a pre-filled session row (date, CPT, POS, modifier, fee, ICD-10)
   below the calendar; "Total charges" and "Balance" update live as fees or amount-paid
   change. The user proofreads the actual bill before the PDF exists — no submit-and-hope.
3. **The returning visit is a three-step strip.** A visible "1 Pick client → 2 Tick dates
   → 3 Generate PDF" progression at the top of the workflow, with the current step
   highlighted. After a profile exists, step 1 is a one-click client list (saved clients
   as cards/rows showing name + default code/fee), never a form. Under a minute,
   visibly so.

## 5. 5-second check (above the fold, cold visitor)
- Headline: "A month of superbills in one minute."
- Subtitle: "Save your practice and clients once. Each month: pick a client, tick session
  dates, download the PDF."
- Privacy line (immediately under subtitle): "Everything stays in this browser — nothing
  is ever sent to a server."
- Primary action area: month grid + the prominent "Load sample data" button where the
  client picker goes, labeled "Load sample data — try it with a demo practice".
- The 1-2-3 step strip, so the batch/repeat value reads at a glance.
