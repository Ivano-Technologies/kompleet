/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  calendarDaysUntil,
  dueRemindersAt,
  filingDeadlinesForTaxYear,
  isReminderEmailEnabled,
  utcTodayIso,
} from "./deadlineCalendar";

describe("filing deadlines", () => {
  it("uses PIT 31 Mar and CIT 30 Jun of the following year", () => {
    const deadlines = filingDeadlinesForTaxYear(2026);
    expect(deadlines.find((d) => d.formType === "PIT")?.deadlineDate).toBe(
      "2027-03-31",
    );
    expect(deadlines.find((d) => d.formType === "CIT")?.deadlineDate).toBe(
      "2027-06-30",
    );
  });

  it("uses quarterly VAT due on the 21st after each quarter", () => {
    const deadlines = filingDeadlinesForTaxYear(2026);
    expect(deadlines.find((d) => d.formType === "VAT_Q1")?.deadlineDate).toBe(
      "2026-04-21",
    );
    expect(deadlines.find((d) => d.formType === "VAT_Q2")?.deadlineDate).toBe(
      "2026-07-21",
    );
    expect(deadlines.find((d) => d.formType === "VAT_Q3")?.deadlineDate).toBe(
      "2026-10-21",
    );
    expect(deadlines.find((d) => d.formType === "VAT_Q4")?.deadlineDate).toBe(
      "2027-01-21",
    );
  });
});

describe("calendarDaysUntil", () => {
  it("counts whole UTC days", () => {
    expect(calendarDaysUntil("2027-03-31", "2027-03-24")).toBe(7);
    expect(calendarDaysUntil("2027-03-31", "2027-03-28")).toBe(3);
    expect(calendarDaysUntil("2027-03-31", "2027-03-30")).toBe(1);
    expect(calendarDaysUntil("2027-03-31", "2027-03-31")).toBe(0);
  });
});

describe("dueRemindersAt", () => {
  it("matches the 7, 3 and 1 day windows only", () => {
    const seven = dueRemindersAt(Date.parse("2027-03-24T08:00:00.000Z"));
    expect(seven).toEqual([
      expect.objectContaining({
        formType: "PIT",
        taxYear: 2026,
        deadlineDate: "2027-03-31",
        daysRemaining: 7,
      }),
    ]);

    const three = dueRemindersAt(Date.parse("2027-03-28T08:00:00.000Z"));
    expect(three.map((d) => d.daysRemaining)).toEqual([3]);
    expect(three[0]?.formType).toBe("PIT");

    const one = dueRemindersAt(Date.parse("2027-03-30T08:00:00.000Z"));
    expect(one.map((d) => d.daysRemaining)).toEqual([1]);

    const dueDay = dueRemindersAt(Date.parse("2027-03-31T08:00:00.000Z"));
    expect(dueDay.filter((d) => d.formType === "PIT")).toEqual([]);
  });

  it("matches CIT and VAT quarterly windows", () => {
    const cit = dueRemindersAt(Date.parse("2027-06-23T08:00:00.000Z"));
    expect(cit).toEqual([
      expect.objectContaining({
        formType: "CIT",
        taxYear: 2026,
        daysRemaining: 7,
      }),
    ]);

    const vat = dueRemindersAt(Date.parse("2026-04-14T08:00:00.000Z"));
    expect(vat).toEqual([
      expect.objectContaining({
        formType: "VAT_Q1",
        taxYear: 2026,
        deadlineDate: "2026-04-21",
        daysRemaining: 7,
      }),
    ]);
  });

  it("uses the UTC date, not the local clock", () => {
    expect(utcTodayIso(Date.parse("2027-03-24T23:30:00.000Z"))).toBe(
      "2027-03-24",
    );
  });
});

describe("isReminderEmailEnabled", () => {
  it("defaults on when the field is missing", () => {
    expect(isReminderEmailEnabled(undefined)).toBe(true);
    expect(isReminderEmailEnabled(true)).toBe(true);
    expect(isReminderEmailEnabled(false)).toBe(false);
  });
});
