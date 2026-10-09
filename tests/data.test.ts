import { beforeEach, describe, it, expect } from "vitest";
import {
  db,
  exportData,
  importData,
  eraseData,
  validatePeriod,
  saveSettings,
} from "../src/core/db";
import {
  validateBackup,
  encryptBackup,
  decodeBackup,
} from "../src/core/backup";
import { defaultSettings, emptyLog, type Backup } from "../src/core/types";
const backup = (): Backup => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  settings: { ...defaultSettings },
  periods: [{ id: "p1", start: "2026-09-01", end: "2026-09-05" }],
  logs: [
    {
      ...emptyLog("2026-09-01"),
      flow: "spotting",
      mood: "Calm",
      symptoms: { Cramps: 2 },
    },
  ],
  reminders: [],
});
beforeEach(async () => {
  await eraseData();
});
describe("private local records", () => {
  it("persists logs by date without duplicates and exports all records", async () => {
    await saveSettings(defaultSettings);
    await db.logs.put({ ...emptyLog("2026-09-01"), mood: "Calm" });
    await db.logs.put({ ...emptyLog("2026-09-01"), mood: "Happy" });
    const b = await exportData();
    expect(b.logs).toHaveLength(1);
    expect(b.logs[0].mood).toBe("Happy");
    expect(b.periods).toHaveLength(0);
  });
  it("rejects overlaps, future starts and impossible end ordering", () => {
    expect(() =>
      validatePeriod(
        { id: "x", start: "2026-09-03", end: "2026-09-06" },
        backup().periods,
        "2026-10-09",
      ),
    ).toThrow("overlap");
    expect(() =>
      validatePeriod(
        { id: "x", start: "2026-11-01", end: null },
        [],
        "2026-10-09",
      ),
    ).toThrow("future");
    expect(() =>
      validatePeriod(
        { id: "x", start: "2026-09-03", end: "2026-09-01" },
        [],
        "2026-10-09",
      ),
    ).toThrow("End date");
  });
  it("restores backups transactionally and preserves data on overlap failure", async () => {
    await importData(backup(), true);
    const other = backup();
    other.periods = [{ id: "other", start: "2026-09-02", end: "2026-09-06" }];
    await expect(importData(other, false)).rejects.toThrow("overlap");
    expect((await exportData()).periods).toHaveLength(1);
  });
  it("merges by date and supports replacement and deletion", async () => {
    await importData(backup(), true);
    const b = backup();
    b.logs[0].mood = "Happy";
    await importData(b, false);
    expect((await exportData()).logs[0].mood).toBe("Happy");
    await eraseData();
    expect((await exportData()).logs).toHaveLength(0);
    expect((await exportData()).settings.onboarded).toBe(false);
  });
  it("rejects an overlapping edit during merge and preserves the old version", async () => {
    const first = backup();
    first.periods.push({ id: "p2", start: "2026-10-01", end: "2026-10-05" });
    await importData(first, true);
    const edited = backup();
    edited.periods[0] = { id: "p1", start: "2026-10-03", end: "2026-10-07" };
    await expect(importData(edited, false)).rejects.toThrow("overlap");
    expect((await db.periods.get("p1"))?.start).toBe("2026-09-01");
  });
  it("validates complete schema", () => {
    expect(validateBackup(backup()).version).toBe(1);
    for (const edit of [
      (b: any) => (b.version = 2),
      (b: any) => (b.logs[0].date = "2026-02-30"),
      (b: any) => b.logs.push(b.logs[0]),
      (b: any) => (b.logs[0].symptoms.Cramps = 7),
      (b: any) => delete b.settings.name,
      (b: any) => (b.settings.mode = "toString"),
      (b: any) => b.periods.push({ ...b.periods[0], id: "x" }),
      (b: any) => (b.periods[0].end = "2026-08-01"),
    ]) {
      const b = backup();
      edit(b);
      expect(() => validateBackup(b)).toThrow();
    }
  });
  it("roundtrips encrypted backups and rejects wrong password and tampering", async () => {
    const encrypted = await encryptBackup(backup(), "a strong test password");
    expect(
      (await decodeBackup(encrypted, "a strong test password")).logs[0].mood,
    ).toBe("Calm");
    await expect(decodeBackup(encrypted, "wrong password")).rejects.toThrow(
      "unlock",
    );
    const corrupted = {
      ...encrypted,
      data: encrypted.data.slice(0, -4) + "AAAA",
    };
    await expect(
      decodeBackup(corrupted, "a strong test password"),
    ).rejects.toThrow("unlock");
  }, 10000);
});
