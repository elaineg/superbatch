export type Practice = {
  providerName: string; // includes credential, e.g. "Dr. Sam Demo, LCSW"
  licenseNumber: string;
  npi: string;
  ein: string;
  address: string;
  phone: string;
  defaultCpt: string;
  defaultPos: string;
  defaultModifier: string;
  defaultFee: string; // stored as string, e.g. "150"
  defaultIcd10: string;
};

export type Client = {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  // Optional per-client overrides of practice defaults
  cpt?: string;
  fee?: string;
  icd10?: string;
};

export type AppData = {
  practice: Practice | null;
  clients: Client[];
};

export type SessionRow = {
  date: string; // YYYY-MM-DD
  cpt: string;
  pos: string;
  modifier: string;
  fee: string;
  icd10: string;
};

export const EMPTY_PRACTICE: Practice = {
  providerName: "",
  licenseNumber: "",
  npi: "",
  ein: "",
  address: "",
  phone: "",
  defaultCpt: "",
  defaultPos: "",
  defaultModifier: "",
  defaultFee: "",
  defaultIcd10: "",
};

export function parseFee(s: string): number {
  const n = parseFloat(String(s).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}
