import { useEffect, useState, createElement } from "react";
import { Smile, Leaf, Cloud } from "lucide-react";
import { inAppReminders } from "../core/reminders";
import {
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Heart,
  Sparkles,
  Feather,
  ShieldCheck,
  Sun,
  Moon,
  Check,
  CalendarDays,
} from "lucide-react";
import { motion } from "motion/react";
import { Card, PageTitle, Info } from "../components/UI";
import { useStore, db } from "../core/store";
import { predict } from "../core/prediction";
import { nice, today, days } from "../core/dates";
import { emptyLog } from "../core/types";
export default function Home({
  go,
  period,
}: {
  go: (tab: string, focus?: string) => void;
  period: () => void;
}) {
  const { settings, periods, logs, reminders, mutate } = useStore();
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const update = () => setClock(new Date());
    const timer = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  const p = predict(periods, settings),
    now = today(),
    log = logs.find((l) => l.date === now);
  const hour = clock.getHours(),
    greeting =
      hour < 12
        ? "Good morning"
        : hour < 18
          ? "Good afternoon"
          : "Good evening";
  const progress = Math.min(1, Math.max(0, (p.cycleDay ?? 0) / p.typical));
  const circumference = 2 * Math.PI * 115;
  const reminderState = inAppReminders(
    settings,
    logs,
    reminders,
    p.daysUntil,
    clock,
  );
  const future = reminderState.upcoming;
  const moodLabels = ["Happy", "Calm", "Energetic", "Emotional", "Sad"],
    faces = [Smile, Leaf, Sparkles, Heart, Cloud];
  return (
    <>
      <PageTitle
        eyebrow={`${nice(now, "EEEE, MMMM d").toUpperCase()} · YOUR DAILY SPACE`}
        title={`${greeting}${settings.name ? `, ${settings.name}` : ""}.`}
        description="A little more in tune with you."
      >
        <div className="private-badge">
          <ShieldCheck size={15} />
          Private & on your device
        </div>
      </PageTitle>
      <div className="dashboard-grid">
        <Card className="cycle-card">
          <div className="card-kicker">
            <span className="eyebrow">YOUR RHYTHM, TODAY</span>
            <span className="phase-tag">
              <span />
              {p.phase}
            </span>
          </div>
          <div className="cycle-body">
            <div className="cycle-ring">
              <svg viewBox="0 0 280 280" aria-hidden="true">
                <defs>
                  <linearGradient
                    id="ring-gradient"
                    x1="0"
                    y1="1"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#D98F9D" />
                    <stop offset="100%" stopColor="#906681" />
                  </linearGradient>
                </defs>
                <circle cx="140" cy="140" r="115" className="ring-track" />
                <circle
                  cx="140"
                  cy="140"
                  r="115"
                  className="ring-ticks"
                  strokeDasharray="1 10"
                />
                <motion.circle
                  cx="140"
                  cy="140"
                  r="115"
                  className="ring-progress"
                  stroke="url(#ring-gradient)"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference * (1 - progress) }}
                  transition={{ duration: 1 }}
                  transform="rotate(-90 140 140)"
                />
              </svg>
              <div className="ring-text">
                <Moon size={18} strokeWidth={1} />
                <span className="eyebrow">
                  {p.cycleDay ? "CYCLE DAY" : "YOUR CYCLE"}
                </span>
                <strong>{p.cycleDay ?? "—"}</strong>
                <span className="muted">
                  {p.cycleDay
                    ? `of ~${p.typical} days`
                    : p.suppressed
                      ? "Logging, without forecasts"
                      : "Begins with your first log"}
                </span>
              </div>
            </div>
            <div className="forecast-copy">
              <span className="eyebrow">A LITTLE LOOK AHEAD</span>
              <h2>
                {p.suppressed ? (
                  "Space for your changing rhythm."
                ) : !p.next ? (
                  "Let’s get to know your cycle."
                ) : p.overdue ? (
                  "Your rhythm may be shifting."
                ) : p.daysUntil === 0 ? (
                  "Your period may start around now."
                ) : (
                  <>
                    Your next period <br />
                    in about <em>{p.daysUntil} days.</em>
                  </>
                )}
              </h2>
              <p className="muted">
                {p.earliest && p.latest ? (
                  <>
                    Estimated {nice(p.earliest, "MMM d")} –{" "}
                    {nice(p.latest, "MMM d")}
                    <br />
                    <span className="small">
                      {p.confidence} · A range, not a promise
                    </span>
                  </>
                ) : p.suppressed ? (
                  "Forecasts are paused for your tracking mode. Your daily logs are still here for you."
                ) : (
                  "Log a confirmed period to see a thoughtful estimate based on your history."
                )}
              </p>
              <button className="button primary" onClick={period}>
                <PlusIcon />
                Log period
                <ArrowUpRight size={17} />
              </button>
            </div>
          </div>
          <div className="cycle-foot">
            <span>
              <span className="tiny-dot" />{" "}
              {p.provisional
                ? "Learning your personal rhythm"
                : `${p.validCycles} recorded cycle intervals`}
            </span>
            <button className="text-button" onClick={() => go("insights")}>
              About your forecast <ArrowRight size={15} />
            </button>
          </div>
        </Card>
        <Card className="checkin-card">
          <div className="section-heading">
            <Sun size={19} />
            <span className="eyebrow">A MOMENT TO CHECK IN</span>
          </div>
          <h2>
            How are you <br />
            <em>feeling today?</em>
          </h2>
          <p className="muted small">Every feeling belongs here.</p>
          <div className="home-moods">
            {moodLabels.map((m, i) => (
              <button
                key={m}
                aria-label={`Feeling ${m.toLowerCase()}`}
                aria-pressed={log?.mood === m}
                className={log?.mood === m ? "selected" : ""}
                onClick={() =>
                  void mutate(
                    () =>
                      db.logs.put({
                        ...(log ?? emptyLog(now)),
                        mood: log?.mood === m ? "" : m,
                      }),
                    "Your mood is saved.",
                  )
                }
              >
                <span aria-hidden="true">
                  {createElement(faces[i], { size: 20, strokeWidth: 1.4 })}
                </span>
                <small>{m}</small>
              </button>
            ))}
          </div>
          <button className="checkin-link" onClick={() => go("log")}>
            {log ? (
              <>
                <Check size={16} /> Your check-in is here
              </>
            ) : (
              <>
                Make a little time for you
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </Card>
      </div>
      <div className="quick-actions">
        {[
          {
            title: "Log symptoms",
            sub: "Listen to your body",
            icon: Sparkles,
            focus: "symptoms",
          },
          {
            title: "Log mood",
            sub: "Notice how you feel",
            icon: Heart,
            focus: "mood",
          },
          {
            title: "Add a note",
            sub: "A thought to keep",
            icon: Feather,
            focus: "note",
          },
        ].map((a) => (
          <button
            key={a.title}
            className="quick-action"
            onClick={() => go("log", a.focus)}
          >
            <span className={`action-icon ${a.focus}`}>
              <a.icon size={21} strokeWidth={1.5} />
            </span>
            <span>
              <strong>{a.title}</strong>
              <small>{a.sub}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      <div className="home-bottom">
        <Card>
          <div className="section-heading">
            <CalendarDays size={19} />
            <h2>On the horizon</h2>
            <button className="text-button" onClick={() => go("calendar")}>
              Calendar
              <ArrowRight size={15} />
            </button>
          </div>
          {p.next ? (
            <div className="upcoming-row">
              <span className="event-icon">
                <Droplets size={20} />
              </span>
              <div>
                <strong>Next period · estimated</strong>
                <p className="muted small">
                  {nice(p.earliest!, "MMM d")} – {nice(p.latest!, "MMM d")}
                  {p.overdue ? " · Waiting for a new record" : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="muted">
              Your upcoming estimates will appear after your first period log.
            </p>
          )}
          {reminderState.periodDue && (
            <div className="reminder-note">
              Your Lunara reminder is ready. Your period may be approaching.
            </div>
          )}
          {reminderState.dailyDue && (
            <div className="reminder-note">
              Your gentle daily check-in reminder.
            </div>
          )}
          {future.map((r) => (
            <div className="upcoming-row" key={r.id}>
              <span className="event-icon sage">
                <Feather size={18} />
              </span>
              <div>
                <strong>{r.text || "Personal reminder"}</strong>
                <p className="muted small">
                  {nice(r.date, settings.dateFormat)} · In-app
                </p>
              </div>
            </div>
          ))}
          <p className="muted small">
            A quiet heads-up, whenever you open Lunara.
          </p>
        </Card>
        <Card className="daily-insight">
          <div className="eyebrow">
            <Sparkles size={15} /> A LITTLE UNDERSTANDING
          </div>
          <h2>
            Your rhythm doesn’t
            <br />
            have to be <em>perfect.</em>
          </h2>
          <p>
            Cycles can change with sleep, stress, life stages, and more.
            Noticing your own patterns is more useful than chasing a “textbook”
            cycle.
          </p>
          <span className="education-label">
            GENERAL EDUCATION · NOT A PERSONAL MEDICAL FINDING
          </span>
        </Card>
      </div>
      <Info>
        Phase estimates are simplified calendar models. They cannot confirm
        ovulation or hormone levels, and must not be used as contraception.
      </Info>
    </>
  );
}
function PlusIcon() {
  return (
    <span className="plus-sign" aria-hidden="true">
      +
    </span>
  );
}
