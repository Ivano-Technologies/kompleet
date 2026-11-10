import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "deadline reminder emails",
  { hourUTC: 7, minuteUTC: 0 },
  internal.reminders.sendDueReminders,
);

export default crons;
