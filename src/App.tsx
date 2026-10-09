import { lazy, Suspense, useState } from "react";
import {
  Home as HomeIcon,
  CalendarDays,
  Plus,
  ChartNoAxesCombined,
  SlidersHorizontal,
  ShieldCheck,
  Moon,
  RefreshCw,
  Download,
} from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Store, useStore } from "./core/store";
import { today } from "./core/dates";
import { Brand, Sheet } from "./components/UI";
import { PeriodEditor } from "./components/PeriodEditor";
import type { Period } from "./core/types";
import Home from "./screens/Home";
import Onboarding from "./screens/Onboarding";
const Calendar = lazy(() => import("./screens/Calendar")),
  Log = lazy(() => import("./screens/Log")),
  Insights = lazy(() => import("./screens/Insights")),
  Settings = lazy(() => import("./screens/Settings"));
const tabs = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "log", label: "Log", icon: Plus },
  { id: "insights", label: "Insights", icon: ChartNoAxesCombined },
  { id: "settings", label: "Settings", icon: SlidersHorizontal },
];
function Shell() {
  const { loading, error, settings, toast, refresh, dirty, setDirty } =
      useStore(),
    [tab, setTab] = useState("home"),
    [selected, setSelected] = useState(today()),
    [focus, setFocus] = useState(""),
    [editor, setEditor] = useState<{ initial?: Period; start?: string } | null>(
      null,
    ),
    [install, setInstall] = useState(false);
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW();
  function go(target: string, section?: string) {
    if (dirty && !window.confirm("Discard your unsaved changes?")) return;
    setDirty(false);
    setTab(target);
    setFocus(section ?? "");
    if (target === "log") setSelected(today());
    window.scrollTo({ top: 0 });
  }
  if (loading)
    return (
      <div className="loading-screen">
        <Brand />
        <p>Making space for you…</p>
      </div>
    );
  if (error)
    return (
      <div className="loading-screen">
        <Brand />
        <p role="alert">{error}</p>
        <button className="button primary" onClick={() => void refresh()}>
          Retry storage
        </button>
      </div>
    );
  if (!settings.onboarded) return <Onboarding />;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <p className="brand-tagline">Your cycle. Your rhythm.</p>
        <nav aria-label="Main navigation">
          {tabs.map((t) => (
            <button
              key={t.id}
              aria-current={tab === t.id ? "page" : undefined}
              className={`nav-item ${tab === t.id ? "active" : ""}`}
              onClick={() => go(t.id)}
            >
              <t.icon size={21} strokeWidth={1.6} />
              <span>{t.label}</span>
              {tab === t.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-art" aria-hidden="true">
            <Moon size={30} strokeWidth={1} />
            <span>
              In your own time.
              <br />
              In your own rhythm.
            </span>
          </div>
          <button className="install-link" onClick={() => setInstall(true)}>
            <Download size={16} />
            Keep Lunara close
          </button>
          <span className="sidebar-privacy">
            <ShieldCheck size={13} />
            PRIVATE BY NATURE
          </span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="mobile-header">
          <Brand />
          <button
            className="icon-button"
            aria-label="Installation instructions"
            onClick={() => setInstall(true)}
          >
            <Download size={19} />
          </button>
        </header>
        <main id="main-content" className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Suspense fallback={<p className="muted">Opening your space…</p>}>
                {tab === "home" ? (
                  <Home go={go} period={() => setEditor({})} />
                ) : tab === "calendar" ? (
                  <Calendar
                    editPeriod={(initial, start) =>
                      setEditor({ initial, start })
                    }
                    editLog={(day) => {
                      setSelected(day);
                      setFocus("");
                      setTab("log");
                      window.scrollTo({ top: 0 });
                    }}
                  />
                ) : tab === "log" ? (
                  <Log
                    selected={selected}
                    onDateChange={setSelected}
                    focus={focus}
                  />
                ) : tab === "insights" ? (
                  <Insights />
                ) : (
                  <Settings />
                )}
              </Suspense>
            </motion.div>
          </AnimatePresence>
          <footer className="main-footer">
            <span>LUNARA · YOUR CYCLE. YOUR RHYTHM.</span>
            <span>
              <ShieldCheck size={12} /> Made for you, kept with you.
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {tabs.map((t) => (
          <button
            key={t.id}
            aria-current={tab === t.id ? "page" : undefined}
            className={tab === t.id ? "active" : ""}
            onClick={() => go(t.id)}
          >
            <span className={t.id === "log" ? "log-nav-icon" : ""}>
              <t.icon size={22} strokeWidth={1.7} />
            </span>
            <small>{t.label}</small>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {needRefresh && (
        <div className="update-banner" role="status">
          <span>A fresh version is ready. Save any open edits first.</span>
          <button onClick={() => void updateServiceWorker(true)}>
            <RefreshCw size={16} />
            Update
          </button>
        </div>
      )}
      {offlineReady && (
        <div className="offline-banner" role="status">
          <span>Lunara is ready to open offline.</span>
          <button
            className="text-button"
            onClick={() => setOfflineReady(false)}
          >
            Got it
          </button>
        </div>
      )}
      {editor && (
        <PeriodEditor
          initial={editor.initial}
          start={editor.start}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {install && (
        <Sheet title="Keep Lunara close" onClose={() => setInstall(false)}>
          <p>On your iPhone, open the deployed HTTPS app in Safari:</p>
          <ol className="install-steps">
            <li>Tap the Share button.</li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Enable <strong>Open as Web App</strong> if available.
            </li>
            <li>Tap Add, then open Lunara from its icon.</li>
          </ol>
          <p className="muted">
            Open online once and check offline access. Keep regular backups:
            clearing site data may remove records.
          </p>
        </Sheet>
      )}
    </div>
  );
}
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Store>
        <Shell />
      </Store>
    </MotionConfig>
  );
}
