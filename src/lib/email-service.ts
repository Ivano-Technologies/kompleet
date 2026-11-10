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

export type EmailAttachment = {
  filename: string;
  content: string;
};

/**
 * Send email using Resend. Returns false when the key is missing or the send fails.
 * Optional attachments are Resend `{ filename, content }` rows (content is base64).
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  attachments?: EmailAttachment[],
): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.warn("[email] mail key unset; skip send");
      return false;
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
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Email send error:", error);
      return false;
    }

    await response.json();
    return true;
  } catch (error) {
    console.error("Send email error:", error);
    return false;
  }
}
