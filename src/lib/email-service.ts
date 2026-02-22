/**
 * Email Notification Service
 * Sprint 7: Phase 2 Enhancement
 * Sends deadline reminder emails using Resend API
 */

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

/**
 * Generate 7-day reminder email template
 */
export function generate7DayReminderEmail(
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  const formTypeNames = {
    PIT: "Personal Income Tax (PIT)",
    CIT: "Company Income Tax (CIT)",
    VAT_Q1: "VAT Return - Q1",
    VAT_Q2: "VAT Return - Q2",
    VAT_Q3: "VAT Return - Q3",
    VAT_Q4: "VAT Return - Q4",
  };

  const formName =
    formTypeNames[deadline.formType as keyof typeof formTypeNames] ||
    deadline.formType;
  const deadlineFormatted = new Date(deadline.deadlineDate).toLocaleDateString(
    "en-NG",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const subject = `Reminder: ${formName} Filing Deadline in 7 Days`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">KOMPLEET</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Nigerian Tax Compliance Platform</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #10b981; margin-top: 0;">Filing Deadline Reminder</h2>
    
    <p>Dear ${userName},</p>
    
    <p>This is a friendly reminder that your <strong>${formName}</strong> filing deadline is approaching.</p>
    
    <div style="background: white; padding: 20px; border-left: 4px solid #fbbf24; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0 0 10px 0;"><strong>Form Type:</strong> ${formName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Tax Year:</strong> ${deadline.taxYear}</p>
      <p style="margin: 0 0 10px 0;"><strong>Deadline:</strong> ${deadlineFormatted}</p>
      <p style="margin: 0;"><strong>Days Remaining:</strong> <span style="color: #f59e0b; font-weight: bold;">${deadline.daysRemaining} days</span></p>
    </div>
    
    <h3 style="color: #374151; font-size: 18px;">What You Need to Do:</h3>
    <ol style="color: #4b5563;">
      <li>Log in to your KOMPLEET account</li>
      <li>Go to the Filing Center</li>
      <li>Generate your ${formName} form</li>
      <li>Review and download the PDF</li>
      <li>Submit to the Nigerian Revenue Service</li>
    </ol>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://kompleet.com/filing" style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Go to Filing Center</a>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Important:</strong> Late filing may result in penalties as prescribed by the Nigeria Tax Act 2025.</p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Need help? Contact our support team at <a href="mailto:support@kompleet.com" style="color: #10b981;">support@kompleet.com</a>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>This is an automated reminder from KOMPLEET Platform</p>
    <p>Ivano Technologies Ltd | Nigerian Tax Compliance</p>
    <p>
      <a href="https://kompleet.com/notifications" style="color: #10b981; text-decoration: none;">Manage Notifications</a> |
      <a href="https://kompleet.com/privacy" style="color: #10b981; text-decoration: none;">Privacy Policy</a>
    </p>
  </div>
</body>
</html>
  `;

  const text = `
KOMPLEET - Filing Deadline Reminder

Dear ${userName},

This is a friendly reminder that your ${formName} filing deadline is approaching.

Form Type: ${formName}
Tax Year: ${deadline.taxYear}
Deadline: ${deadlineFormatted}
Days Remaining: ${deadline.daysRemaining} days

What You Need to Do:
1. Log in to your KOMPLEET account
2. Go to the Filing Center
3. Generate your ${formName} form
4. Review and download the PDF
5. Submit to the Nigerian Revenue Service

Go to Filing Center: https://kompleet.com/filing

⚠️ Important: Late filing may result in penalties as prescribed by the Nigeria Tax Act 2025.

Need help? Contact our support team at support@kompleet.com

---
This is an automated reminder from KOMPLEET Platform
Ivano Technologies Ltd | Nigerian Tax Compliance
  `;

  return { subject, html, text };
}

/**
 * Generate 3-day reminder email template
 */
export function generate3DayReminderEmail(
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  const formTypeNames = {
    PIT: "Personal Income Tax (PIT)",
    CIT: "Company Income Tax (CIT)",
    VAT_Q1: "VAT Return - Q1",
    VAT_Q2: "VAT Return - Q2",
    VAT_Q3: "VAT Return - Q3",
    VAT_Q4: "VAT Return - Q4",
  };

  const formName =
    formTypeNames[deadline.formType as keyof typeof formTypeNames] ||
    deadline.formType;
  const deadlineFormatted = new Date(deadline.deadlineDate).toLocaleDateString(
    "en-NG",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const subject = `⚠️ Urgent: ${formName} Filing Deadline in 3 Days`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ URGENT REMINDER</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">KOMPLEET - Nigerian Tax Compliance Platform</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #f59e0b; margin-top: 0;">Filing Deadline in 3 Days!</h2>
    
    <p>Dear ${userName},</p>
    
    <p><strong>Your ${formName} filing deadline is only 3 days away.</strong> Please take action immediately to avoid penalties.</p>
    
    <div style="background: white; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0 0 10px 0;"><strong>Form Type:</strong> ${formName}</p>
      <p style="margin: 0 0 10px 0;"><strong>Tax Year:</strong> ${deadline.taxYear}</p>
      <p style="margin: 0 0 10px 0;"><strong>Deadline:</strong> ${deadlineFormatted}</p>
      <p style="margin: 0;"><strong>Days Remaining:</strong> <span style="color: #ef4444; font-weight: bold; font-size: 20px;">${deadline.daysRemaining} days</span></p>
    </div>
    
    <div style="background: #fee2e2; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="color: #991b1b; margin-top: 0; font-size: 18px;">🚨 Action Required Now</h3>
      <p style="margin: 0; color: #7f1d1d;">Don't wait until the last minute! Generate and submit your tax form today to avoid late filing penalties.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://kompleet.com/filing" style="display: inline-block; background: #ef4444; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">File Now →</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Need urgent assistance? Contact us at <a href="mailto:support@kompleet.com" style="color: #ef4444;">support@kompleet.com</a>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p>This is an automated urgent reminder from KOMPLEET Platform</p>
    <p>Ivano Technologies Ltd | Nigerian Tax Compliance</p>
  </div>
</body>
</html>
  `;

  const text = `
⚠️ URGENT REMINDER - KOMPLEET

Dear ${userName},

Your ${formName} filing deadline is only 3 days away. Please take action immediately to avoid penalties.

Form Type: ${formName}
Tax Year: ${deadline.taxYear}
Deadline: ${deadlineFormatted}
Days Remaining: ${deadline.daysRemaining} days

🚨 ACTION REQUIRED NOW
Don't wait until the last minute! Generate and submit your tax form today to avoid late filing penalties.

File Now: https://kompleet.com/filing

Need urgent assistance? Contact us at support@kompleet.com

---
This is an automated urgent reminder from KOMPLEET Platform
Ivano Technologies Ltd | Nigerian Tax Compliance
  `;

  return { subject, html, text };
}

/**
 * Generate 1-day reminder email template
 */
export function generate1DayReminderEmail(
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  const formTypeNames = {
    PIT: "Personal Income Tax (PIT)",
    CIT: "Company Income Tax (CIT)",
    VAT_Q1: "VAT Return - Q1",
    VAT_Q2: "VAT Return - Q2",
    VAT_Q3: "VAT Return - Q3",
    VAT_Q4: "VAT Return - Q4",
  };

  const formName =
    formTypeNames[deadline.formType as keyof typeof formTypeNames] ||
    deadline.formType;
  const deadlineFormatted = new Date(deadline.deadlineDate).toLocaleDateString(
    "en-NG",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const subject = `🚨 FINAL NOTICE: ${formName} Filing Deadline Tomorrow!`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">🚨 FINAL NOTICE</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 16px; font-weight: bold;">DEADLINE TOMORROW!</p>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #dc2626; margin-top: 0;">Last Day to File!</h2>
    
    <p>Dear ${userName},</p>
    
    <p><strong style="color: #dc2626; font-size: 18px;">This is your final reminder. Your ${formName} filing deadline is TOMORROW!</strong></p>
    
    <div style="background: #fef2f2; padding: 25px; border: 3px solid #dc2626; margin: 20px 0; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #7f1d1d;">FILING DEADLINE</p>
      <p style="margin: 0 0 10px 0; font-size: 28px; font-weight: bold; color: #dc2626;">${deadlineFormatted}</p>
      <p style="margin: 0; font-size: 36px; font-weight: bold; color: #dc2626;">24 HOURS</p>
    </div>
    
    <div style="background: #7f1d1d; color: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0; font-size: 20px;">⏰ File Immediately</h3>
      <p style="margin: 0;">Late filing will result in penalties and interest charges. Don't risk it - file your ${formName} return now!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://kompleet.com/filing" style="display: inline-block; background: #dc2626; color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 20px; box-shadow: 0 6px 12px rgba(0,0,0,0.2); animation: pulse 2s infinite;">FILE NOW - DON'T DELAY →</a>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #78350f;"><strong>Need Help?</strong> Our support team is standing by. Email <a href="mailto:support@kompleet.com" style="color: #dc2626;">support@kompleet.com</a> or call our hotline.</p>
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="color: #dc2626; font-weight: bold;">This is your FINAL automated reminder from KOMPLEET Platform</p>
    <p>Ivano Technologies Ltd | Nigerian Tax Compliance</p>
  </div>
</body>
</html>
  `;

  const text = `
🚨 FINAL NOTICE - KOMPLEET

Dear ${userName},

This is your final reminder. Your ${formName} filing deadline is TOMORROW!

FILING DEADLINE: ${deadlineFormatted}
TIME REMAINING: 24 HOURS

⏰ FILE IMMEDIATELY
Late filing will result in penalties and interest charges. Don't risk it - file your ${formName} return now!

FILE NOW: https://kompleet.com/filing

Need Help? Our support team is standing by.
Email: support@kompleet.com

---
This is your FINAL automated reminder from KOMPLEET Platform
Ivano Technologies Ltd | Nigerian Tax Compliance
  `;

  return { subject, html, text };
}

/**
 * Send email using Resend API (or fallback to console log for testing)
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
): Promise<boolean> {
  try {
    // Check if Resend API key is configured
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY not configured. Email would be sent:");
      console.log(`To: ${to}`);
      console.log(`Subject: ${template.subject}`);
      console.log(`Text: ${template.text.substring(0, 200)}...`);
      return true; // Return true for testing without actual email service
    }

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KOMPLEET <noreply@kompleet.com>",
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
