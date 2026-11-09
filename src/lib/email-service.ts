/**
 * Email Notification Service
 * Sends deadline reminder emails using Resend API
 */

import { getEmailFrom } from "@/lib/email-from";
import type { EmailTemplate } from "../../convex/lib/reminderEmail";

export {
  REMINDER_HEADER,
  formatReminderDate,
  generate1DayReminderEmail,
  generate3DayReminderEmail,
  generate7DayReminderEmail,
} from "../../convex/lib/reminderEmail";
export type { DeadlineInfo, EmailTemplate } from "../../convex/lib/reminderEmail";

/**
 * Send email using Resend API (or fallback to console log for testing)
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. Email would be sent:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Text: ${template.text.substring(0, 200)}...`);
      return true;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: getEmailFrom(),
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Email send error:", error);
      return false;
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Send email error:", error);
    return false;
  }
}
