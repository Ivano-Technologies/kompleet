/**
 * Background Job Scheduler for Deadline Reminders
 * Sprint 7: Phase 2 Enhancement
 * Runs daily to send pending email reminders
 */

import { createServerClient as createClient } from "@/lib/supabase/server";
import { getPendingReminders, markReminderSent } from "./deadline-service";
import {
  generate7DayReminderEmail,
  generate3DayReminderEmail,
  generate1DayReminderEmail,
  sendEmail,
  type DeadlineInfo,
} from "./email-service";

/**
 * Process all pending reminders for today
 */
export async function processPendingReminders(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  console.log("🔔 Starting reminder job...");

  const results = {
    success: 0,
    failed: 0,
    total: 0,
  };

  try {
    // Get all pending reminders for today
    const pendingReminders = await getPendingReminders();
    results.total = pendingReminders.length;

    console.log(`📧 Found ${pendingReminders.length} pending reminders`);

    if (pendingReminders.length === 0) {
      console.log("✅ No reminders to send today");
      return results;
    }

    // Process each reminder
    for (const reminder of pendingReminders) {
      try {
        // Fetch user and deadline details
        const supabase = await createClient();

        const { data: user, error: userError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", reminder.user_id)
          .single();

        if (userError || !user) {
          console.error(`❌ User not found for reminder ${reminder.id}`);
          results.failed++;
          continue;
        }

        const { data: deadline, error: deadlineError } = await supabase
          .from("filing_deadlines")
          .select("*")
          .eq("id", reminder.deadline_id)
          .single();

        if (deadlineError || !deadline) {
          console.error(`❌ Deadline not found for reminder ${reminder.id}`);
          results.failed++;
          continue;
        }

        // Prepare deadline info
        const deadlineInfo: DeadlineInfo = {
          formType: deadline.form_type,
          taxYear: deadline.tax_year,
          deadlineDate: deadline.deadline_date,
          daysRemaining: reminder.days_before,
          description: deadline.description,
        };

        // Generate appropriate email template
        let emailTemplate;
        if (reminder.days_before === 7) {
          emailTemplate = generate7DayReminderEmail(
            user.full_name || "Taxpayer",
            deadlineInfo,
          );
        } else if (reminder.days_before === 3) {
          emailTemplate = generate3DayReminderEmail(
            user.full_name || "Taxpayer",
            deadlineInfo,
          );
        } else if (reminder.days_before === 1) {
          emailTemplate = generate1DayReminderEmail(
            user.full_name || "Taxpayer",
            deadlineInfo,
          );
        } else {
          console.error(
            `❌ Invalid days_before value: ${reminder.days_before}`,
          );
          results.failed++;
          continue;
        }

        // Send email
        const emailSent = await sendEmail(user.email, emailTemplate);

        if (emailSent) {
          // Mark reminder as sent
          await markReminderSent(reminder.id);
          console.log(
            `✅ Sent ${reminder.days_before}-day reminder to ${user.email}`,
          );
          results.success++;
        } else {
          console.error(`❌ Failed to send email to ${user.email}`);
          results.failed++;
        }
      } catch (error) {
        console.error(`❌ Error processing reminder ${reminder.id}:`, error);
        results.failed++;
      }
    }

    console.log(
      `🎉 Reminder job complete: ${results.success} sent, ${results.failed} failed`,
    );
    return results;
  } catch (error) {
    console.error("❌ Fatal error in reminder job:", error);
    return results;
  }
}

/**
 * Schedule reminder job to run daily
 * This should be called by a cron job or task scheduler
 */
export async function scheduleReminderJob() {
  console.log("⏰ Scheduling daily reminder job...");

  // Run immediately on startup
  await processPendingReminders();

  // Schedule to run daily at 8:00 AM Nigerian time (WAT = UTC+1)
  const now = new Date();
  const scheduledTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    8, // 8 AM
    0,
    0,
  );

  // If it's past 8 AM today, schedule for tomorrow
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const msUntilScheduled = scheduledTime.getTime() - now.getTime();

  setTimeout(async () => {
    await processPendingReminders();

    // Schedule next run (24 hours later)
    setInterval(
      async () => {
        await processPendingReminders();
      },
      24 * 60 * 60 * 1000,
    ); // 24 hours
  }, msUntilScheduled);

  console.log(
    `✅ Reminder job scheduled for ${scheduledTime.toLocaleString("en-NG")}`,
  );
}

/**
 * Test reminder job (for development)
 */
export async function testReminderJob() {
  console.log("🧪 Running test reminder job...");
  const results = await processPendingReminders();
  console.log("Test results:", results);
  return results;
}
