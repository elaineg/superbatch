# Superbatch

A month of superbills in one minute — fully client-side. Save your practice profile and
clients once (localStorage), then each month: pick a client, tick session dates on a month
grid, and download a multi-session superbill PDF generated entirely in the browser with
pdf-lib. No account, no server, no PHI ever transmitted.

See `APP_SPEC.md` for the spec and success checks, and `UX_BRIEF.md` for the design brief.

## Develop

```bash
npm run dev        # local dev server
npm run test       # vitest unit tests (sample data, totals, PDF content)
npm run test:e2e   # playwright e2e (BASE_URL=<url> to target a deploy)
npm run build      # production build
```

## Architecture notes

- 100% client-side: no API routes, no server actions, no database.
- Persistence: localStorage (`superbatch-data-v1`), exposed via a
  `useSyncExternalStore`-based hook (`app/lib/store.ts`).
- PDF: `pdf-lib` with embedded standard fonts, statically imported so generation works
  offline after page load. On-screen session table and totals show the exact strings the
  PDF contains.
- Backup: JSON export/import of practice profile + clients (Safari ITP can evict
  localStorage after ~7 days).
