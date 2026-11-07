import { describe, expect, it } from "vitest";
import { hoseNozzleOptions, hoseNozzleValue } from "./hoseNozzleOptions";
import type { StandpipeHoseNozzleEntry } from "./types";

const ROWS: StandpipeHoseNozzleEntry[] = [
  {
    number: 1,
    label: "150 ft of 2-1/2 in. hose, 1-1/8 in. smooth bore nozzle",
    hose: "150 ft (45 m) of 2-1/2 in. (65 mm) hose",
    nozzle: "1-1/8 in. (29 mm) smooth bore nozzle",
    outletPressurePsi: 75,
    flowGpm: 250,
    aboveMinimumResidual: false,
    confidence: "verified",
    sourceNote: null,
  },
  {
    number: 7,
    label: "150 ft of 1-1/2 in. hose (nozzle not stated in the table)",
    hose: "150 ft (45 m) of 1-1/2 in. (40 mm) hose",
    nozzle: null,
    outletPressurePsi: 186,
    flowGpm: 150,
    aboveMinimumResidual: true,
    confidence: "verify",
    sourceNote: "No nozzle is given.",
  },
];

describe("hoseNozzleOptions", () => {
  it("offers one option per row, keyed by the table's number, with the pressure and flow in the label", () => {
    expect(hoseNozzleOptions(ROWS)).toEqual([
      { value: "1", label: "1. 150 ft of 2-1/2 in. hose, 1-1/8 in. smooth bore nozzle: 75 psi at 250 gpm" },
      { value: "7", label: "7. 150 ft of 1-1/2 in. hose (nozzle not stated in the table): 186 psi at 150 gpm (verify)" },
    ]);
  });

  it("offers nothing for an empty table", () => {
    expect(hoseNozzleOptions([])).toEqual([]);
  });
});

describe("hoseNozzleValue", () => {
  it("gives the outlet pressure of the picked row as the text the field holds", () => {
    expect(hoseNozzleValue(ROWS, "1")).toBe("75");
    expect(hoseNozzleValue(ROWS, "7")).toBe("186");
  });

  it("gives nothing for a key that is not in the table", () => {
    expect(hoseNozzleValue(ROWS, "3")).toBeUndefined();
    expect(hoseNozzleValue(ROWS, "")).toBeUndefined();
  });
});
