"use client";

import { useState } from "react";
import type { Client, Practice } from "../lib/types";
import { money, parseFee } from "../lib/types";

type ClientDraft = {
  name: string;
  dob: string;
  cpt: string;
  fee: string;
  icd10: string;
};

const EMPTY_DRAFT: ClientDraft = { name: "", dob: "", cpt: "", fee: "", icd10: "" };

export default function ClientsPanel({
  clients,
  practice,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
}: {
  clients: Client[];
  practice: Practice | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (c: Omit<Client, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<ClientDraft>(EMPTY_DRAFT);
  const [adding, setAdding] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim()) return;
    onAdd({
      name: draft.name.trim(),
      dob: draft.dob,
      cpt: draft.cpt.trim() || undefined,
      fee: draft.fee.trim() || undefined,
      icd10: draft.icd10.trim() || undefined,
    });
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">Your clients</h3>
      <ul className="mt-3 space-y-2" data-testid="client-list">
        {clients.map((c) => {
          const cpt = c.cpt ?? practice?.defaultCpt ?? "";
          const fee = c.fee ?? practice?.defaultFee ?? "";
          const selected = c.id === selectedId;
          return (
            <li key={c.id} className="flex items-stretch gap-1">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-pressed={selected}
                className={`flex-1 rounded-md border px-3 py-2 text-left transition-colors ${
                  selected
                    ? "border-teal-800 bg-teal-50"
                    : "border-slate-200 hover:border-teal-700"
                }`}
              >
                <span className="block text-sm font-semibold text-slate-900">{c.name}</span>
                <span className="block text-xs text-slate-500">
                  CPT {cpt} · {money(parseFee(fee))} per session
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemove(c.id)}
                aria-label={`Remove ${c.name}`}
                title={`Remove ${c.name}`}
                className="rounded-md px-2 text-slate-300 hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </li>
          );
        })}
      </ul>

      {adding ? (
        <form onSubmit={submit} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <label className="block text-xs font-medium text-slate-600">
            Client name
            <input
              type="text"
              value={draft.name}
              required
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Date of birth
            <input
              type="date"
              value={draft.dob}
              onChange={(e) => setDraft({ ...draft, dob: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </label>
          <p className="text-xs text-slate-400">
            Optional overrides (leave blank to use practice defaults):
          </p>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs font-medium text-slate-600">
              CPT
              <input
                type="text"
                value={draft.cpt}
                placeholder={practice?.defaultCpt}
                onChange={(e) => setDraft({ ...draft, cpt: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              Fee ($)
              <input
                type="text"
                value={draft.fee}
                placeholder={practice?.defaultFee}
                onChange={(e) => setDraft({ ...draft, fee: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              ICD-10
              <input
                type="text"
                value={draft.icd10}
                placeholder={practice?.defaultIcd10}
                onChange={(e) => setDraft({ ...draft, icd10: e.target.value })}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
            >
              Save client
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-md px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-3 text-xs font-medium text-teal-800 hover:underline"
        >
          + Add client
        </button>
      )}
    </div>
  );
}
