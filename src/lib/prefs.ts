// Local app preferences (reminder time, etc.)
// NOTE: the daily-note reminder is a stored preference only for now — there is
// no push/notification delivery system behind it yet. Stored locally so the
// UI is honest about what the user chose, and ready to wire to a real
// notification backend later.

const REMINDER_ENABLED_KEY = "bh-reminder-enabled";
const REMINDER_TIME_KEY = "bh-reminder-time";

export const REMINDER_TIMES = ["6:00", "6:30", "7:00", "7:30", "8:00"];

export function getReminderEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMINDER_ENABLED_KEY) !== "0";
}

export function setReminderEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_ENABLED_KEY, on ? "1" : "0");
}

export function getReminderTime(): string {
  if (typeof window === "undefined") return "7:00";
  return localStorage.getItem(REMINDER_TIME_KEY) ?? "7:00";
}

export function setReminderTime(t: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_TIME_KEY, t);
}
