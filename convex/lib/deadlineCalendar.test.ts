/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { getFilingDeadlines } from "../../src/lib/nrs-filing/deadline-manager";
import {
  calendarDaysUntil,
  dueRemindersAt,
  filingDeadlinesForTaxYear,
  isReminderEmailEnabled,
  lowestDueTier,
  reminderAppliesToEntity,
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

  it("uses monthly VAT due on the 21st of the following month", () => {
    const deadlines = filingDeadlinesForTaxYear(2026);
    expect(deadlines.find((d) => d.formType === "VAT_01")?.deadlineDate).toBe(
      "2026-02-21",
    );
    expect(deadlines.find((d) => d.formType === "VAT_03")?.deadlineDate).toBe(
      "2026-04-21",
    );
    expect(deadlines.find((d) => d.formType === "VAT_12")?.deadlineDate).toBe(
      "2027-01-21",
    );
    expect(deadlines.filter((d) => d.formType.startsWith("VAT_"))).toHaveLength(
      12,
    );
  });

  it("shares that calendar with the NRS deadline manager", () => {
    const convex = filingDeadlinesForTaxYear(2026);
    const nrs = getFilingDeadlines(2026);
    expect(nrs.map((d) => d.dueDate)).toEqual(convex.map((d) => d.deadlineDate));
    expect(nrs.filter((d) => d.taxType === "VAT").every((d) => d.frequency === "monthly")).toBe(
      true,
    );
  });
});

describe("reminderAppliesToEntity", () => {
  it("sends PIT to individuals and CIT to companies", () => {
    expect(reminderAppliesToEntity("PIT", "individual")).toBe(true);
    expect(reminderAppliesToEntity("PIT", "company")).toBe(false);
    expect(reminderAppliesToEntity("CIT", "company")).toBe(true);
    expect(reminderAppliesToEntity("CIT", "individual")).toBe(false);
    expect(reminderAppliesToEntity("VAT_03", "individual")).toBe(true);
    expect(reminderAppliesToEntity("VAT_03", "company")).toBe(true);
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

  it("catches up a missed window with only the lowest due tier", () => {
    expect(lowestDueTier(5)).toBe(7);
    expect(lowestDueTier(2)).toBe(3);
    expect(lowestDueTier(1)).toBe(1);
    expect(lowestDueTier(0)).toBe(null);
    expect(lowestDueTier(-1)).toBe(null);
    expect(lowestDueTier(8)).toBe(null);

    const five = dueRemindersAt(Date.parse("2027-03-26T08:00:00.000Z"));
    expect(five.filter((d) => d.formType === "PIT")).toEqual([
      expect.objectContaining({ formType: "PIT", daysRemaining: 7 }),
    ]);

    const two = dueRemindersAt(Date.parse("2027-03-29T08:00:00.000Z"));
    expect(two.filter((d) => d.formType === "PIT")).toEqual([
      expect.objectContaining({ formType: "PIT", daysRemaining: 3 }),
    ]);
  });

  it("matches CIT and monthly VAT windows", () => {
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
        formType: "VAT_03",
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

  it("does not re-fire a 7-day deadline as 1-day on the following Monday", () => {
    // Monday 24 Mar 2027: PIT due 31 Mar is exactly 7 days out.
    const firstMonday = dueRemindersAt(Date.parse("2027-03-24T07:00:00.000Z"));
    expect(
      firstMonday.find((row) => row.formType === "PIT")?.daysRemaining,
    ).toBe(7);

    // Next Monday is the due day (0 days left). That is not a 1-day nudge.
    // The 1-day template is only for deadlines 1 calendar day out.
    const dueMonday = dueRemindersAt(Date.parse("2027-03-31T07:00:00.000Z"));
    expect(dueMonday.filter((row) => row.formType === "PIT")).toEqual([]);
  });

  it("covers every coming-week deadline from a Monday 07:00 UTC run", () => {
    const monday = Date.parse("2026-04-20T07:00:00.000Z");
    expect(new Date(monday).getUTCDay()).toBe(1);

    const due = dueRemindersAt(monday);
    expect(due).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          formType: "VAT_03",
          taxYear: 2026,
          deadlineDate: "2026-04-21",
          daysRemaining: 1,
        }),
      ]),
    );

    const todayIso = utcTodayIso(monday);
    for (const year of [2025, 2026, 2027]) {
      for (const deadline of filingDeadlinesForTaxYear(year)) {
        const daysLeft = calendarDaysUntil(deadline.deadlineDate, todayIso);
        if (daysLeft >= 1 && daysLeft <= 7) {
          expect(due).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                formType: deadline.formType,
                deadlineDate: deadline.deadlineDate,
                daysRemaining: lowestDueTier(daysLeft),
              }),
            ]),
          );
        } else {
          expect(
            due.some(
              (row) =>
                row.formType === deadline.formType &&
                row.deadlineDate === deadline.deadlineDate,
            ),
          ).toBe(false);
        }
      }
    }
  });

  it("does not skip mid-week deadlines that miss the exact 7/3/1 day marks", () => {
    // Monday 16 Mar 2026; PIT 2025 is due 31 Mar 2026 (15 days — next week).
    // VAT_02 is due 21 Mar 2026, which is Saturday (5 days out).
    const monday = Date.parse("2026-03-16T07:00:00.000Z");
    expect(new Date(monday).getUTCDay()).toBe(1);
    const due = dueRemindersAt(monday);
    expect(due).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          formType: "VAT_02",
          taxYear: 2026,
          deadlineDate: "2026-03-21",
          daysRemaining: 7,
        }),
      ]),
    );
    expect(calendarDaysUntil("2026-03-21", "2026-03-16")).toBe(5);
    expect(due.some((row) => row.formType === "PIT")).toBe(false);
  });
});

describe("isReminderEmailEnabled", () => {
  it("defaults on when the field is missing", () => {
    expect(isReminderEmailEnabled(undefined)).toBe(true);
    expect(isReminderEmailEnabled(true)).toBe(true);
    expect(isReminderEmailEnabled(false)).toBe(false);
  });
});
