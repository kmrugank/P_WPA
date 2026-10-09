import { useState } from "react";
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Droplets, Edit3 } from "lucide-react";
import { Card, PageTitle, Sheet, Info } from "../components/UI";
import { useStore, db } from "../core/store";
import { today, date, key, nice, add } from "../core/dates";
import { predict } from "../core/prediction";
import type { Period } from "../core/types";
export default function Calendar({
  editPeriod,
  editLog,
}: {
  editPeriod: (p?: Period, start?: string) => void;
  editLog: (day: string) => void;
}) {
  const { periods, logs, settings, reminders, mutate } = useStore(),
    p = predict(periods, settings);
  const [month, setMonth] = useState(startOfMonth(new Date())),
    [selected, setSelected] = useState<string | null>(null),
    [event, setEvent] = useState("");
  const range = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), {
      weekStartsOn: settings.weekStart,
    }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: settings.weekStart }),
  });
  const currentPeriod = selected
    ? periods.find((p) => selected >= p.start && selected <= (p.end ?? today()))
    : undefined;
  const log = logs.find((l) => l.date === selected);
  function status(day: string) {
    const period = periods.find(
      (p) => day >= p.start && day <= (p.end ?? today()),
    );
    const predicted =
      !period && p.next && day >= p.next && day <= add(p.next, p.duration - 1);
    const fertile =
      settings.fertile &&
      p.ovulation &&
      day >= add(p.ovulation, -5 - p.rangeHalfWidth) &&
      day <= add(p.ovulation, 1 + p.rangeHalfWidth);
    return {
      period,
      predicted,
      fertile,
      ovulation: settings.fertile && day === p.ovulation,
    };
  }
  return (
    <>
      <PageTitle
        eyebrow="YOUR DAYS, AT A GLANCE"
        title="The cycle calendar"
        description="A living record of your own rhythm."
      >
        <button className="button primary" onClick={() => editPeriod()}>
          <Plus size={17} />
          Log period
        </button>
      </PageTitle>
      <Card className="calendar-card">
        <div className="calendar-toolbar">
          <div className="month-title">
            <h2>{format(month, "MMMM")}</h2>
            <select
              aria-label="Calendar year"
              value={month.getFullYear()}
              onChange={(e) =>
                setMonth(new Date(+e.target.value, month.getMonth(), 1))
              }
            >
              {Array.from(
                { length: 151 },
                (_, i) => new Date().getFullYear() - 100 + i,
              ).map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="calendar-controls">
            <button
              className="text-button"
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Today
            </button>
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="icon-button"
              aria-label="Next month"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="calendar-grid weekdays">
          {(settings.weekStart === 1
            ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          ).map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="calendar-grid">
          {range.map((d) => {
            const k = key(d),
              s = status(k),
              l = logs.find((l) => l.date === k);
            return (
              <button
                key={k}
                className={`calendar-day ${d.getMonth() !== month.getMonth() ? "outside" : ""} ${k === today() ? "today" : ""} ${s.period ? "confirmed" : s.predicted ? "predicted" : s.fertile ? "fertile" : ""}`}
                aria-label={`${nice(k, "EEEE, MMMM d, yyyy")}${s.period ? ", recorded period" : s.predicted ? ", estimated period" : ""}${s.ovulation ? ", estimated ovulation" : s.fertile ? ", broad fertile-window estimate" : ""}${l ? ", daily log" : ""}`}
                onClick={() => {
                  setSelected(k);
                  setEvent("");
                }}
              >
                <span>{d.getDate()}</span>
                <div className="day-markers">
                  {s.period ? (
                    <Droplets size={13} />
                  ) : s.predicted ? (
                    <span className="prediction-dash">~</span>
                  ) : s.ovulation ? (
                    <span>◇</span>
                  ) : s.fertile ? (
                    <span>○</span>
                  ) : null}
                  {l && (
                    <span className="log-dot" aria-hidden="true">
                      •
                    </span>
                  )}
                  {reminders.some((r) => r.date === k) && <span>♧</span>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="calendar-legend">
          <span>
            <Droplets size={14} />
            Recorded period
          </span>
          <span>
            <span className="legend-dash">~</span>Estimated period
          </span>
          <span>• Daily log</span>
          {settings.fertile && (
            <>
              <span>○ Broad fertile-window estimate</span>
              <span>◇ Calendar ovulation estimate</span>
            </>
          )}
          <span>♧ Personal reminder</span>
        </div>
      </Card>
      <Info>
        Predicted dates are estimates. An ongoing period is shown through today
        until you record its end. Spotting is a daily observation, not a cycle
        start.
      </Info>
      <Card>
        <div className="section-heading">
          <h2>Your period history</h2>
          <span className="tag">{periods.length} records</span>
        </div>
        {periods.length === 0 ? (
          <p className="muted">
            Your history starts with your first confirmed period. Historical
            records are welcome too.
          </p>
        ) : (
          [...periods]
            .sort((a, b) => b.start.localeCompare(a.start))
            .map((period) => (
              <button
                className="history-row"
                key={period.id}
                onClick={() => editPeriod(period)}
              >
                <span className="event-icon">
                  <Droplets size={18} />
                </span>
                <span>
                  <strong>{nice(period.start, settings.dateFormat)}</strong>
                  <small>
                    {period.end
                      ? `Through ${nice(period.end, settings.dateFormat)}`
                      : "Ongoing · tap to record an end date"}
                  </small>
                </span>
                <Edit3 size={17} />
              </button>
            ))
        )}
      </Card>
      {selected && (
        <Sheet
          title={nice(selected, "EEEE, MMMM d")}
          onClose={() => setSelected(null)}
        >
          <div className="date-summary">
            <span className="phase-tag">
              {currentPeriod
                ? "Recorded period"
                : status(selected).predicted
                  ? "Estimated period"
                  : "No confirmed period"}
            </span>
            {log?.flow && <p>Flow: {log.flow}</p>}
            {log?.mood && <p>Mood: {log.mood}</p>}
            {log && Object.keys(log.symptoms).length > 0 && (
              <p>
                Symptoms:{" "}
                {Object.entries(log.symptoms)
                  .map(([s, n]) => `${s} (${n}/5)`)
                  .join(", ")}
              </p>
            )}
            {log?.note && <p className="note-text">{log.note}</p>}
          </div>
          <div className="button-stack">
            <button
              className="button primary"
              onClick={() => {
                const d = selected;
                setSelected(null);
                editLog(d);
              }}
            >
              {log ? "Edit check-in" : "Add check-in or note"}
            </button>
            {selected <= today() && (
              <button
                className="button secondary"
                onClick={() => {
                  const d = selected;
                  setSelected(null);
                  editPeriod(currentPeriod, d);
                }}
              >
                {currentPeriod
                  ? "Edit / end period"
                  : "Start period on this day"}
              </button>
            )}
          </div>
          <hr />
          <h3>Personal reminder</h3>
          <p className="small muted">
            Shown in-app when you open Lunara. No closed-app delivery.
          </p>
          {reminders
            .filter((r) => r.date === selected)
            .map((r) => (
              <div className="severity" key={r.id}>
                <span>{r.text}</span>
                <button
                  className="text-button danger-text"
                  aria-label={`Remove reminder ${r.text}`}
                  onClick={() =>
                    void mutate(
                      () => db.reminders.delete(r.id),
                      "Reminder removed.",
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          <label>
            Reminder note
            <input
              maxLength={500}
              placeholder="Something to remember…"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
            />
          </label>
          <button
            className="button secondary full"
            disabled={!event.trim()}
            onClick={async () => {
              if (
                await mutate(
                  () =>
                    db.reminders.put({
                      id: crypto.randomUUID(),
                      date: selected,
                      text: event.trim(),
                    }),
                  "Reminder added.",
                )
              )
                setEvent("");
            }}
          >
            Add reminder
          </button>
        </Sheet>
      )}
    </>
  );
}
