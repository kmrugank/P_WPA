import { describe, it, expect } from "vitest";
import { predict, history } from "../src/core/prediction";
import { add, days, validDate } from "../src/core/dates";
import { defaultSettings, type Period } from "../src/core/types";
const records = (dates: string[]): Period[] =>
  dates.map((start, i) => ({ id: String(i), start, end: add(start, 4) }));
describe("calendar prediction", () => {
  it("has no invented forecast with no history", () => {
    const p = predict([], defaultSettings, "2026-10-09");
    expect(p.next).toBeNull();
    expect(p.phase).toBe("Phase uncertain");
  });
  it("uses user configuration with one period and low confidence", () => {
    const p = predict(
      records(["2026-09-20"]),
      { ...defaultSettings, cycleLength: 31 },
      "2026-10-09",
    );
    expect(p.next).toBe("2026-10-21");
    expect(p.confidence).toBe("Low confidence");
    expect(p.cycleDay).toBe(20);
  });
  it("labels an unknown length as provisional 28 days", () => {
    expect(
      predict(records(["2026-09-20"]), {
        ...defaultSettings,
        cycleLength: null,
      }).assumed,
    ).toBe(true);
  });
  it("learns regular 30 day cycles rather than imposing 28", () => {
    const p = predict(
      records(Array.from({ length: 8 }, (_, i) => add("2026-01-01", i * 30))),
      defaultSettings,
      "2026-08-02",
    );
    expect(p.typical).toBe(30);
    expect(p.validCycles).toBe(7);
    expect(p.confidence).toBe("Established history");
  });
  it("widens irregular ranges", () => {
    const p = predict(
      records(["2026-01-01", "2026-01-24", "2026-03-02", "2026-03-30"]),
      defaultSettings,
      "2026-04-01",
    );
    expect(p.irregular).toBe(true);
    expect(days(p.latest!, p.earliest!)).toBeGreaterThanOrEqual(14);
  });
  it("does not let a missed entry dominate", () => {
    const p = predict(
      records([
        "2026-01-01",
        "2026-01-29",
        "2026-02-26",
        "2026-04-23",
        "2026-05-21",
      ]),
      defaultSettings,
    );
    expect(p.excluded).toBe(1);
    expect(p.typical).toBe(28);
  });
  it("handles very short and very long intervals explicitly", () => {
    const p = predict(
      records(["2026-01-01", "2026-01-08", "2026-06-01"]),
      defaultSettings,
    );
    expect(p.excluded).toBe(2);
    expect(p.provisional).toBe(true);
  });
  it("uses inclusive duration across a leap day", () => {
    const h = history([{ id: "1", start: "2024-02-27", end: "2024-03-02" }]);
    expect(h.durations[0].length).toBe(5);
    expect(add("2024-02-28", 1)).toBe("2024-02-29");
    expect(add("2025-02-28", 1)).toBe("2025-03-01");
  });
  it("uses calendar days over daylight saving boundaries", () => {
    expect(days("2026-03-10", "2026-03-07")).toBe(3);
    expect(add("2026-10-31", 2)).toBe("2026-11-02");
  });
  it("sorts incorrect order and reacts to corrected dates", () => {
    const p = records(["2026-03-01", "2026-01-01", "2026-01-31"]);
    expect(history(p).lengths.map((x) => x.length)).toEqual([30, 29]);
    p[0].start = "2026-03-04";
    expect(history(p).lengths.map((x) => x.length)).toEqual([30, 32]);
  });
  it("does not auto-create overdue periods", () => {
    const input = records(["2026-01-01"]);
    expect(predict(input, defaultSettings, "2026-03-01").overdue).toBe(true);
    expect(input).toHaveLength(1);
  });
  it.each([
    "pregnancy",
    "postpartum",
    "breastfeeding",
    "contraception",
    "uncertain",
  ] as const)("pauses unsuitable forecasts in %s mode", (mode) => {
    expect(
      predict(records(["2026-01-01"]), { ...defaultSettings, mode }).next,
    ).toBeNull();
  });
  it("rejects impossible calendar dates", () => {
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
  });
});
