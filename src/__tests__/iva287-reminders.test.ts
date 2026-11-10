import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

describe("IVA-287 reminder emails and year migration", () => {
  it("settings only claims deadline emails that persist", () => {
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    expect(modal).toMatch(/Deadline emails/);
    expect(modal).toMatch(/Email me 7, 3 and 1 days before a filing deadline/);
    expect(modal).toMatch(/\/api\/notifications\/preferences/);
    expect(modal).not.toMatch(/Push notifications/);
    expect(modal).not.toMatch(/Marketing emails/);
  });

  it("hides year to year migration instead of advertising a stub", () => {
    const migrate = read("src/app/api/migration/migrate/route.ts");
    expect(migrate).toMatch(/status: 404/);
    expect(migrate).not.toMatch(/status: 501/);
    expect(migrate).not.toMatch(/Year-to-year migration is not on Convex yet/);
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    expect(modal).not.toMatch(/\/api\/migration\/migrate/);
    expect(modal).not.toMatch(/year to year/i);
  });

  it("schedules the Convex cron against existing Resend keys", () => {
    const cron = read("convex/crons.ts");
    const send = read("convex/reminders.ts");
    expect(cron).toMatch(/internal\.reminders\.sendDueReminders/);
    expect(cron).toMatch(/crons\.weekly/);
    expect(cron).not.toMatch(/crons\.daily\(\s*"deadline reminder emails"/);
    expect(cron).toMatch(/dayOfWeek:\s*"monday"/);
    expect(cron).toMatch(/hourUTC:\s*7/);
    expect(send).toMatch(/AUTH_RESEND_KEY/);
    expect(send).toMatch(/RESEND_API_KEY/);
  });

  it("keeps the deadline emails toggle on the label row with a 44px target", () => {
    const modal = read("src/components/layout/dashboard/SettingsModal.tsx");
    expect(modal).toMatch(/flex items-center justify-between gap-2 min-h-11/);
    expect(modal).toMatch(/inline-flex h-11 w-11 shrink-0 items-center justify-center/);
    // Accepted #174 X gutter: reserved wrapper, not padding on the scrolling nav.
    expect(modal).toMatch(/pr-14 md:pr-0 overflow-hidden/);
    expect(modal).toMatch(/w-\[calc\(100vw-2rem\)\]/);
    expect(modal).not.toMatch(/max-sm:w-full/);
  });
});
