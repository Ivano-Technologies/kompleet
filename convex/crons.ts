import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "deadline reminder emails",
  { hourUTC: 7, minuteUTC: 0 },
  internal.reminders.sendDueReminders,
);

crons.daily(
  "purge expired auth and retention data",
  { hourUTC: 3, minuteUTC: 0 },
  internal.retention.purgeExpired,
);

export default crons;
