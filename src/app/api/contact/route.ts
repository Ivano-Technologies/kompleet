import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";

const CONTACT_EMAILS = {
  hi: "hi@ivanotechnologies.com",
  help: "help@ivanotechnologies.com",
  support: "support@ivanotechnologies.com",
} as const;

/**
 * Map contact form subject to recipient email
 * - hi: General, partnership, careers, press
 * - help: Privacy, legal, cookies, feedback
 * - support: Technical support, billing
 */
function getRecipientForSubject(subject: string): string {
  const s = subject.toLowerCase();
  if (["support", "billing"].includes(s)) return CONTACT_EMAILS.support;
  if (["general", "partnership", "feedback"].includes(s))
    return CONTACT_EMAILS.hi;
  return CONTACT_EMAILS.help;
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 },
      );
    }

    const recipient = getRecipientForSubject(subject || "general");
    const subjectLabel =
      {
        general: "General Inquiry",
        support: "Technical Support",
        billing: "Billing & Account",
        partnership: "Partnership",
        feedback: "Feedback",
      }[subject || "general"] || "General Inquiry";

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.log("[Contact] RESEND_API_KEY not configured. Would send to:", recipient);
      return NextResponse.json({ success: true });
    }

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #10b981;">Contact Form Submission</h2>
  <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
  <p><strong>Subject:</strong> ${subjectLabel}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p><strong>Message:</strong></p>
  <p style="white-space: pre-wrap;">${String(message).replace(/</g, "&lt;")}</p>
</body>
</html>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ivano Technologies <noreply@ivanotechnologies.com>",
        to: [recipient],
        replyTo: email,
        subject: `[Contact] ${subjectLabel} — ${name}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[Contact] Resend error:", err);
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Contact] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 5, window: 60_000 });
