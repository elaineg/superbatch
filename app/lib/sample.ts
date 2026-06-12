import type { AppData } from "./types";

// Values referenced by APP_SPEC.md success checks — do not change without
// updating the spec: provider "Dr. Sam Demo, LCSW", NPI "1234567893",
// clients "Alex Rivera" and "Jordan Lee", Alex's rows use practice defaults
// CPT 90837 / POS 11 / fee 150 / ICD-10 F41.1 (3 dates => $450.00 total).
export const SAMPLE_DATA: AppData = {
  practice: {
    providerName: "Dr. Sam Demo, LCSW",
    licenseNumber: "LCSW-104872",
    npi: "1234567893",
    ein: "12-3456789",
    address: "455 Demo Street, Suite 210, Portland, OR 97204",
    phone: "(503) 555-0184",
    defaultCpt: "90837",
    defaultPos: "11",
    defaultModifier: "",
    defaultFee: "150",
    defaultIcd10: "F41.1",
  },
  clients: [
    {
      id: "sample-alex",
      name: "Alex Rivera",
      dob: "1990-04-12",
      // no overrides — uses practice defaults (90837 / $150 / F41.1)
    },
    {
      id: "sample-jordan",
      name: "Jordan Lee",
      dob: "1985-09-23",
      cpt: "90834",
      fee: "125",
      icd10: "F33.1",
    },
  ],
};
