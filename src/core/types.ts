export type DateKey = string;
export type Flow = "spotting" | "light" | "medium" | "heavy";
export type TrackingMode =
  | "standard"
  | "irregular"
  | "contraception"
  | "pregnancy"
  | "postpartum"
  | "breastfeeding"
  | "perimenopause"
  | "uncertain";
export interface Period {
  id: string;
  start: DateKey;
  end: DateKey | null;
}
export interface DailyLog {
  date: DateKey;
  flow: Flow | "";
  mood: string;
  symptoms: Record<string, number>;
  sleep: number | null;
  energy: number | null;
  stress: number | null;
  hydration: number | null;
  exercise: string;
  appetite: string;
  mucus: string;
  temperature: number | null;
  note: string;
}
export interface Reminder {
  id: string;
  date: DateKey;
  text: string;
}
export interface Settings {
  name: string;
  cycleLength: number | null;
  periodLength: number | null;
  mode: TrackingMode;
  theme: "system" | "light" | "dark";
  weekStart: 0 | 1;
  dateFormat: "MMM d, yyyy" | "dd/MM/yyyy" | "MM/dd/yyyy";
  fertile: boolean;
  dailyReminder: boolean;
  periodReminder: boolean;
  reminderTime: string;
  goals: string[];
  onboarded: boolean;
}
export interface Backup {
  version: 1;
  exportedAt: string;
  settings: Settings;
  periods: Period[];
  logs: DailyLog[];
  reminders: Reminder[];
}
export const defaultSettings: Settings = {
  name: "",
  cycleLength: 28,
  periodLength: 5,
  mode: "standard",
  theme: "system",
  weekStart: 1,
  dateFormat: "MMM d, yyyy",
  fertile: false,
  dailyReminder: false,
  periodReminder: false,
  reminderTime: "20:00",
  goals: [],
  onboarded: false,
};
export const emptyLog = (date: string): DailyLog => ({
  date,
  flow: "",
  mood: "",
  symptoms: {},
  sleep: null,
  energy: null,
  stress: null,
  hydration: null,
  exercise: "",
  appetite: "",
  mucus: "",
  temperature: null,
  note: "",
});
export const moods = [
  "Happy",
  "Calm",
  "Energetic",
  "Anxious",
  "Irritable",
  "Sad",
  "Emotional",
  "Stressed",
];
export const symptoms = [
  "Cramps",
  "Bloating",
  "Headache",
  "Breast tenderness",
  "Back pain",
  "Fatigue",
  "Nausea",
  "Acne",
  "Digestive changes",
  "Dizziness",
];
export const modeLabels: Record<TrackingMode, string> = {
  standard: "Regular cycles",
  irregular: "Irregular cycles",
  contraception: "Hormonal contraception",
  pregnancy: "Pregnancy",
  postpartum: "Postpartum",
  breastfeeding: "Breastfeeding",
  perimenopause: "Perimenopause",
  uncertain: "Uncertain history",
};
