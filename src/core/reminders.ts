import { key } from "./dates";
import type { DailyLog, Reminder, Settings } from "./types";
/** Only computes in-app messages. Never schedules background notifications. */
export function inAppReminders(
  settings: Settings,
  logs: DailyLog[],
  reminders: Reminder[],
  daysUntil: number | null,
  now = new Date(),
) {
  const dateKey = key(now);
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return {
    dailyDue:
      settings.dailyReminder &&
      !logs.some((l) => l.date === dateKey) &&
      time >= settings.reminderTime,
    periodDue:
      settings.periodReminder &&
      daysUntil !== null &&
      daysUntil >= 0 &&
      daysUntil <= 3,
    upcoming: reminders
      .filter((r) => r.date >= dateKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 2),
  };
}
