import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { db, readData, saveSettings } from "./db";
import {
  defaultSettings,
  type DailyLog,
  type Period,
  type Settings,
  type Reminder,
} from "./types";
interface State {
  settings: Settings;
  periods: Period[];
  logs: DailyLog[];
  reminders: Reminder[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  updateSettings: (s: Settings) => Promise<void>;
  mutate: (
    operation: () => Promise<unknown>,
    message?: string,
  ) => Promise<boolean>;
  dirty: boolean;
  setDirty: (value: boolean) => void;
  toast: string;
  notify: (s: string) => void;
}
const Context = createContext<State | null>(null);
export function Store({ children }: { children: ReactNode }) {
  const [data, setData] = useState({
    settings: { ...defaultSettings },
    periods: [] as Period[],
    logs: [] as DailyLog[],
    reminders: [] as Reminder[],
  });
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [dirty, setDirty] = useState(false);
  const refresh = useCallback(async () => {
    try {
      setData(await readData());
      setError("");
    } catch {
      setError(
        "Your local storage could not be opened. Check Safari’s storage settings, then retry. Your data has not been replaced.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const change = () => {
      const dark =
        data.settings.theme === "dark" ||
        (data.settings.theme === "system" &&
          matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? "#201C25" : "#FFF9F6");
    };
    const mq = matchMedia("(prefers-color-scheme: dark)");
    change();
    mq.addEventListener("change", change);
    return () => mq.removeEventListener("change", change);
  }, [data.settings.theme]);
  const mutate = async (
    operation: () => Promise<unknown>,
    message = "Saved, just for you.",
  ) => {
    try {
      await operation();
      const current = await readData();
      setData(current);
      setToast(message);
      return true;
    } catch (e) {
      setToast(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
      return false;
    }
  };
  const updateSettings = async (s: Settings) => {
    if (!(await mutate(() => saveSettings(s), "Preferences saved.")))
      throw new Error("Preferences could not be saved.");
  };
  return (
    <Context.Provider
      value={{
        ...data,
        loading,
        error,
        refresh,
        updateSettings,
        mutate,
        dirty,
        setDirty,
        toast,
        notify: setToast,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const c = useContext(Context);
  if (!c) throw new Error("Store missing");
  return c;
}
export { db };
