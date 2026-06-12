"use client";

import { useState } from "react";
import type { Practice } from "../lib/types";
import { EMPTY_PRACTICE } from "../lib/types";

const FIELDS: { key: keyof Practice; label: string; placeholder: string }[] = [
  { key: "providerName", label: "Provider name & credential", placeholder: "Dr. Sam Demo, LCSW" },
  { key: "licenseNumber", label: "License #", placeholder: "LCSW-104872" },
  { key: "npi", label: "NPI", placeholder: "1234567893" },
  { key: "ein", label: "EIN / Tax ID", placeholder: "12-3456789" },
  { key: "address", label: "Practice address", placeholder: "455 Demo Street, Suite 210, Portland, OR 97204" },
  { key: "phone", label: "Phone", placeholder: "(503) 555-0184" },
  { key: "defaultCpt", label: "Default CPT code", placeholder: "90837" },
  { key: "defaultPos", label: "Default POS code", placeholder: "11" },
  { key: "defaultModifier", label: "Default modifier (optional)", placeholder: "95" },
  { key: "defaultFee", label: "Default fee ($)", placeholder: "150" },
  { key: "defaultIcd10", label: "Default ICD-10 code", placeholder: "F41.1" },
];

export default function PracticeForm({
  practice,
  onSave,
  onCancel,
}: {
  practice: Practice | null;
  onSave: (p: Practice) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Practice>(practice ?? EMPTY_PRACTICE);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-800">Practice profile</h3>
      <p className="mt-1 text-xs text-slate-500">
        Saved in this browser only — you fill this once.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block text-xs font-medium text-slate-600">
            {f.label}
            <input
              type="text"
              value={draft[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Save practice profile
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
