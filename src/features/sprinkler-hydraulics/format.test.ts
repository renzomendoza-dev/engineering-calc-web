import { describe, expect, it } from "vitest";
import {
  formatDiameter,
  formatFlow,
  formatFrictionRate,
  formatLength,
  formatNominalSize,
  formatPercent,
  formatPlain,
  formatPressure,
  formatVelocity,
} from "./format";

/**
 * These guard the one thing the results display is allowed to do to the API's numbers: round them
 * for the screen. The inputs below are the exact values the backend returns for its documented
 * test case, so a change in rounding shows up here rather than as a worksheet that disagrees with
 * the calculation it came from.
 */
describe("display formatting", () => {
  it("rounds each quantity to the precision its unit is read at", () => {
    expect(formatFlow(14.816207341961707)).toBe("14.8");
    expect(formatFlow(114.8162073419617)).toBe("114.8");
    expect(formatPressure(17.110688763591305)).toBe("17.11");
    expect(formatPressure(62.5245271282077)).toBe("62.52");
    expect(formatPercent(78.51366562898538)).toBe("78.5");
    expect(formatDiameter(1.0488188976377952)).toBe("1.049");
    expect(formatFrictionRate(0.0747661835704656)).toBe("0.0748");
    expect(formatVelocity(5.502064045045666)).toBe("5.50");
    expect(formatLength(10)).toBe("10.00");
  });

  it("keeps a trailing zero rather than dropping it, so a column stays aligned", () => {
    expect(formatPressure(4.33)).toBe("4.33");
    expect(formatPressure(0)).toBe("0.00");
    expect(formatVelocity(1.4177721127004688)).toBe("1.42");
  });

  it("shows a negative elevation pressure as negative", () => {
    expect(formatPressure(-4.33)).toBe("-4.33");
  });

  it("writes C factors and quantities without forced decimals", () => {
    expect(formatPlain(120)).toBe("120");
    expect(formatPlain(149.5)).toBe("149.5");
  });

  it("writes a nominal size key as an inch measurement", () => {
    expect(formatNominalSize("1")).toBe('1"');
    expect(formatNominalSize("1-1/4")).toBe('1-1/4"');
    expect(formatNominalSize("1/2")).toBe('1/2"');
  });
});
