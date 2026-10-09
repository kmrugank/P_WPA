import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Moon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Brand, Info } from "../components/UI";
import { useStore, db } from "../core/store";
import { today } from "../core/dates";
import { saveSettings, validatePeriod } from "../core/db";
import { uid } from "../core/compat";
const goals = [
  "Predict upcoming periods",
  "Understand cycle patterns",
  "Track symptoms",
  "Monitor mood and energy",
  "Prepare for appointments",
  "Explore estimated phases",
];
export default function Onboarding() {
  const { settings, periods, mutate } = useStore();
  const [step, setStep] = useState(0),
    [form, setForm] = useState({ ...settings }),
    [last, setLast] = useState(""),
    [busy, setBusy] = useState(false);
  const titles = [
    "A little closer\nto yourself.",
    "What should we call you?",
    "Let’s find your starting point.",
    "Every body has its rhythm.",
    "Your cycle, on your terms.",
    "What brings you here?",
    "A gentle nudge, if you like.",
    "Your health information\nbelongs to you.",
    "Welcome to your rhythm.",
  ];
  async function finish() {
    setBusy(true);
    const ok = await mutate(
      () =>
        db.transaction("rw", db.preferences, db.periods, async () => {
          await saveSettings({ ...form, onboarded: true });
          if (last) {
            const period = { id: uid(), start: last, end: null };
            validatePeriod(period, periods, today());
            await db.periods.put(period);
          }
        }),
      "Welcome to Lunara.",
    );
    if (!ok) setBusy(false);
  }
  return (
    <main className="onboarding">
      <div className="onboard-top">
        <Brand />
        <span className="eyebrow">YOUR CYCLE. YOUR RHYTHM.</span>
      </div>
      <div className="onboard-layout">
        <div className="onboard-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="moon-sculpture">
            <Moon size={110} strokeWidth={0.5} />
          </div>
          <span className="art-note">A SPACE TO KNOW YOURSELF</span>
          <Sparkles className="art-star" size={24} />
        </div>
        <div className="onboard-form">
          <div className="eyebrow">
            {step === 0
              ? "WELCOME TO LUNARA"
              : `${String(step).padStart(2, "0")} / 08 · MADE FOR YOU`}
          </div>
          <h1>
            {titles[step].split("\n").map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          {step === 0 && (
            <>
              <p className="intro">
                Understand your cycle, discover your patterns, and feel more
                prepared every day.
              </p>
              <Info>
                Private by nature. No accounts, no tracking, just you.
              </Info>
            </>
          )}
          {step === 1 && (
            <>
              <p className="muted">
                A preferred name makes this space feel a little more yours. It’s
                entirely optional.
              </p>
              <label>
                Preferred name
                <input
                  autoComplete="given-name"
                  maxLength={100}
                  value={form.name}
                  placeholder="Your name, if you like"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
            </>
          )}
          {step === 2 && (
            <>
              <p className="muted">
                When did your last period begin? You can correct this later.
                Leave it blank if you’re unsure.
              </p>
              <label>
                First day of your last period
                <input
                  type="date"
                  max={today()}
                  value={last}
                  onChange={(e) => setLast(e.target.value)}
                />
              </label>
              <Info>
                We’ll record the start only. Add the end date in Calendar when
                you’re ready.
              </Info>
            </>
          )}
          {step === 3 && (
            <>
              <p className="muted">
                How many days does your period usually last?
              </p>
              <label>
                Typical duration
                <select
                  value={form.periodLength ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      periodLength: e.target.value ? +e.target.value : null,
                    })
                  }
                >
                  <option value="">I’m not sure</option>
                  {Array.from({ length: 15 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      {i + 1} days
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {step === 4 && (
            <>
              <p className="muted">
                Count from the first day of one period to the first day of the
                next. Your forecast will learn from your own history.
              </p>
              <label>
                Typical cycle length
                <select
                  value={form.cycleLength ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      cycleLength: e.target.value ? +e.target.value : null,
                    })
                  }
                >
                  <option value="">I’m not sure</option>
                  {Array.from({ length: 76 }, (_, i) => (
                    <option key={i} value={i + 15}>
                      {i + 15} days
                    </option>
                  ))}
                </select>
              </label>
              <Info>
                28 days is a starting suggestion, not a rule for your body.
              </Info>
            </>
          )}
          {step === 5 && (
            <>
              <p className="muted">
                Choose anything that feels useful. You can change these later.
              </p>
              <div className="choices">
                {goals.map((g) => (
                  <button
                    className={`choice ${form.goals.includes(g) ? "selected" : ""}`}
                    aria-pressed={form.goals.includes(g)}
                    key={g}
                    onClick={() =>
                      setForm({
                        ...form,
                        goals: form.goals.includes(g)
                          ? form.goals.filter((x) => x !== g)
                          : [...form.goals, g],
                      })
                    }
                  >
                    {g}
                    {form.goals.includes(g) && <Check size={17} />}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 6 && (
            <>
              <p className="muted">
                In-app reminders appear when you open Lunara. They won’t notify
                you while the app is closed.
              </p>
              <label className="toggle-row">
                Daily check-in reminder
                <input
                  type="checkbox"
                  checked={form.dailyReminder}
                  onChange={(e) =>
                    setForm({ ...form, dailyReminder: e.target.checked })
                  }
                />
              </label>
              <label className="toggle-row">
                Upcoming period reminder
                <input
                  type="checkbox"
                  checked={form.periodReminder}
                  onChange={(e) =>
                    setForm({ ...form, periodReminder: e.target.checked })
                  }
                />
              </label>
              <p className="small muted">
                No notification permission is needed for in-app reminders.
              </p>
            </>
          )}
          {step === 7 && (
            <>
              <p className="intro">
                Your records stay in this browser on this device. Lunara has no
                account, analytics, or health-data server.
              </p>
              <Info>
                Clearing browser data, resetting your device, or removing the
                app may erase your records. Export backups regularly. Optional
                password-protected backups are available.
              </Info>
              <p className="small muted">
                Forecasts are estimates, not a diagnosis. Cycle predictions and
                fertile-window estimates must not be used as contraception.
              </p>
            </>
          )}
          {step === 8 && (
            <>
              <div className="welcome-check">
                <ShieldCheck size={30} />
              </div>
              <p className="intro">
                {form.name ? `${form.name}, this` : "This"} is your space to
                notice, reflect, and understand. One day at a time.
              </p>
              <p className="muted">
                You don’t need perfect logs. Start wherever you are.
              </p>
            </>
          )}
          <div className="onboard-actions">
            {step > 0 && (
              <button
                className="icon-button"
                aria-label="Previous onboarding step"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <button
              className="button primary"
              disabled={busy}
              onClick={() => (step === 8 ? void finish() : setStep(step + 1))}
            >
              {step === 0
                ? "Get started"
                : step === 8
                  ? busy
                    ? "Saving…"
                    : "Meet your Lunara"
                  : "Continue"}
              <ArrowRight size={18} />
            </button>
          </div>
          <div
            className="step-dots"
            role="group"
            aria-label={`Step ${step + 1} of 9`}
          >
            {titles.map((_, i) => (
              <span className={i === step ? "active" : ""} key={i} />
            ))}
          </div>
        </div>
      </div>
      <footer className="onboard-footer">
        GENTLE BY DESIGN. PRIVATE BY DEFAULT.
      </footer>
    </main>
  );
}
