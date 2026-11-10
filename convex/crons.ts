import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Monday 07:00 UTC = 08:00 WAT. dueRemindersAt's 0–7 day catch-up covers
// every deadline in the coming week so mid-week dues are not skipped.
crons.weekly(
  "deadline reminder emails",
  { dayOfWeek: "monday", hourUTC: 7, minuteUTC: 0 },
  internal.reminders.sendDueReminders,
);

crons.daily(
  "purge expired auth and retention data",
  { hourUTC: 3, minuteUTC: 0 },
  internal.retention.purgeExpired,
);

export default crons;
