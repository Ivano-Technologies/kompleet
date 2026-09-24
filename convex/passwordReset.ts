import { Email } from "@convex-dev/auth/providers/Email";

function generateNumericCode(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => String(byte % 10)).join("");
}

/**
 * Password-reset OTP via Resend. Set AUTH_RESEND_KEY (or RESEND_API_KEY)
 * on the Convex deployment. If neither is set, the code is logged so CoS
 * can deliver it once — never invent user passwords.
 */
export const PasswordResetEmail = Email({
  id: "password-reset",
  maxAge: 60 * 60,
  async generateVerificationToken() {
    return generateNumericCode(8);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
    const from =
      process.env.AUTH_EMAIL_FROM ?? "Kompleet <noreply@ivanotechnologies.com>";

    if (!apiKey) {
      console.warn(
        `[convex-auth] AUTH_RESEND_KEY unset; password reset code for ${email}: ${token}`,
      );
      return;
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Reset your Kompleet password",
        text: `Your Kompleet password reset code is ${token}. It expires in 60 minutes.\n\nIf you did not request this, ignore this email.`,
        html: `<p>Your Kompleet password reset code is <strong>${token}</strong>.</p><p>It expires in 60 minutes. If you did not request this, ignore this email.</p>`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("[convex-auth] Resend password-reset failed", detail);
      throw new Error("Failed to send password reset email");
    }
  },
});
