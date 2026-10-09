import { useState, useRef, useEffect } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  Smartphone,
  Check,
  Palette,
  Bell,
  LockKeyhole,
  SlidersHorizontal,
  Info as InfoIcon,
} from "lucide-react";
import { Card, PageTitle, Info, Sheet, Brand } from "../components/UI";
import { useStore } from "../core/store";
import {
  modeLabels,
  type Settings as Preferences,
  type Backup,
} from "../core/types";
import { decodeBackup, download, encryptBackup } from "../core/backup";
import { exportData, importData, eraseData } from "../core/db";
import { today } from "../core/dates";
const goals = [
  "Predict upcoming periods",
  "Understand cycle patterns",
  "Track symptoms",
  "Monitor mood and energy",
  "Prepare for appointments",
  "Explore estimated phases",
];
export default function Settings() {
  const { settings, updateSettings, mutate, notify, setDirty } = useStore(),
    [form, setForm] = useState<Preferences>({ ...settings }),
    [busy, setBusy] = useState(false),
    [password, setPassword] = useState(""),
    [encrypted, setEncrypted] = useState(true),
    [incoming, setIncoming] = useState<Backup | null>(null),
    [importFile, setImportFile] = useState<unknown>(null),
    [replace, setReplace] = useState(false),
    [error, setError] = useState(""),
    [modal, setModal] = useState<
      "delete" | "install" | "unlock" | "about" | null
    >(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const dirty = JSON.stringify(form) !== JSON.stringify(settings);
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
  }, [form, settings, setDirty]);
  const patch = (s: Partial<Preferences>) => setForm({ ...form, ...s });
  async function save() {
    setBusy(true);
    try {
      await updateSettings(form);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  async function backup() {
    setBusy(true);
    setError("");
    try {
      const data = await exportData(),
        payload = encrypted ? await encryptBackup(data, password) : data;
      download(
        JSON.stringify(payload, null, 2),
        `lunara-backup-${today()}${encrypted ? "-encrypted" : ""}.json`,
      );
      notify("Backup prepared. Keep it somewhere safe.");
      setPassword("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function readFile(file?: File) {
    setError("");
    if (!file) return;
    if (file.size > 15000000) {
      setError("This backup is too large (15 MB maximum).");
      return;
    }
    try {
      const input: unknown = JSON.parse(await file.text());
      if (
        input &&
        typeof input === "object" &&
        "format" in input &&
        input.format === "lunara-encrypted"
      ) {
        setImportFile(input);
        setPassword("");
        setModal("unlock");
      } else {
        setIncoming(await decodeBackup(input, ""));
        setReplace(false);
      }
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "That file is not valid JSON. Your data is unchanged."
          : (e as Error).message,
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return (
    <>
      <PageTitle
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your Lunara"
        description="Personal, private, and always yours."
      />
      <div className="settings-grid">
        <Card>
          <div className="section-heading">
            <SlidersHorizontal size={20} />
            <h2>Your rhythm</h2>
          </div>
          <label>
            Preferred name
            <input
              value={form.name}
              maxLength={100}
              onChange={(e) => patch({ name: e.target.value })}
            />
          </label>
          <div className="two-fields">
            <label>
              Typical cycle
              <select
                value={form.cycleLength ?? ""}
                onChange={(e) =>
                  patch({
                    cycleLength: e.target.value ? +e.target.value : null,
                  })
                }
              >
                <option value="">Not sure</option>
                {Array.from({ length: 76 }, (_, i) => (
                  <option key={i} value={i + 15}>
                    {i + 15} days
                  </option>
                ))}
              </select>
            </label>
            <label>
              Typical period
              <select
                value={form.periodLength ?? ""}
                onChange={(e) =>
                  patch({
                    periodLength: e.target.value ? +e.target.value : null,
                  })
                }
              >
                <option value="">Not sure</option>
                {Array.from({ length: 15 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1} days
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Tracking mode
            <select
              value={form.mode}
              onChange={(e) =>
                patch({ mode: e.target.value as Preferences["mode"] })
              }
            >
              {Object.entries(modeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <p className="small muted">
            Ordinary forecasts are paused for contraception, pregnancy,
            postpartum, breastfeeding, and uncertain history. Irregular and
            perimenopausal cycles receive wider ranges.
          </p>
          <label className="toggle-row">
            Show broad fertile-window estimates
            <input
              type="checkbox"
              checked={form.fertile}
              onChange={(e) => patch({ fertile: e.target.checked })}
            />
          </label>
          {form.fertile && (
            <Info>
              Calendar estimates cannot confirm ovulation. Cycle predictions and
              fertile-window estimates must not be used as contraception.
            </Info>
          )}
          <details>
            <summary>Your tracking goals</summary>
            <div className="choices">
              {goals.map((g) => (
                <label key={g} className="inline-check">
                  <input
                    type="checkbox"
                    checked={form.goals.includes(g)}
                    onChange={(e) =>
                      patch({
                        goals: e.target.checked
                          ? [...form.goals, g]
                          : form.goals.filter((x) => x !== g),
                      })
                    }
                  />
                  {g}
                </label>
              ))}
            </div>
          </details>
        </Card>
        <Card>
          <div className="section-heading">
            <Palette size={20} />
            <h2>Feel & appearance</h2>
          </div>
          <label>
            Appearance
            <select
              value={form.theme}
              onChange={(e) =>
                patch({ theme: e.target.value as Preferences["theme"] })
              }
            >
              <option value="system">Match my device</option>
              <option value="light">Warm ivory · Light</option>
              <option value="dark">Evening plum · Dark</option>
            </select>
          </label>
          <label>
            First day of the week
            <select
              value={form.weekStart}
              onChange={(e) => patch({ weekStart: +e.target.value as 0 | 1 })}
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </label>
          <label>
            Date format
            <select
              value={form.dateFormat}
              onChange={(e) =>
                patch({
                  dateFormat: e.target.value as Preferences["dateFormat"],
                })
              }
            >
              <option value="MMM d, yyyy">Oct 9, 2026</option>
              <option value="dd/MM/yyyy">09/10/2026</option>
              <option value="MM/dd/yyyy">10/09/2026</option>
            </select>
          </label>
          <hr />
          <div className="section-heading">
            <Bell size={20} />
            <h2>Gentle reminders</h2>
          </div>
          <label className="toggle-row">
            Daily check-in
            <input
              type="checkbox"
              checked={form.dailyReminder}
              onChange={(e) => patch({ dailyReminder: e.target.checked })}
            />
          </label>
          <label>
            Check-in time
            <input
              type="time"
              value={form.reminderTime}
              onChange={(e) => {
                if (e.target.value) patch({ reminderTime: e.target.value });
              }}
            />
          </label>
          <label className="toggle-row">
            Period expected soon
            <input
              type="checkbox"
              checked={form.periodReminder}
              onChange={(e) => patch({ periodReminder: e.target.checked })}
            />
          </label>
          <p className="small muted">
            Reminders appear on Home when Lunara is open. Closed-app scheduled
            notifications are unavailable in this local-only version; they
            require a push backend.
          </p>
        </Card>
      </div>
      <div className="save-bar">
        <span className="muted small">
          Your preferences stay on this device.
        </span>
        <button
          className="button primary"
          disabled={busy}
          onClick={() => void save()}
        >
          <Check size={18} />
          Save preferences
        </button>
      </div>
      <div className="settings-grid">
        <Card>
          <div className="section-heading">
            <ShieldCheck size={20} />
            <h2>Your data, your control</h2>
          </div>
          <p className="muted">
            No account. No trackers. No health records sent to a server. Data is
            stored in this browser’s IndexedDB.
          </p>
          <Info>
            Browser storage can be cleared or evicted. Make regular backups and
            keep them in a safe place.
          </Info>
          <label className="toggle-row">
            Password-protected backup
            <input
              type="checkbox"
              checked={encrypted}
              onChange={(e) => setEncrypted(e.target.checked)}
            />
          </label>
          {encrypted && (
            <>
              <label>
                Backup password
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  value={password}
                  placeholder="At least 10 characters"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <p className="small muted">
                AES-256-GCM encryption, PBKDF2 key derivation. Keep your
                password separately: it cannot be recovered.
              </p>
            </>
          )}
          <div className="button-stack">
            <button
              className="button secondary"
              disabled={busy || (encrypted && password.length < 10)}
              onClick={() => void backup()}
            >
              <ArrowDownToLine size={17} />
              Export {encrypted ? "encrypted " : ""}backup
            </button>
            <button
              className="button secondary"
              onClick={() => fileRef.current?.click()}
            >
              <ArrowUpFromLine size={17} />
              Import a backup
            </button>
            <input
              type="file"
              ref={fileRef}
              accept="application/json,.json"
              className="visually-hidden"
              aria-label="Import backup file"
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <hr />
          <button
            className="text-button danger-text"
            onClick={() => setModal("delete")}
          >
            Delete all data & reset Lunara
          </button>
        </Card>
        <Card>
          <div className="section-heading">
            <LockKeyhole size={20} />
            <h2>Privacy without promises</h2>
          </div>
          <p className="muted">
            Backup files can be encrypted. Records inside this browser are not
            individually encrypted, and anyone with access to your unlocked
            device may access the app.
          </p>
          <p className="muted">
            Lunara does not offer a Face ID or passkey app lock. A web screen
            lock alone would not protect the underlying health database. Use
            your iPhone’s device lock and avoid shared devices.
          </p>
          <hr />
          <div className="section-heading">
            <Smartphone size={20} />
            <h2>A home on your iPhone</h2>
          </div>
          <p className="muted">
            Keep Lunara a tap away, with offline tracking and a calm,
            full-screen experience.
          </p>
          <button
            className="button secondary"
            onClick={() => setModal("install")}
          >
            iPhone installation guide
          </button>
          <hr />
          <button className="text-button" onClick={() => setModal("about")}>
            <InfoIcon size={17} />
            About Lunara · Version 1.0.0
          </button>
        </Card>
      </div>
      {incoming && (
        <Sheet title="Review your backup" onClose={() => setIncoming(null)}>
          <p>
            Validated backup from{" "}
            {new Date(incoming.exportedAt).toLocaleDateString()}.
          </p>
          <div className="backup-counts">
            <span>
              <strong>{incoming.periods.length}</strong> periods
            </span>
            <span>
              <strong>{incoming.logs.length}</strong> daily logs
            </span>
            <span>
              <strong>{incoming.reminders.length}</strong> reminders
            </span>
          </div>
          <label>
            Restore method
            <select
              value={replace ? "replace" : "merge"}
              onChange={(e) => setReplace(e.target.value === "replace")}
            >
              <option value="merge">Merge with existing records</option>
              <option value="replace">
                Replace all current records & preferences
              </option>
            </select>
          </label>
          <Info>
            {replace
              ? "This replaces all current health records and preferences. Export your current data first if you want to keep it."
              : "Matching IDs and daily dates will be updated from the backup; other records and current preferences are kept. Overlapping periods are rejected."}
          </Info>
          <p className="error" role="alert">
            {error}
          </p>
          <button
            className="button primary full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              if (
                await mutate(
                  () => importData(incoming, replace),
                  "Backup restored.",
                )
              ) {
                setIncoming(null);
                const data = await exportData();
                setForm(data.settings);
              } else
                setError(
                  "Could not restore. Check for overlapping periods or unavailable storage. Your existing records are unchanged.",
                );
              setBusy(false);
            }}
          >
            {replace ? "Confirm replacement" : "Confirm merge"}
          </button>
        </Sheet>
      )}
      {modal === "unlock" && (
        <Sheet
          title="Unlock your backup"
          onClose={() => {
            setModal(null);
            setPassword("");
            setError("");
          }}
        >
          <label>
            Backup password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <p className="small muted">
            Decryption happens on this device. Your password is never stored.
          </p>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button
            className="button primary full"
            disabled={!password || busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                setIncoming(await decodeBackup(importFile, password));
                setReplace(false);
                setModal(null);
                setPassword("");
                setImportFile(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            Unlock & preview
          </button>
        </Sheet>
      )}
      {modal === "delete" && (
        <Sheet title="Delete all personal data?" onClose={() => setModal(null)}>
          <p>
            This permanently removes your periods, daily logs, reminders, and
            preferences from Lunara on this device. Export a backup first if you
            might need them.
          </p>
          <p className="muted small">
            Downloaded backups and operating-system copies are outside Lunara’s
            control. The offline app shell contains no personal records.
          </p>
          <button
            className="button danger full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await mutate(
                () => eraseData(),
                "All local records have been deleted.",
              );
              setBusy(false);
            }}
          >
            Delete everything & reset
          </button>
          <button
            className="button secondary full"
            onClick={() => setModal(null)}
          >
            Keep my data
          </button>
        </Sheet>
      )}
      {modal === "install" && (
        <Sheet title="Lunara on your iPhone" onClose={() => setModal(null)}>
          <p>Open your deployed HTTPS Lunara address in Safari, then:</p>
          <ol className="install-steps">
            <li>Open Safari’s Share menu.</li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Enable <strong>Open as Web App</strong> if that option appears.
            </li>
            <li>
              Tap <strong>Add</strong>, then launch Lunara from its icon.
            </li>
          </ol>
          <Info>
            Open the app online once to cache its app shell. Your logs and
            backups stay on this device. Safari and an installed web app may use
            different storage containers; export and restore if needed.
          </Info>
          <p className="muted small">
            No Apple Developer membership is required. Test offline access
            before relying on it away from a connection.
          </p>
        </Sheet>
      )}
      {modal === "about" && (
        <Sheet title="About Lunara" onClose={() => setModal(null)}>
          <Brand />
          <p>Your cycle. Your rhythm.</p>
          <p className="muted">
            Version 1.0.0 · A local-first menstrual health companion.
          </p>
          <Info>
            Lunara provides calendar estimates and educational information, not
            medical advice, diagnosis, or treatment. It cannot confirm
            ovulation. Cycle predictions and fertile-window estimates must not
            be used as contraception.
          </Info>
          <p className="muted small">
            Contact a qualified healthcare professional about severe pain,
            unusually heavy bleeding, or other symptoms that concern you. Seek
            urgent care for an emergency.
          </p>
        </Sheet>
      )}
    </>
  );
}
