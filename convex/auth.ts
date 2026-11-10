import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import {
  assertEmailSendAllowed,
  consumeAuthEmailSend,
} from "./authResend";
import { EmailVerificationOtp } from "./emailVerification";
import {
  isBlankAuthCode,
  toTypedAuthError,
  withSanitisedAuthCode,
} from "./lib/authErrors";
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

function withPasswordAuthGuards(provider: PasswordProvider): PasswordProvider {
  const withOptions = provider as PasswordProvider & {
    options?: {
      authorize?: (
        params: Record<string, unknown>,
        ctx: {
          runMutation: (
            fn: typeof internal.authLegacy.trustLegacyPasswordAccount,
            args: { email: string },
          ) => Promise<null>;
        },
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
      const nextParams = withSanitisedAuthCode(params);
      const email = normalizeAuthEmail(nextParams.email);
      try {
        if (nextParams.flow === "signIn" && email) {
          await ctx.runMutation(internal.authLegacy.trustLegacyPasswordAccount, {
            email,
          });
        }
        const resendWithoutCode =
          nextParams.flow === "email-verification" && isBlankAuthCode(nextParams);
        const sendingReset = nextParams.flow === "reset";
        if ((resendWithoutCode || sendingReset) && email) {
          const allowed = await consumeAuthEmailSend(ctx, {
            email,
            purpose: sendingReset ? "password-reset" : "email-verification",
          });
          assertEmailSendAllowed(allowed);
          try {
            return await inner(nextParams, ctx);
          } catch (error) {
            if (isMissingAuthAccountError(error)) {
              return null;
            }
            throw toTypedAuthError(error);
          }
        }
        return await inner(nextParams, ctx);
      } catch (error) {
        throw toTypedAuthError(error);
      }
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
