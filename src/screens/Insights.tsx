import { useState } from "react";
import { ArrowDownToLine, Activity, Sparkles } from "lucide-react";
import { Card, PageTitle, Empty, Info, Sheet } from "../components/UI";
import { useStore } from "../core/store";
import { average, median, history, predict } from "../core/prediction";
import { nice, today } from "../core/dates";
import { download } from "../core/backup";
import { hasOwn } from "../core/compat";
function Chart({
  title,
  values,
  unit = "days",
}: {
  title: string;
  values: { date: string; length: number }[];
  unit?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(1, ...values.map((v) => v.length));
  return (
    <Card>
      <div className="section-heading">
        <Activity size={18} />
        <h2>{title}</h2>
      </div>
      {values.length === 0 ? (
        <Empty title="A little more history">
          Your recorded data will bring this chart to life.
        </Empty>
      ) : (
        <>
          <div className="bar-chart" role="group" aria-label={title}>
            {values.map((v, i) => (
              <button
                key={`${v.date}-${i}`}
                className={`chart-column ${selected === i ? "selected" : ""}`}
                aria-pressed={selected === i}
                aria-label={`${nice(v.date)}: ${v.length} ${unit}`}
                onClick={() => setSelected(selected === i ? null : i)}
              >
                <span className="bar-value">{v.length}</span>
                <span
                  className="bar"
                  style={{ height: `${Math.max(5, (v.length / max) * 120)}px` }}
                />
                <small>{nice(v.date, "MMM d")}</small>
              </button>
            ))}
          </div>
          <p className="chart-caption muted small">
            {selected !== null
              ? `${nice(values[selected].date)} · ${values[selected].length} ${unit}`
              : "Tap a bar to explore your history."}
          </p>
        </>
      )}
    </Card>
  );
}
export default function Insights() {
  const { periods, logs, settings } = useStore();
  const [filter, setFilter] = useState<{
    kind: "symptom" | "mood" | "flow" | "date";
    value: string;
  } | null>(null);
  const [window, setWindow] = useState("6"),
    [notes, setNotes] = useState(false);
  const all = history(periods),
    limit = window === "all" ? Infinity : +window;
  const intervals = all.lengths.slice(-limit),
    durations = all.durations.slice(-limit),
    vals = intervals.map((x) => x.length),
    p = predict(periods, settings);
  const first =
    limit === Infinity ? null : all.sorted.slice(-(limit + 1))[0]?.start;
  const relevantLogs = logs.filter((l) => !first || l.date >= first);
  const freq = new Map<string, number>();
  for (const l of relevantLogs)
    for (const s of Object.keys(l.symptoms))
      freq.set(s, (freq.get(s) ?? 0) + 1);
  const frequencies = [...freq.entries()].sort((a, b) => b[1] - a[1]);
  const moodCounts = Object.entries(
    relevantLogs.reduce(
      (a, l) => {
        if (l.mood) a[l.mood] = (a[l.mood] ?? 0) + 1;
        return a;
      },
      {} as Record<string, number>,
    ),
  );
  const flowCounts = Object.entries(
    relevantLogs.reduce(
      (a, l) => {
        if (l.flow) a[l.flow] = (a[l.flow] ?? 0) + 1;
        return a;
      },
      {} as Record<string, number>,
    ),
  );
  const selectedPeriods = all.sorted.slice(-limit);
  const association =
    frequencies[0] && selectedPeriods.length >= 3
      ? {
          name: frequencies[0][0],
          count: selectedPeriods.filter((period) =>
            relevantLogs.some(
              (l) =>
                l.date >= period.start &&
                l.date <= (period.end ?? today()) &&
                hasOwn(l.symptoms, frequencies[0][0]),
            ),
          ).length,
        }
      : null;
  function report() {
    const lines = [
      "LUNARA · PERSONAL MENSTRUAL HISTORY",
      `Created: ${nice(today(), settings.dateFormat)}`,
      `History window: ${window === "all" ? "All" : `Last ${window} cycles`}`,
      `Completed intervals: ${vals.length}`,
      `Average cycle length: ${average(vals)?.toFixed(1) ?? "Not available"} days`,
      `Median: ${median(vals) ?? "Not available"} days`,
      "",
      "PERIODS",
      ...selectedPeriods.map(
        (period) => `${period.start} → ${period.end ?? "Ongoing"}`,
      ),
      "",
      "DAILY OBSERVATIONS",
      ...relevantLogs
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(
          (l) =>
            `${l.date} | Flow: ${l.flow || "—"} | Mood: ${l.mood || "—"} | Symptoms: ${
              Object.entries(l.symptoms)
                .map(([s, n]) => `${s} ${n}/5`)
                .join(", ") || "—"
            }${notes && l.note ? ` | Note: ${l.note}` : ""}`,
        ),
      "",
      "Calendar forecasts cannot confirm ovulation or diagnose health conditions.",
    ];
    download(lines.join("\n"), `lunara-history-${today()}.txt`, "text/plain");
  }
  return (
    <>
      <PageTitle
        eyebrow="SMALL OBSERVATIONS, DEEPER UNDERSTANDING"
        title="Your patterns"
        description="A thoughtful look at what you’ve recorded."
      />
      <div className="insights-toolbar">
        <label className="compact-label">
          Compare history
          <select value={window} onChange={(e) => setWindow(e.target.value)}>
            <option value="3">Last 3 cycles</option>
            <option value="6">Last 6 cycles</option>
            <option value="12">Last 12 cycles</option>
            <option value="all">All history</option>
          </select>
        </label>
        <div>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={notes}
              onChange={(e) => setNotes(e.target.checked)}
            />
            Include notes in report
          </label>
          <button className="button secondary" onClick={report}>
            <ArrowDownToLine size={17} />
            Export report
          </button>
        </div>
      </div>
      <div className="stat-grid">
        {[
          {
            label: "Average cycle",
            value: average(vals)?.toFixed(1),
            unit: "days",
          },
          { label: "Median cycle", value: median(vals), unit: "days" },
          {
            label: "Shortest cycle",
            value: vals.length ? Math.min(...vals) : null,
            unit: "days",
          },
          {
            label: "Longest cycle",
            value: vals.length ? Math.max(...vals) : null,
            unit: "days",
          },
          {
            label: "Observed variation",
            value: vals.length ? Math.max(...vals) - Math.min(...vals) : null,
            unit: "days range",
          },
          {
            label: "Average period",
            value: average(durations.map((x) => x.length))?.toFixed(1),
            unit: "days",
          },
          { label: "Completed cycles", value: vals.length, unit: "intervals" },
          {
            label: "Daily check-ins",
            value: relevantLogs.length,
            unit: "recorded days",
          },
        ].map((stat) => (
          <Card key={stat.label} className="stat-card">
            <span className="muted small">{stat.label}</span>
            <strong>{stat.value ?? "—"}</strong>
            <span className="small muted">{stat.unit}</span>
          </Card>
        ))}
      </div>
      <div className="insight-grid">
        <Chart title="Cycle length over time" values={intervals} />
        <Chart title="Period duration" values={durations} />
        <Card>
          <div className="section-heading">
            <Sparkles size={18} />
            <h2>Symptoms you notice</h2>
          </div>
          {frequencies.length ? (
            <div className="frequency-list">
              {frequencies.map(([s, n]) => (
                <button
                  className="frequency-row"
                  key={s}
                  aria-label={`Explore ${s}: ${n} recorded days`}
                  onClick={() => setFilter({ kind: "symptom", value: s })}
                >
                  <span>{s}</span>
                  <div className="frequency-track">
                    <span
                      style={{
                        width: `${(n / Math.max(1, relevantLogs.length)) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>
                    {n} {n === 1 ? "day" : "days"}
                  </strong>
                </button>
              ))}
            </div>
          ) : (
            <Empty title="Your body, in your own words">
              Log symptoms to see how often you record them.
            </Empty>
          )}
        </Card>
        <Card>
          <div className="section-heading">
            <h2>Mood & flow observations</h2>
          </div>
          {moodCounts.length || flowCounts.length ? (
            <>
              <h3 className="small">Mood · recorded days</h3>
              <div className="chips">
                {moodCounts.map(([m, n]) => (
                  <button
                    className="chip static"
                    key={m}
                    onClick={() => setFilter({ kind: "mood", value: m })}
                  >
                    {m} · {n}
                  </button>
                ))}
              </div>
              <h3 className="small">Flow · recorded days</h3>
              <div className="chips">
                {flowCounts.map(([f, n]) => (
                  <button
                    className="chip static"
                    key={f}
                    onClick={() => setFilter({ kind: "flow", value: f })}
                  >
                    {f} · {n}
                  </button>
                ))}
              </div>
              <ChartInline
                onSelect={(day) => setFilter({ kind: "date", value: day })}
                values={relevantLogs
                  .filter((l) => l.flow)
                  .slice(-30)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((l) => ({
                    date: l.date,
                    length: { spotting: 1, light: 2, medium: 3, heavy: 4 }[
                      l.flow as "spotting" | "light" | "medium" | "heavy"
                    ],
                  }))}
              />
            </>
          ) : (
            <Empty title="Room for all your feelings">
              Your daily mood and flow logs will appear here.
            </Empty>
          )}
        </Card>
      </div>
      {association && (
        <Card className="pattern-card">
          <span className="eyebrow">FROM YOUR RECORDED HISTORY</span>
          <h2>
            {association.name} was recorded during {association.count} of{" "}
            {selectedPeriods.length} periods.
          </h2>
          <p className="muted">
            This describes your logs, including ongoing periods. Unlogged days
            are unknown; this association does not establish causation.
          </p>
        </Card>
      )}
      <Card>
        <div className="section-heading">
          <h2>How your forecast works</h2>
          <span className="tag">Transparent by design</span>
        </div>
        <p className="muted">
          {p.suppressed
            ? "Ordinary cycle forecasts are paused in your selected tracking mode."
            : "We blend the median and a recent-history weighted average of up to 12 recorded cycle intervals. The range reflects observed variation, with wider estimates for irregular cycles. It is not a statistically calibrated prediction interval."}
        </p>
        <p className="muted small">
          {p.provisional
            ? `With insufficient history, we use ${p.typical} days from ${p.assumed ? "a provisional assumption" : "your settings"}. Confidence is low.`
            : `${p.validCycles} intervals inform your forecast.`}{" "}
          {p.excluded > 0
            ? `${p.excluded} intervals were excluded: shorter than 15 days, longer than 90 days, or more than the greater of 15 days or 50% away from the median.`
            : "Intervals under 15 or over 90 days, and isolated extremes, do not influence the forecast. They remain visible in your history."}
        </p>
      </Card>
      {filter && (
        <Sheet
          title={
            filter.kind === "date"
              ? nice(filter.value)
              : `${filter.value} observations`
          }
          onClose={() => setFilter(null)}
        >
          <p className="muted small">
            Recorded days in your selected history window. Unlogged days are
            unknown.
          </p>
          {relevantLogs
            .filter((l) =>
              filter.kind === "date"
                ? l.date === filter.value
                : filter.kind === "symptom"
                  ? hasOwn(l.symptoms, filter.value)
                  : l[filter.kind] === filter.value,
            )
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((l) => (
              <div key={l.date} className="observation-row">
                <strong>{nice(l.date, settings.dateFormat)}</strong>
                <p className="muted small">
                  {l.mood && `Mood: ${l.mood}. `}
                  {l.flow && `Flow: ${l.flow}. `}
                  {Object.entries(l.symptoms)
                    .map(([name, n]) => `${name}: ${n}/5`)
                    .join(", ")}
                </p>
                {l.note && <p className="note-text small">{l.note}</p>}
              </div>
            ))}
        </Sheet>
      )}
      <Info>
        These are descriptive observations, not medical conclusions. Seek care
        for severe pain, unusually heavy bleeding, or symptoms that concern you.
      </Info>
    </>
  );
}
function ChartInline({
  values,
  onSelect,
}: {
  values: { date: string; length: number }[];
  onSelect: (date: string) => void;
}) {
  return (
    <div
      className="flow-trend"
      role="group"
      aria-label="Recent flow observations"
    >
      {values.map((v) => (
        <button
          key={v.date}
          onClick={() => onSelect(v.date)}
          title={`${v.date}: ${["", "spotting", "light", "medium", "heavy"][v.length]}`}
          aria-label={`${v.date}: ${["", "spotting", "light", "medium", "heavy"][v.length]}`}
          style={{ height: `${v.length * 10 + 24}px` }}
        />
      ))}
      <p className="small muted">
        Recent flow: low bars = spotting, high = heavy.
      </p>
    </div>
  );
}
