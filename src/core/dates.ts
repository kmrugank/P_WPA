import {
  addDays,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
} from "date-fns";
export const today = () => format(new Date(), "yyyy-MM-dd");
export const date = (key: string) => parseISO(key);
export const key = (value: Date) => format(value, "yyyy-MM-dd");
export const add = (value: string, days: number) =>
  key(addDays(date(value), days));
export const days = (later: string, earlier: string) =>
  differenceInCalendarDays(date(later), date(earlier));
export const validDate = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  isValid(parseISO(value)) &&
  key(parseISO(value)) === value;
export const nice = (value: string, pattern = "MMM d, yyyy") =>
  format(date(value), pattern);
