import { useState } from "react";
import { Sheet, Info } from "./UI";
import { useStore, db } from "../core/store";
import { today } from "../core/dates";
import { validatePeriod } from "../core/db";
import { uid } from "../core/compat";
import type { Period } from "../core/types";
export function PeriodEditor({
  initial,
  start,
  onClose,
}: {
  initial?: Period;
  start?: string;
  onClose: () => void;
}) {
  const { periods, mutate } = useStore();
  const [begin, setBegin] = useState(initial?.start ?? start ?? today()),
    [end, setEnd] = useState(initial?.end ?? ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [remove, setRemove] = useState(false);
  async function save() {
    setBusy(true);
    setError("");
    const period = {
      id: initial?.id ?? uid(),
      start: begin,
      end: end || null,
    };
    try {
      if (!begin) throw new Error("Choose a start date.");
      validatePeriod(period, periods, today());
      if (
        await mutate(
          () => db.periods.put(period),
          "Period saved. Your forecast has been updated.",
        )
      )
        onClose();
      else
        setError(
          "Could not save the period. Check device storage and try again.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Sheet title={initial ? "Edit period" : "Log a period"} onClose={onClose}>
      <p className="muted">
        Record confirmed menstrual bleeding. Spotting can be recorded separately
        in your daily log.
      </p>
      <label>
        First day
        <input
          type="date"
          value={begin}
          max={today()}
          required
          onChange={(e) => setBegin(e.target.value)}
        />
      </label>
      <label>
        Last day <span className="muted">(leave blank if ongoing)</span>
        <input
          type="date"
          value={end}
          min={begin}
          max={today()}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>
      <Info>
        An ongoing period remains open until you record its last day. We never
        create period entries from predictions.
      </Info>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button
        className="button primary full"
        disabled={busy}
        onClick={() => void save()}
      >
        {busy ? "Saving…" : "Save period"}
      </button>
      {initial &&
        (remove ? (
          <div className="confirm">
            <p>Delete this period? Daily logs will be kept.</p>
            <button
              className="button danger"
              onClick={async () => {
                if (
                  await mutate(
                    () => db.periods.delete(initial.id),
                    "Period removed.",
                  )
                )
                  onClose();
              }}
            >
              Confirm deletion
            </button>
            <button
              className="button secondary"
              onClick={() => setRemove(false)}
            >
              Keep period
            </button>
          </div>
        ) : (
          <button
            className="text-button danger-text"
            onClick={() => setRemove(true)}
          >
            Delete this period
          </button>
        ))}
    </Sheet>
  );
}
