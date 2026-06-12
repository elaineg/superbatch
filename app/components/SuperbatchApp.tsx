"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { Client, Practice, SessionRow } from "../lib/types";
import { money, parseFee } from "../lib/types";
import { setAppData, useAppData } from "../lib/store";
import { SAMPLE_DATA } from "../lib/sample";
// Static import: pdf-lib ships in the page bundle so PDF generation works
// fully offline once the page has loaded (spec success check 4).
import { buildSuperbillPdf, downloadPdf } from "../lib/pdf";
import MonthGrid, { type YearMonth } from "./MonthGrid";
import PracticeForm from "./PracticeForm";
import ClientsPanel from "./ClientsPanel";

function emptySubscribe() {
  return () => {};
}

// Hydration gate: the calendar depends on the current date and saved data,
// which differ between prerender and client. useSyncExternalStore keeps this
// lint-clean under Next 16 (no setState-in-effect).
function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

function defaultsFor(practice: Practice, client: Client) {
  return {
    cpt: client.cpt ?? practice.defaultCpt,
    pos: practice.defaultPos,
    modifier: practice.defaultModifier,
    fee: client.fee ?? practice.defaultFee,
    icd10: client.icd10 ?? practice.defaultIcd10,
  };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const SESSION_FIELDS: { key: keyof Omit<SessionRow, "date">; label: string; width: string }[] = [
  { key: "cpt", label: "CPT", width: "w-20" },
  { key: "pos", label: "POS", width: "w-14" },
  { key: "modifier", label: "Modifier", width: "w-20" },
  { key: "fee", label: "Fee ($)", width: "w-20" },
  { key: "icd10", label: "ICD-10", width: "w-20" },
];

export default function SuperbatchApp() {
  const data = useAppData();
  const hydrated = useHydrated();

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [amountPaid, setAmountPaid] = useState("");
  const [viewMonth, setViewMonth] = useState<YearMonth | null>(null);
  const [editingPractice, setEditingPractice] = useState(false);
  const [pdfMessage, setPdfMessage] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const practice = data.practice;
  const selectedClient = data.clients.find((c) => c.id === selectedClientId) ?? null;

  const now = hydrated ? new Date() : null;
  const view: YearMonth | null =
    viewMonth ?? (now ? { year: now.getFullYear(), month: now.getMonth() } : null);

  const tickedDates = new Set(sessions.map((s) => s.date));
  const total = sessions.reduce((sum, s) => sum + parseFee(s.fee), 0);
  const paid = parseFee(amountPaid);
  const balance = total - paid;

  const step = !selectedClient ? 1 : sessions.length === 0 ? 2 : 3;

  function selectClient(id: string) {
    setSelectedClientId(id);
    setSessions([]);
    setAmountPaid("");
    setPdfMessage(null);
  }

  function toggleDate(key: string) {
    if (!practice || !selectedClient) return;
    setSessions((prev) => {
      if (prev.some((s) => s.date === key)) return prev.filter((s) => s.date !== key);
      const row: SessionRow = { date: key, ...defaultsFor(practice, selectedClient) };
      return [...prev, row].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  function updateSession(date: string, field: keyof SessionRow, value: string) {
    setSessions((prev) => prev.map((s) => (s.date === date ? { ...s, [field]: value } : s)));
  }

  function loadSample() {
    setAppData(SAMPLE_DATA);
    setSelectedClientId(null);
    setSessions([]);
    setAmountPaid("");
  }

  async function generatePdf() {
    if (!practice || !selectedClient || sessions.length === 0) return;
    setPdfMessage(null);
    const bytes = await buildSuperbillPdf(practice, selectedClient, sessions, amountPaid);
    const monthTag = sessions[0].date.slice(0, 7);
    downloadPdf(bytes, `superbill-${slugify(selectedClient.name)}-${monthTag}.pdf`);
    setPdfMessage("PDF downloaded. Generated entirely in this browser — no network request was made.");
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "superbatch-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.clients)) {
          throw new Error("bad shape");
        }
        setAppData({ practice: parsed.practice ?? null, clients: parsed.clients });
        setSelectedClientId(null);
        setSessions([]);
        setAmountPaid("");
      } catch {
        alert("That file doesn't look like a Superbatch backup (expected JSON with a practice profile and clients).");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pb-20">
      {/* ---- Header (5-second check) ---- */}
      <header className="pt-12 pb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          A month of superbills in one minute.
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Save your practice and clients once. Each month: pick a client, tick session dates,
          download the PDF.
        </p>
        <p className="mt-3 max-w-3xl text-sm font-medium text-teal-900">
          Everything stays in this browser. Nothing is ever sent to a server — check the
          network tab.{" "}
          <button
            type="button"
            onClick={exportBackup}
            className="font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-600"
          >
            Export backup
          </button>{" "}
          <span className="font-normal text-slate-500">
            — back up your data; browsers can clear storage.
          </span>{" "}
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="font-semibold text-teal-800 underline underline-offset-2 hover:text-teal-600"
          >
            Import backup
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import backup file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importBackup(f);
              e.target.value = "";
            }}
          />
        </p>
      </header>

      {/* ---- Step strip ---- */}
      <ol className="mb-8 flex flex-wrap items-center gap-2 text-sm" aria-label="Workflow steps">
        {(["Pick client", "Tick dates", "Generate PDF"] as const).map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            {i > 0 ? <span className="text-slate-300">→</span> : null}
            <span
              className={`flex items-center gap-2 rounded-full px-3 py-1 ${
                step === i + 1
                  ? "bg-teal-800 font-semibold text-white"
                  : step > i + 1
                    ? "bg-teal-50 text-teal-900"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              <span className="text-xs">{i + 1}</span> {label}
            </span>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* ---- Left column: client picker / sample data ---- */}
        <div className="space-y-4">
          {hydrated && data.clients.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-teal-700/40 bg-teal-50/50 p-5 text-center">
              <p className="text-sm text-slate-700">
                Your saved clients will appear here. New here?
              </p>
              <button
                type="button"
                onClick={loadSample}
                className="mt-3 w-full rounded-md bg-teal-800 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
              >
                Load sample data — try it with a demo practice
              </button>
              <p className="mt-2 text-xs text-slate-500">
                One click fills a demo practice and two demo clients.
              </p>
            </div>
          ) : null}

          {hydrated && data.clients.length > 0 ? (
            <ClientsPanel
              clients={data.clients}
              practice={practice}
              selectedId={selectedClientId}
              onSelect={selectClient}
              onAdd={(c) => {
                setAppData({
                  ...data,
                  clients: [...data.clients, { ...c, id: `c-${Date.now()}` }],
                });
              }}
              onRemove={(id) => {
                setAppData({ ...data, clients: data.clients.filter((c) => c.id !== id) });
                if (selectedClientId === id) selectClient("");
              }}
            />
          ) : null}

          {hydrated ? (
            practice && !editingPractice ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">{practice.providerName}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  NPI {practice.npi} · EIN {practice.ein}
                </p>
                <p className="text-xs text-slate-500">
                  Defaults: CPT {practice.defaultCpt} · POS {practice.defaultPos} ·{" "}
                  {money(parseFee(practice.defaultFee))} · {practice.defaultIcd10}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingPractice(true)}
                  className="mt-2 text-xs font-medium text-teal-800 hover:underline"
                >
                  Edit practice profile
                </button>
              </div>
            ) : (
              <PracticeForm
                practice={practice}
                onSave={(p) => {
                  setAppData({ ...data, practice: p });
                  setEditingPractice(false);
                }}
                onCancel={practice ? () => setEditingPractice(false) : undefined}
              />
            )
          ) : null}
        </div>

        {/* ---- Right column: calendar + session rows + totals ---- */}
        <div className="space-y-4">
          {view ? (
            <MonthGrid
              view={view}
              ticked={tickedDates}
              disabled={!practice || !selectedClient}
              onToggle={toggleDate}
              onChangeMonth={setViewMonth}
            />
          ) : (
            <div className="h-72 rounded-lg border border-slate-200 bg-white shadow-sm" />
          )}
          {!selectedClient && hydrated ? (
            <p className="text-sm text-slate-500">
              Pick a client on the left to start ticking session dates.
            </p>
          ) : null}

          {selectedClient && sessions.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">
                Sessions for {selectedClient.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Every field is editable — this is exactly what the PDF will say.
              </p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm" data-testid="session-table">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-400">
                      <th className="py-1.5 pr-2">Date</th>
                      {SESSION_FIELDS.map((f) => (
                        <th key={f.key} className="py-1.5 pr-2">
                          {f.label}
                        </th>
                      ))}
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.date} className="border-b border-slate-100">
                        <td className="py-1.5 pr-2">
                          <input
                            type="date"
                            value={s.date}
                            aria-label="Session date"
                            onChange={(e) => updateSession(s.date, "date", e.target.value)}
                            className="w-36 rounded border border-slate-200 px-1.5 py-1 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                          />
                        </td>
                        {SESSION_FIELDS.map((f) => (
                          <td key={f.key} className="py-1.5 pr-2">
                            <input
                              type="text"
                              value={s[f.key]}
                              aria-label={`${f.label} for ${s.date}`}
                              onChange={(e) => updateSession(s.date, f.key, e.target.value)}
                              className={`${f.width} rounded border border-slate-200 px-1.5 py-1 text-sm text-slate-900 focus:border-teal-700 focus:outline-none`}
                            />
                          </td>
                        ))}
                        <td className="py-1.5">
                          <button
                            type="button"
                            onClick={() => toggleDate(s.date)}
                            aria-label={`Remove session on ${s.date}`}
                            className="rounded px-1.5 text-slate-300 hover:bg-red-50 hover:text-red-600"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Live totals — same strings as the PDF */}
              <div className="mt-4 flex flex-col items-end gap-1 border-t border-slate-200 pt-3 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  Amount paid ($)
                  <input
                    type="text"
                    value={amountPaid}
                    placeholder="0"
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-24 rounded border border-slate-200 px-1.5 py-1 text-right text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </label>
                <p className="font-semibold text-slate-900" data-testid="total-charges">
                  {`Total charges: ${money(total)}`}
                </p>
                <p className="text-slate-700" data-testid="amount-paid">
                  {`Amount paid: ${money(paid)}`}
                </p>
                <p className="font-semibold text-slate-900" data-testid="balance">
                  {`Balance: ${money(balance)}`}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={generatePdf}
                  className="rounded-md bg-teal-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
                >
                  Generate PDF
                </button>
                {pdfMessage ? <p className="text-xs text-teal-900">{pdfMessage}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
