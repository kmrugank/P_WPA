import { describe, it, expect } from "vitest";
import { inAppReminders } from "../src/core/reminders";
import { defaultSettings, emptyLog } from "../src/core/types";
describe("in-app reminders", () => {
  it("appears only after the chosen time and suppresses completed check-ins", () => {
    const s = { ...defaultSettings, dailyReminder: true };
    expect(
      inAppReminders(s, [], [], null, new Date(2026, 9, 9, 19, 59)).dailyDue,
    ).toBe(false);
    expect(
      inAppReminders(s, [], [], null, new Date(2026, 9, 9, 20)).dailyDue,
    ).toBe(true);
    expect(
      inAppReminders(
        s,
        [emptyLog("2026-10-09")],
        [],
        null,
        new Date(2026, 9, 9, 21),
      ).dailyDue,
    ).toBe(false);
  });
  it("keeps overdue forecasts out of upcoming reminders and sorts personal events", () => {
    const s = { ...defaultSettings, periodReminder: true };
    expect(inAppReminders(s, [], [], -1, new Date(2026, 9, 9)).periodDue).toBe(
      false,
    );
    const state = inAppReminders(
      s,
      [],
      [
        { id: "b", date: "2026-10-12", text: "Later" },
        { id: "a", date: "2026-10-10", text: "Soon" },
        { id: "old", date: "2026-10-01", text: "Past" },
      ],
      2,
      new Date(2026, 9, 9),
    );
    expect(state.periodDue).toBe(true);
    expect(state.upcoming.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
