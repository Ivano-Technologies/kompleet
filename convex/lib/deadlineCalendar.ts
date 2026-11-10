/**
 * Nigerian filing deadlines used for 7, 3 and 1 day reminder emails.
 * Dates are calendar days in UTC. PIT and CIT are annual; VAT is monthly,
 * due on the 21st of the following month (same calendar as
 * src/lib/nrs-filing/deadline-manager.ts).
 */

export const REMINDER_WINDOWS = [7, 3, 1] as const;

export type ReminderWindow = (typeof REMINDER_WINDOWS)[number];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export type ReminderFormType = "PIT" | "CIT" | `VAT_${string}`;

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

function vatDeadlinesForTaxYear(taxYear: number): FilingDeadline[] {
  const deadlines: FilingDeadline[] = [];
  for (let month = 1; month <= 12; month++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const year = month === 12 ? taxYear + 1 : taxYear;
    deadlines.push({
      formType: `VAT_${pad2(month)}`,
      taxYear,
      deadlineDate: isoDate(year, nextMonth, 21),
      description: `VAT Return, ${MONTH_NAMES[month - 1]} ${taxYear}`,
    });
  }
  return deadlines;
}

/** PIT 31 Mar, CIT 30 Jun, VAT the 21st of the month after the return month. */
export function filingDeadlinesForTaxYear(taxYear: number): FilingDeadline[] {
  return [
    {
      formType: "PIT",
      taxYear,
      deadlineDate: isoDate(taxYear + 1, 3, 31),
      description: "Personal Income Tax Return",
    },
    {
      formType: "CIT",
      taxYear,
      deadlineDate: isoDate(taxYear + 1, 6, 30),
      description: "Company Income Tax Return",
    },
    ...vatDeadlinesForTaxYear(taxYear),
  ];
}

/** PIT is for individuals, CIT for companies. VAT goes to both. */
export function reminderAppliesToEntity(
  formType: string,
  entityType: "individual" | "company",
): boolean {
  if (formType === "PIT") return entityType === "individual";
  if (formType === "CIT") return entityType === "company";
  return true;
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

/**
 * Catch-up window: send when days left is at most 7, 3 or 1, using only the
 * lowest due tier so a late cron does not fire several emails at once.
 * The weekly Monday job relies on this 0–7 day span to cover every deadline
 * due in the coming week, not only those that land on an exact 7/3/1 mark.
 */
export function lowestDueTier(daysLeft: number): ReminderWindow | null {
  if (!Number.isFinite(daysLeft) || daysLeft < 0) return null;
  if (daysLeft <= 1) return 1;
  if (daysLeft <= 3) return 3;
  if (daysLeft <= 7) return 7;
  return null;
}

export function isReminderEmailEnabled(
  reminderEmailEnabled: boolean | undefined,
): boolean {
  return reminderEmailEnabled !== false;
}

/**
 * Deadlines due within the next 7 calendar days of `nowMs` (the coming week
 * from the Monday 07:00 UTC cron). Exact 7, 3 and 1 day marks catch up to
 * the lowest due tier so a weekly run does not skip mid-week dues.
 * Looks at last year, this year and next year so year boundaries are covered.
 */
export function dueRemindersAt(nowMs: number): DueReminder[] {
  const todayIso = utcTodayIso(nowMs);
  const calendarYear = Number(todayIso.slice(0, 4));
  const years = [calendarYear - 1, calendarYear, calendarYear + 1];
  const due: DueReminder[] = [];
  for (const taxYear of years) {
    for (const deadline of filingDeadlinesForTaxYear(taxYear)) {
      const daysLeft = calendarDaysUntil(deadline.deadlineDate, todayIso);
      const daysRemaining = lowestDueTier(daysLeft);
      if (daysRemaining === null) continue;
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
