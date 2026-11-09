/**
 * Nigerian filing deadlines used for 7, 3 and 1 day reminder emails.
 * Dates are calendar days in UTC. PIT and CIT are annual; VAT is quarterly.
 */

export const REMINDER_WINDOWS = [7, 3, 1] as const;

export type ReminderWindow = (typeof REMINDER_WINDOWS)[number];

export type ReminderFormType =
  | "PIT"
  | "CIT"
  | "VAT_Q1"
  | "VAT_Q2"
  | "VAT_Q3"
  | "VAT_Q4";

export type FilingDeadline = {
  formType: ReminderFormType;
  taxYear: number;
  deadlineDate: string;
  description: string;
};

export type DueReminder = FilingDeadline & {
  daysRemaining: ReminderWindow;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** PIT 31 Mar, CIT 30 Jun, VAT 21 Apr / 21 Jul / 21 Oct / 21 Jan of the next year. */
export function filingDeadlinesForTaxYear(taxYear: number): FilingDeadline[] {
  return [
    {
      formType: "PIT",
      taxYear,
      deadlineDate: isoDate(taxYear + 1, 3, 31),
      description: "Personal income tax return",
    },
    {
      formType: "CIT",
      taxYear,
      deadlineDate: isoDate(taxYear + 1, 6, 30),
      description: "Company income tax return",
    },
    {
      formType: "VAT_Q1",
      taxYear,
      deadlineDate: isoDate(taxYear, 4, 21),
      description: "VAT return, Q1",
    },
    {
      formType: "VAT_Q2",
      taxYear,
      deadlineDate: isoDate(taxYear, 7, 21),
      description: "VAT return, Q2",
    },
    {
      formType: "VAT_Q3",
      taxYear,
      deadlineDate: isoDate(taxYear, 10, 21),
      description: "VAT return, Q3",
    },
    {
      formType: "VAT_Q4",
      taxYear,
      deadlineDate: isoDate(taxYear + 1, 1, 21),
      description: "VAT return, Q4",
    },
  ];
}

export function utcTodayIso(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** Whole calendar days from today (YYYY-MM-DD) until deadlineDate. */
export function calendarDaysUntil(
  deadlineDate: string,
  todayIso: string,
): number {
  const today = Date.parse(`${todayIso}T00:00:00.000Z`);
  const due = Date.parse(`${deadlineDate}T00:00:00.000Z`);
  if (!Number.isFinite(today) || !Number.isFinite(due)) return Number.NaN;
  return Math.round((due - today) / 86_400_000);
}

export function isReminderWindow(days: number): days is ReminderWindow {
  return days === 7 || days === 3 || days === 1;
}

export function isReminderEmailEnabled(
  reminderEmailEnabled: boolean | undefined,
): boolean {
  return reminderEmailEnabled !== false;
}

/**
 * Deadlines whose due date is exactly 7, 3 or 1 calendar days from `nowMs`.
 * Looks at last year, this year and next year so year boundaries are covered.
 */
export function dueRemindersAt(nowMs: number): DueReminder[] {
  const todayIso = utcTodayIso(nowMs);
  const calendarYear = Number(todayIso.slice(0, 4));
  const years = [calendarYear - 1, calendarYear, calendarYear + 1];
  const due: DueReminder[] = [];
  for (const taxYear of years) {
    for (const deadline of filingDeadlinesForTaxYear(taxYear)) {
      const daysRemaining = calendarDaysUntil(deadline.deadlineDate, todayIso);
      if (!isReminderWindow(daysRemaining)) continue;
      due.push({ ...deadline, daysRemaining });
    }
  }
  due.sort(
    (a, b) =>
      a.deadlineDate.localeCompare(b.deadlineDate) ||
      a.formType.localeCompare(b.formType),
  );
  return due;
}
