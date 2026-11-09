import { Email } from "@convex-dev/auth/providers/Email";
import { recordE2eOtp } from "./e2eOtp";
import {
  PASSWORD_RESET_MAX_AGE_SECONDS,
  generateAuthOtp,
  sendAuthEmail,
} from "./lib/authEmail";

/**
 * Password-reset OTP via Resend. Set AUTH_RESEND_KEY (or RESEND_API_KEY)
 * on the Convex deployment. If neither is set, the code is logged so CoS
 * can deliver it once — never invent user passwords.
 */
export const PasswordResetEmail = Email({
  id: "password-reset",
  maxAge: PASSWORD_RESET_MAX_AGE_SECONDS,
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
      purpose: "password-reset",
      subject: "Reset your Kompleet password",
      text: `Your Kompleet password reset code is ${token}. It expires in 60 minutes.\n\nIf you did not request this, ignore this email.`,
      html: `<p>Your Kompleet password reset code is <strong>${token}</strong>.</p><p>It expires in 60 minutes. If you did not request this, ignore this email.</p>`,
    });
    // Convex Auth passes ActionCtx as the second argument.
    await recordE2eOtp(arguments[1], {
      email,
      token,
      purpose: "password-reset",
    });
  },
});
