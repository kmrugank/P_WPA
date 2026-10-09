import {
  Smile,
  Leaf,
  Zap,
  Wind,
  Cloud,
  CloudRain,
  Activity,
} from "lucide-react";
import { useEffect, useState, createElement } from "react";
import { Check, Plus, Heart, Droplets, Sparkles, Feather } from "lucide-react";
import { Card, PageTitle, Info } from "../components/UI";
import { useStore, db } from "../core/store";
import { emptyLog, moods, symptoms, type DailyLog } from "../core/types";
import { today, nice } from "../core/dates";
const moodFaces = [Smile, Leaf, Zap, Wind, Cloud, CloudRain, Heart, Activity];
export default function Log({
  selected,
  onDateChange,
  focus,
}: {
  selected: string;
  onDateChange: (date: string) => void;
  focus?: string;
}) {
  const { logs, mutate, setDirty } = useStore();
  const [draft, setDraft] = useState<DailyLog>(
      () => logs.find((l) => l.date === selected) ?? emptyLog(selected),
    ),
    [busy, setBusy] = useState(false),
    [custom, setCustom] = useState(""),
    [deleting, setDeleting] = useState(false);
  useEffect(() => {
    setDraft(logs.find((l) => l.date === selected) ?? emptyLog(selected));
    setDeleting(false);
  }, [selected, logs]);
  useEffect(() => {
    if (focus)
      document.getElementById(`log-${focus}`)?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "center",
      });
  }, [focus]);
  useEffect(() => {
    const saved = logs.find((l) => l.date === selected) ?? emptyLog(selected);
    const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
    setDirty(dirty);
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      setDirty(false);
      window.removeEventListener("beforeunload", warn);
    };
  }, [draft, logs, selected, setDirty]);
  const patch = (change: Partial<DailyLog>) =>
    setDraft({ ...draft, ...change });
  function toggle(symptom: string) {
    const next = { ...draft.symptoms };
    if (Object.hasOwn(next, symptom)) delete next[symptom];
    else
      Object.defineProperty(next, symptom, {
        value: 3,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    patch({ symptoms: next });
  }
  async function save() {
    setBusy(true);
    if (await mutate(() => db.logs.put(draft), "Your check-in is saved."))
      setDeleting(false);
    setBusy(false);
  }
  return (
    <>
      <PageTitle
        eyebrow="A MOMENT FOR YOU"
        title="Your daily check-in"
        description="Whatever today feels like, there’s room for it here."
      />
      <div className="date-strip">
        <span>{nice(selected, "EEEE, MMMM d")}</span>
        <label className="compact-label">
          Log date
          <input
            aria-label="Log date"
            type="date"
            value={selected}
            onChange={(e) => {
              if (e.target.value)
                if (
                  JSON.stringify(draft) ===
                    JSON.stringify(
                      logs.find((l) => l.date === selected) ??
                        emptyLog(selected),
                    ) ||
                  window.confirm("Discard your unsaved check-in?")
                )
                  onDateChange(e.target.value);
            }}
          />
        </label>
        {selected !== today() && (
          <button className="text-button" onClick={() => onDateChange(today())}>
            Today
          </button>
        )}
      </div>
      {selected > today() ? (
        <Info>
          Future dates are for notes and plans. Record health observations on or
          before today.
        </Info>
      ) : null}
      <div className="log-grid">
        <Card>
          <div className="section-heading">
            <Droplets size={20} />
            <h2>Flow</h2>
            <span className="tag">Optional</span>
          </div>
          <p className="muted small">
            Daily flow does not start a period. Use “Log period” to confirm a
            cycle start.
          </p>
          <div className="flow-options">
            {["", "spotting", "light", "medium", "heavy"].map((f, i) => (
              <button
                disabled={selected > today()}
                key={f}
                className={`flow-choice ${draft.flow === f ? "selected" : ""}`}
                aria-pressed={draft.flow === f}
                onClick={() => patch({ flow: f as DailyLog["flow"] })}
              >
                <Droplets size={18 + i * 2} />
                <span>{f || "None"}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="section-heading" id="log-mood">
            <Heart size={20} />
            <h2>Mood</h2>
            <span className="tag">No wrong answers</span>
          </div>
          <div className="mood-grid">
            {moods.map((m, i) => (
              <button
                disabled={selected > today()}
                key={m}
                aria-pressed={draft.mood === m}
                className={`mood-choice ${draft.mood === m ? "selected" : ""}`}
                onClick={() => patch({ mood: draft.mood === m ? "" : m })}
              >
                <span aria-hidden="true">
                  {createElement(moodFaces[i], { size: 24, strokeWidth: 1.3 })}
                </span>
                {m}
              </button>
            ))}
          </div>
        </Card>
        <Card className="wide">
          <div className="section-heading" id="log-symptoms">
            <Sparkles size={20} />
            <h2>Body & symptoms</h2>
          </div>
          <p className="muted small">
            Select what you notice, then set the intensity from 1 (mild) to 5
            (severe).
          </p>
          <div className="chips">
            {[
              ...symptoms,
              ...Object.keys(draft.symptoms).filter(
                (s) => !symptoms.includes(s),
              ),
            ].map((s) => (
              <button
                disabled={selected > today()}
                key={s}
                className={`chip ${Object.hasOwn(draft.symptoms, s) ? "selected" : ""}`}
                aria-pressed={Object.hasOwn(draft.symptoms, s)}
                onClick={() => toggle(s)}
              >
                {Object.hasOwn(draft.symptoms, s) && <Check size={14} />} {s}
              </button>
            ))}
          </div>
          {Object.entries(draft.symptoms).map(([s, n]) => (
            <div className="severity" key={s}>
              <span>{s}</span>
              <div className="rating" role="group" aria-label={`${s} severity`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    disabled={selected > today()}
                    aria-label={`${s}: ${i} of 5`}
                    aria-pressed={n === i}
                    className={n === i ? "selected" : ""}
                    onClick={() =>
                      patch({ symptoms: { ...draft.symptoms, [s]: i } })
                    }
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="inline-form">
            <input
              aria-label="Custom symptom"
              value={custom}
              maxLength={100}
              placeholder="Add your own symptom"
              onChange={(e) => setCustom(e.target.value)}
            />
            <button
              aria-label="Add custom symptom"
              className="icon-button"
              disabled={!custom.trim() || selected > today()}
              onClick={() => {
                const s = custom.trim();
                if (!Object.hasOwn(draft.symptoms, s))
                  patch({ symptoms: { ...draft.symptoms, [s]: 3 } });
                setCustom("");
              }}
            >
              <Plus size={20} />
            </button>
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <Feather size={20} />
            <h2>Daily rhythm</h2>
          </div>
          {(["sleep", "energy", "stress", "hydration"] as const).map(
            (field) => (
              <label key={field} className="range-label">
                <span>
                  {field === "sleep"
                    ? "Sleep quality"
                    : field === "energy"
                      ? "Energy level"
                      : field === "stress"
                        ? "Stress level"
                        : "Hydration"}
                </span>
                <select
                  disabled={selected > today()}
                  value={draft[field] ?? ""}
                  onChange={(e) =>
                    patch({ [field]: e.target.value ? +e.target.value : null })
                  }
                >
                  <option value="">Not recorded</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5{n === 1 ? " · Low" : n === 5 ? " · High" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ),
          )}
          <label>
            Exercise
            <input
              disabled={selected > today()}
              value={draft.exercise}
              maxLength={500}
              placeholder="A walk, a rest day…"
              onChange={(e) => patch({ exercise: e.target.value })}
            />
          </label>
          <label>
            Appetite
            <select
              disabled={selected > today()}
              value={draft.appetite}
              onChange={(e) => patch({ appetite: e.target.value })}
            >
              <option value="">Not recorded</option>
              {["Lower than usual", "As usual", "Higher than usual"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
        </Card>
        <Card>
          <div className="section-heading" id="log-note">
            <Feather size={20} />
            <h2>A note to yourself</h2>
          </div>
          <label>
            Personal notes
            <textarea
              rows={5}
              maxLength={10000}
              value={draft.note}
              placeholder="What would you like to remember?"
              onChange={(e) => patch({ note: e.target.value })}
            />
          </label>
          <details>
            <summary>Additional observations · optional</summary>
            <label>
              Basal body temperature (°C)
              <input
                type="number"
                disabled={selected > today()}
                step="0.01"
                min={30}
                max={45}
                value={draft.temperature ?? ""}
                onChange={(e) =>
                  patch({
                    temperature: e.target.value ? +e.target.value : null,
                  })
                }
              />
            </label>
            <label>
              Cervical mucus
              <select
                disabled={selected > today()}
                value={draft.mucus}
                onChange={(e) => patch({ mucus: e.target.value })}
              >
                <option value="">Not recorded</option>
                {["Dry", "Sticky", "Creamy", "Watery", "Egg-white"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <p className="small muted">
              These observations alone do not confirm ovulation.
            </p>
          </details>
        </Card>
      </div>
      <div className="save-bar">
        <span className="muted small">Stored privately on this device</span>
        <button
          className="button primary"
          disabled={
            busy ||
            (draft.temperature !== null &&
              (draft.temperature < 30 || draft.temperature > 45))
          }
          onClick={() => void save()}
        >
          <Check size={18} />
          {busy ? "Saving…" : "Save check-in"}
        </button>
      </div>
      {logs.some((l) => l.date === selected) &&
        (deleting ? (
          <div className="confirm">
            <p>Delete this day’s check-in? Period records will be kept.</p>
            <button
              className="button danger"
              onClick={async () => {
                if (
                  await mutate(
                    () => db.logs.delete(selected),
                    "Check-in removed.",
                  )
                )
                  setDeleting(false);
              }}
            >
              Confirm deletion
            </button>
            <button
              className="button secondary"
              onClick={() => setDeleting(false)}
            >
              Keep check-in
            </button>
          </div>
        ) : (
          <button
            className="text-button danger-text"
            onClick={() => setDeleting(true)}
          >
            Delete this check-in
          </button>
        ))}
    </>
  );
}
