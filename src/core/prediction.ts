import { add, days, today } from "./dates";
import type { Period, Settings } from "./types";
export const median = (v: number[]) => {
  const a = [...v].sort((x, y) => x - y);
  return a.length
    ? (a[Math.floor((a.length - 1) / 2)] + a[Math.floor(a.length / 2)]) / 2
    : null;
};
export const average = (v: number[]) =>
  v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
export function history(periods: Period[]) {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  const lengths = sorted
    .slice(1)
    .map((p, i) => ({ date: p.start, length: days(p.start, sorted[i].start) }));
  const durations = sorted
    .filter((p) => p.end !== null)
    .map((p) => ({ date: p.start, length: days(p.end!, p.start) + 1 }));
  return { sorted, lengths, durations };
}
export function predict(periods: Period[], settings: Settings, now = today()) {
  const { sorted, lengths, durations } = history(periods);
  const latest = sorted[sorted.length - 1];
  const suppressed = !["standard", "irregular", "perimenopause"].includes(
    settings.mode,
  );
  const raw = lengths.slice(-12).map((x) => x.length);
  const center = median(raw);
  // Exclude implausible intervals and isolated extremes, while preserving ordinary irregularity.
  const valid = raw.filter(
    (n) =>
      n >= 15 &&
      n <= 90 &&
      (center === null || Math.abs(n - center) <= Math.max(15, center * 0.5)),
  );
  const excluded = raw.length - valid.length;
  const med = median(valid);
  const weight =
    valid.reduce((sum, n, i) => sum + n * (i + 1), 0) /
    valid.reduce((sum, _, i) => sum + i + 1, 0);
  const typical = Math.round(
    med === null ? (settings.cycleLength ?? 28) : (med + weight) / 2,
  );
  const variability = valid.length
    ? Math.max(...valid) - Math.min(...valid)
    : 0;
  const irregular =
    settings.mode === "irregular" ||
    settings.mode === "perimenopause" ||
    variability > 7;
  const width = Math.max(
    valid.length >= 6 ? 2 : 3,
    Math.ceil(variability / 2),
    irregular ? 7 : 0,
  );
  const next = latest && !suppressed ? add(latest.start, typical) : null;
  const cycleDay = latest ? days(now, latest.start) + 1 : null;
  const duration = Math.round(
    median(durations.map((x) => x.length)) ?? settings.periodLength ?? 5,
  );
  const low = !valid.length || excluded > 0 || irregular || valid.length < 3;
  const phase =
    !latest || suppressed || !cycleDay || cycleDay > typical + width || low
      ? "Phase uncertain"
      : cycleDay <= duration
        ? "Menstrual"
        : cycleDay < typical - 16
          ? "Follicular"
          : cycleDay <= typical - 12
            ? "Ovulatory estimate"
            : "Luteal";
  return {
    next,
    earliest: next ? add(next, -width) : null,
    latest: next ? add(next, width) : null,
    typical,
    cycleDay: suppressed ? null : cycleDay,
    duration,
    phase,
    variability,
    rangeHalfWidth: width,
    irregular,
    excluded,
    validCycles: valid.length,
    confidence: low
      ? "Low confidence"
      : valid.length >= 6
        ? "Established history"
        : "Learning your rhythm",
    provisional: med === null,
    assumed: med === null && settings.cycleLength === null,
    overdue: next ? days(now, next) > 0 : false,
    daysUntil: next ? days(next, now) : null,
    suppressed,
    ovulation: next ? add(next, -14) : null,
  };
}
