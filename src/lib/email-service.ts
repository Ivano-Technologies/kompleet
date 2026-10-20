/**
 * Email Notification Service
 * Sends deadline reminder emails using Resend API
 */

import { getEmailFrom } from "@/lib/email-from";

/**
 * Canonical host used for every link in an outbound email.
 *
 * Never hard-code the host here: emails outlive deployments, and a stale
 * absolute URL in an inbox cannot be fixed by a redeploy. Set
 * NEXT_PUBLIC_SITE_URL per-environment in Vercel. See docs/DOMAIN_MIGRATION.md.
 */
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://kompleet.techivano.com"
).replace(/\/+$/, "");

/** Kept for callers that still read the old header line. Not used in the calm layout. */
export const REMINDER_HEADER =
  "Bookkeeping and invoicing for Nigerian businesses";

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface DeadlineInfo {
  formType: string;
  taxYear: number;
  deadlineDate: string;
  daysRemaining: number;
  description: string;
}

type FormCopy = {
  shortName: string;
  formLabel: string;
  periodLabel: (taxYear: number) => string;
  subjectVerb: "filing deadline is" | "is due";
};

const FORM_COPY: Record<string, FormCopy> = {
  PIT: {
    shortName: "PIT",
    formLabel: "personal income tax",
    periodLabel: (year) => String(year),
    subjectVerb: "filing deadline is",
  },
  CIT: {
    shortName: "CIT",
    formLabel: "company income tax",
    periodLabel: (year) => String(year),
    subjectVerb: "filing deadline is",
  },
  VAT_Q1: {
    shortName: "Q1 VAT return",
    formLabel: "Q1 VAT return",
    periodLabel: (year) => `Q1 ${year}`,
    subjectVerb: "is due",
  },
  VAT_Q2: {
    shortName: "Q2 VAT return",
    formLabel: "Q2 VAT return",
    periodLabel: (year) => `Q2 ${year}`,
    subjectVerb: "is due",
  },
  VAT_Q3: {
    shortName: "Q3 VAT return",
    formLabel: "Q3 VAT return",
    periodLabel: (year) => `Q3 ${year}`,
    subjectVerb: "is due",
  },
  VAT_Q4: {
    shortName: "Q4 VAT return",
    formLabel: "Q4 VAT return",
    periodLabel: (year) => `Q4 ${year}`,
    subjectVerb: "is due",
  },
};

function formCopy(formType: string): FormCopy {
  return (
    FORM_COPY[formType] || {
      shortName: formType,
      formLabel: formType,
      periodLabel: (year) => String(year),
      subjectVerb: "is due",
    }
  );
}

function firstName(userName: string): string {
  const trimmed = userName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

/** House date: 31 Mar 2027. No weekday. Parsed as a calendar date, not local midnight. */
export function formatReminderDate(isoDate: string): string {
  const datePart = isoDate.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function whenPhrase(daysRemaining: number): string {
  return daysRemaining === 1 ? "tomorrow" : `in ${daysRemaining} days`;
}

function headingFor(daysRemaining: number): string {
  return daysRemaining === 1 ? "Due tomorrow" : `Due in ${daysRemaining} days`;
}

function reminderSubject(deadline: DeadlineInfo): string {
  const copy = formCopy(deadline.formType);
  return `Your ${copy.shortName} ${copy.subjectVerb} ${whenPhrase(deadline.daysRemaining)}`;
}

function buildCalmReminder(userName: string, deadline: DeadlineInfo): EmailTemplate {
  const copy = formCopy(deadline.formType);
  const name = firstName(userName);
  const due = formatReminderDate(deadline.deadlineDate);
  const period = copy.periodLabel(deadline.taxYear);
  const heading = headingFor(deadline.daysRemaining);
  const subject = reminderSubject(deadline);
  const body =
    `Your ${copy.formLabel} for ${period} is due on ${due}. You can prepare it in Kompleet now.`;
  const note =
    "Filing late can attract penalties, so it's worth getting it done early.";
  const footer =
    "You're getting this because reminders are on in Kompleet. Change them in Settings.";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#141413;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;padding:32px;">
    <h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.3;font-weight:700;color:#141413;">${heading}</h1>
    <p style="margin:0 0 12px 0;font-size:16px;line-height:1.5;color:#141413;">Hi ${name},</p>
    <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;color:#141413;">${body}</p>
    <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 24px 0;font-size:15px;color:#141413;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eeeeee;color:#555555;">Form</td>
        <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;">${copy.formLabel}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eeeeee;color:#555555;">Period</td>
        <td style="padding:8px 0;border-bottom:1px solid #eeeeee;text-align:right;">${period}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#555555;">Due date</td>
        <td style="padding:8px 0;text-align:right;">${due}</td>
      </tr>
    </table>
    <p style="margin:0 0 28px 0;font-size:14px;line-height:1.5;color:#6b6b6b;">${note}</p>
    <p style="margin:0 0 32px 0;">
      <a href="${SITE_URL}" style="display:inline-block;background:#141413;color:#ffffff;padding:12px 24px;text-decoration:none;font-size:15px;font-weight:600;">Open Kompleet</a>
    </p>
    <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:#6b6b6b;">${footer}</p>
    <p style="margin:0;font-size:12px;line-height:1.5;color:#6b6b6b;">Ivano Technologies Ltd</p>
  </div>
</body>
</html>`;

  const text = `${heading}

Hi ${name},

${body}

Form: ${copy.formLabel}
Period: ${period}
Due date: ${due}

${note}

Open Kompleet: ${SITE_URL}

${footer}
Ivano Technologies Ltd
`;

  return { subject, html, text };
}

export function generate7DayReminderEmail(
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  return buildCalmReminder(userName, { ...deadline, daysRemaining: 7 });
}

export function generate3DayReminderEmail(
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  return buildCalmReminder(userName, { ...deadline, daysRemaining: 3 });
}

export function generate1DayReminderEmail(
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  return buildCalmReminder(userName, { ...deadline, daysRemaining: 1 });
}

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
