import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  assertEmailSendAllowed,
  consumeAuthEmailSend,
} from "./authResend";
import { EmailVerificationOtp } from "./emailVerification";
import {
  isMissingAuthAccountError,
} from "./lib/authResendLimit";
import { PasswordResetEmail } from "./passwordReset";
import {
  createOrUpdateAuthUser,
  normalizeAuthEmail,
  type AuthUserType,
  type CreateOrUpdateUserCtx,
} from "./lib/createOrUpdateUser";

type PasswordProvider = ReturnType<typeof Password>;

type AuthGuardCtx = {
  runMutation: (fn: unknown, args: Record<string, unknown>) => Promise<unknown>;
};

function totpArgs(params: Record<string, unknown>): Record<string, string> {
  const totpCode =
    typeof params.totpCode === "string" ? params.totpCode.trim() : "";
  const recoveryCode =
    typeof params.recoveryCode === "string" ? params.recoveryCode.trim() : "";
  return {
    ...(totpCode ? { totpCode } : {}),
    ...(recoveryCode ? { recoveryCode } : {}),
  };
}

function hasVerificationCode(params: Record<string, unknown>): boolean {
  return typeof params.code === "string" && params.code.trim().length > 0;
}

function withPasswordAuthGuards(provider: PasswordProvider): PasswordProvider {
  const withOptions = provider as PasswordProvider & {
    options?: {
      authorize?: (
        params: Record<string, unknown>,
        ctx: AuthGuardCtx,
      ) => Promise<unknown>;
    };
  };
  const inner = withOptions.options?.authorize;
  if (!inner) {
    return provider;
  }
  withOptions.options = {
    ...withOptions.options,
    authorize: async (params, ctx) => {
      const email = normalizeAuthEmail(params.email);
      if (params.flow === "signIn" && email) {
        await ctx.runMutation(internal.authLegacy.trustLegacyPasswordAccount, {
          email,
        });
      }
      const completingEmailVerification =
        params.flow === "email-verification" && hasVerificationCode(params);
      if (
        (params.flow === "reset-verification" || completingEmailVerification) &&
        email
      ) {
        await ctx.runMutation(internal.totp.assertSatisfiedByEmail, {
          email,
          ...totpArgs(params),
        });
      }
      const resendWithoutCode =
        params.flow === "email-verification" && !hasVerificationCode(params);
      if (resendWithoutCode && email) {
        const allowed = await consumeAuthEmailSend(ctx, {
          email,
          purpose: "email-verification",
        });
        assertEmailSendAllowed(allowed);
        try {
          return await inner(params, ctx);
        } catch (error) {
          if (isMissingAuthAccountError(error)) {
            return null;
          }
          throw error;
        }
      }
      const result = await inner(params, ctx);
      if (params.flow === "signIn" && result && typeof result === "object") {
        const userId = (result as { userId?: unknown }).userId;
        if (typeof userId === "string") {
          await ctx.runMutation(internal.totp.assertSatisfied, {
            userId,
            ...totpArgs(params),
          });
        }
      }
      return result;
    },
  };
  return provider;
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    withPasswordAuthGuards(
      Password({
        verify: EmailVerificationOtp,
        reset: PasswordResetEmail,
        profile(params) {
          const email = normalizeAuthEmail(params.email);
          if (!email) {
            throw new Error("Email is required");
          }
          const name =
            typeof params.name === "string" ? params.name.trim() : "";
          const companyName =
            typeof params.companyName === "string"
              ? params.companyName.trim()
              : "";
          return {
            email,
            ...(name ? { name } : {}),
            ...(companyName ? { companyName } : {}),
          };
        },
        validatePasswordRequirements(password: string) {
          if (!password || password.length < 8) {
            throw new Error("Password must be at least 8 characters");
          }
          if (!/\d/.test(password)) {
            throw new Error("Password must contain at least one number");
          }
        },
      }),
    ),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      return await createOrUpdateAuthUser(
        ctx as CreateOrUpdateUserCtx,
        {
          existingUserId: args.existingUserId,
          type: args.type as AuthUserType,
          profile: args.profile,
        },
      );
    },
  },
});
