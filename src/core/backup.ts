import { validDate, today } from "./dates";
import {
  modeLabels,
  moods,
  defaultSettings,
  emptyLog,
  type Backup,
  type Settings,
  type DailyLog,
} from "./types";
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const fail = () => {
  throw new Error(
    "This backup is invalid or incompatible. Your existing data has not changed.",
  );
};
const text = (x: unknown, max = 10000) =>
  typeof x === "string" && x.length <= max;
const range = (x: unknown, min: number, max: number) =>
  typeof x === "number" && Number.isFinite(x) && x >= min && x <= max;
export function validateBackup(input: unknown): Backup {
  if (
    !object(input) ||
    input.version !== 1 ||
    !text(input.exportedAt) ||
    !Number.isFinite(Date.parse(input.exportedAt as string)) ||
    !object(input.settings) ||
    !Array.isArray(input.periods) ||
    !Array.isArray(input.logs) ||
    !Array.isArray(input.reminders)
  )
    return fail();
  const s = input.settings;
  if (
    !text(s.name, 100) ||
    !(
      s.cycleLength === null ||
      (Number.isInteger(s.cycleLength) && range(s.cycleLength, 15, 90))
    ) ||
    !(
      s.periodLength === null ||
      (Number.isInteger(s.periodLength) && range(s.periodLength, 1, 15))
    ) ||
    typeof s.mode !== "string" ||
    !Object.hasOwn(modeLabels, s.mode) ||
    !["system", "light", "dark"].includes(s.theme as string) ||
    ![0, 1].includes(s.weekStart as number) ||
    !["MMM d, yyyy", "dd/MM/yyyy", "MM/dd/yyyy"].includes(
      s.dateFormat as string,
    ) ||
    !["fertile", "dailyReminder", "periodReminder", "onboarded"].every(
      (k) => typeof s[k] === "boolean",
    ) ||
    !Array.isArray(s.goals) ||
    !s.goals.every((x) => text(x, 100)) ||
    !text(s.reminderTime) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.reminderTime as string)
  )
    return fail();
  const ids = new Set(),
    starts = new Set(),
    dates = new Set(),
    reminders = new Set();
  if (
    input.periods.length > 10000 ||
    input.logs.length > 50000 ||
    input.reminders.length > 10000
  )
    return fail();
  for (const p of input.periods) {
    if (
      !object(p) ||
      !text(p.id, 100) ||
      !p.id ||
      ids.has(p.id) ||
      !validDate(p.start) ||
      p.start > today() ||
      starts.has(p.start) ||
      !(
        p.end === null ||
        (validDate(p.end) && p.end >= p.start && p.end <= today())
      )
    )
      return fail();
    ids.add(p.id);
    starts.add(p.start);
  }
  const sorted = [...input.periods].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i - 1].end === null || sorted[i].start <= sorted[i - 1].end)
      return fail();
  for (const l of input.logs) {
    if (
      !object(l) ||
      !validDate(l.date) ||
      dates.has(l.date) ||
      !["", "spotting", "light", "medium", "heavy"].includes(
        l.flow as string,
      ) ||
      !["", ...moods].includes(l.mood as string) ||
      !object(l.symptoms) ||
      Object.entries(l.symptoms).some(
        ([k, v]) =>
          !k || k.length > 100 || !Number.isInteger(v) || !range(v, 1, 5),
      ) ||
      !["sleep", "energy", "stress", "hydration"].every(
        (k) => l[k] === null || (Number.isInteger(l[k]) && range(l[k], 1, 5)),
      ) ||
      !["exercise", "appetite", "mucus", "note"].every((k) => text(l[k])) ||
      !(l.temperature === null || range(l.temperature, 30, 45))
    )
      return fail();
    dates.add(l.date);
  }
  for (const r of input.reminders) {
    if (
      !object(r) ||
      !text(r.id, 100) ||
      !r.id ||
      reminders.has(r.id) ||
      !validDate(r.date) ||
      !text(r.text, 500)
    )
      return fail();
    reminders.add(r.id);
  }
  // Copy only schema-owned properties, never arbitrary object prototypes.
  const b = input as unknown as Backup;
  const pick = <T extends object, K extends keyof T>(
    record: T,
    keys: K[],
  ): Pick<T, K> =>
    Object.fromEntries(keys.map((k) => [k, record[k]])) as Pick<T, K>;
  return {
    version: 1,
    exportedAt: b.exportedAt,
    settings: pick(
      b.settings,
      Object.keys(defaultSettings) as (keyof Settings)[],
    ),
    periods: b.periods.map((p) => pick(p, ["id", "start", "end"])),
    logs: b.logs.map((l) => ({
      ...pick(l, Object.keys(emptyLog(l.date)) as (keyof DailyLog)[]),
      symptoms: Object.fromEntries(Object.entries(l.symptoms)),
    })),
    reminders: b.reminders.map((r) => pick(r, ["id", "date", "text"])),
  };
}
const enc = new TextEncoder(),
  dec = new TextDecoder();
const b64 = (a: Uint8Array) =>
  btoa(Array.from(a, (c) => String.fromCharCode(c)).join(""));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function derive(password: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 600000,
      hash: "SHA-256",
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function encryptBackup(data: Backup, password: string) {
  if (password.length < 10)
    throw new Error("Use at least 10 characters for your backup password.");
  const salt = crypto.getRandomValues(new Uint8Array(16)),
    iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(data)),
  );
  return {
    format: "lunara-encrypted",
    version: 1,
    iterations: 600000,
    salt: b64(salt),
    iv: b64(iv),
    data: b64(new Uint8Array(encrypted)),
  };
}
export async function decodeBackup(
  input: unknown,
  password: string,
): Promise<Backup> {
  if (object(input) && input.format === "lunara-encrypted") {
    if (
      input.version !== 1 ||
      input.iterations !== 600000 ||
      !text(input.salt, 100) ||
      !text(input.iv, 100) ||
      !text(input.data, 20000000)
    )
      return fail();
    try {
      const salt = unb64(input.salt as string),
        iv = unb64(input.iv as string);
      if (salt.length !== 16 || iv.length !== 12) return fail();
      const key = await derive(password, salt);
      const raw = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as BufferSource },
        key,
        unb64(input.data as string) as BufferSource,
      );
      return validateBackup(JSON.parse(dec.decode(raw)));
    } catch {
      throw new Error(
        "Could not unlock this backup. Check the password and file.",
      );
    }
  }
  return validateBackup(input);
}
export function download(
  content: string,
  name: string,
  type = "application/json",
) {
  const blob = new Blob([content], { type }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
