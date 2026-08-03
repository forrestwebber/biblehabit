import { queuePush } from "./cloud-state";
// Local app preferences (reminder time, etc.)
// NOTE: the daily-note reminder is a stored preference only for now — there is
// no push/notification delivery system behind it yet. Stored locally so the
// UI is honest about what the user chose, and ready to wire to a real
// notification backend later.

const REMINDER_ENABLED_KEY = "bh-reminder-enabled";
const REMINDER_TIME_KEY = "bh-reminder-time";

// Morning AND evening (Forrest, 2026-08-02: "the reminders could be PM or AM").
// The product voice is "one quiet note", not a nag — plenty of people read at
// night, and offering only 6-8am quietly tells them they are doing it wrong.
export const REMINDER_TIMES = ["6:00", "7:00", "8:00", "12:00", "18:00", "20:00", "21:00", "22:00"];

/** "18:00" -> "6:00 PM". Stored values stay 24h so sorting and comparison work. */
export function formatReminderTime(t: string): string {
  const [hRaw, m] = t.split(":");
  const h = Number(hRaw);
  const suffix = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

export function getReminderEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(REMINDER_ENABLED_KEY) !== "0";
}

export function setReminderEnabled(on: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_ENABLED_KEY, on ? "1" : "0");
  queuePush(REMINDER_ENABLED_KEY);
}

export function getReminderTime(): string {
  if (typeof window === "undefined") return "7:00";
  return localStorage.getItem(REMINDER_TIME_KEY) ?? "7:00";
}

export function setReminderTime(t: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REMINDER_TIME_KEY, t);
  queuePush(REMINDER_TIME_KEY);
}
