import { validDate } from "./dates";
import Dexie, { type Table } from "dexie";
import {
  defaultSettings,
  type Settings,
  type Period,
  type DailyLog,
  type Reminder,
  type Backup,
} from "./types";
class LunaraDB extends Dexie {
  periods!: Table<Period, string>;
  logs!: Table<DailyLog, string>;
  preferences!: Table<{ id: string; value: Settings }, string>;
  reminders!: Table<Reminder, string>;
  constructor() {
    super("lunara-private-v1");
    this.version(1).stores({
      periods: "id,&start",
      logs: "date",
      preferences: "id",
      reminders: "id,date",
    });
  }
}
export const db = new LunaraDB();
export async function readData() {
  const [periods, logs, preferences, reminders] = await Promise.all([
    db.periods.toArray(),
    db.logs.toArray(),
    db.preferences.get("settings"),
    db.reminders.toArray(),
  ]);
  return {
    periods,
    logs,
    settings: preferences?.value ?? { ...defaultSettings },
    reminders,
  };
}
export async function saveSettings(settings: Settings) {
  await db.preferences.put({ id: "settings", value: settings });
}
export async function exportData(): Promise<Backup> {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    ...(await readData()),
  };
}
export async function importData(data: Backup, replace: boolean) {
  await db.transaction(
    "rw",
    db.periods,
    db.logs,
    db.preferences,
    db.reminders,
    async () => {
      if (replace) {
        await db.periods.clear();
        await db.logs.clear();
        await db.reminders.clear();
      } else {
        const existing = await db.periods.toArray();
        const merged = new Map(existing.map((p) => [p.id, p]));
        for (const p of data.periods) merged.set(p.id, p);
        const combined = [...merged.values()].sort((a, b) =>
          a.start.localeCompare(b.start),
        );
        for (let i = 1; i < combined.length; i++) {
          if (
            combined[i - 1].end === null ||
            combined[i].start <= combined[i - 1].end!
          )
            throw new Error(
              "Periods overlap. Choose replace or correct your backup.",
            );
        }
      }
      await db.periods.bulkPut(data.periods);
      await db.logs.bulkPut(data.logs);
      await db.reminders.bulkPut(data.reminders);
      if (replace) await saveSettings(data.settings);
    },
  );
}
export async function eraseData() {
  await db.transaction(
    "rw",
    db.periods,
    db.logs,
    db.preferences,
    db.reminders,
    async () => {
      await Promise.all([
        db.periods.clear(),
        db.logs.clear(),
        db.preferences.clear(),
        db.reminders.clear(),
      ]);
    },
  );
}
export function validatePeriod(
  period: Period,
  existing: Period[],
  now: string,
) {
  if (
    !validDate(period.start) ||
    (period.end !== null && !validDate(period.end))
  )
    throw new Error("Choose valid calendar dates.");
  if (period.start > now)
    throw new Error("A confirmed period cannot begin in the future.");
  if (period.end && (period.end < period.start || period.end > now))
    throw new Error("End date must be between the start and today.");
  if (
    existing.some(
      (p) =>
        p.id !== period.id &&
        period.start <= (p.end ?? now) &&
        (period.end ?? now) >= p.start,
    )
  )
    throw new Error(
      "These dates overlap an existing period. Edit that period instead.",
    );
}
