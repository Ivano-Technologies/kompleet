import { Email } from "@convex-dev/auth/providers/Email";
import { recordE2eOtp } from "./e2eOtp";
import {
  EMAIL_VERIFICATION_MAX_AGE_SECONDS,
  generateAuthOtp,
  sendAuthEmail,
} from "./lib/authEmail";

/**
 * Sign-up / unverified sign-in OTP via Resend. Reuses AUTH_RESEND_KEY
 * (or RESEND_API_KEY) and AUTH_EMAIL_FROM from password reset.
 */
export const EmailVerificationOtp = Email({
  id: "email-verification",
  maxAge: EMAIL_VERIFICATION_MAX_AGE_SECONDS,
  async generateVerificationToken() {
    return generateAuthOtp();
  },
  async sendVerificationRequest({
    identifier: email,
    token,
  }: {
    identifier: string;
    token: string;
  }) {
    await sendAuthEmail({
      email,
      token,
      purpose: "email-verification",
      subject: "Verify your Kompleet email",
      text: `Your Kompleet verification code is ${token}. It expires in 15 minutes.\n\nIf you did not create a Kompleet account, ignore this email.`,
      html: `<p>Your Kompleet verification code is <strong>${token}</strong>.</p><p>It expires in 15 minutes. If you did not create a Kompleet account, ignore this email.</p>`,
    });
    // Convex Auth passes ActionCtx as the second argument.
    await recordE2eOtp(arguments[1], {
      email,
      token,
      purpose: "email-verification",
    });
  },
});
