import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import { PasswordResetEmail } from "./passwordReset";
import { newExternalId } from "./lib/ids";

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function findUserByEmail(ctx: MutationCtx, email: string) {
  if (!email) return null;
  return await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", email))
    .unique();
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: PasswordResetEmail,
      profile(params) {
        const email = normalizeEmail(params.email);
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
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        const existing = await ctx.db.get(args.existingUserId);
        if (existing && !existing.deletedAt) {
          const email = normalizeEmail(args.profile.email) || existing.email;
          const name =
            typeof args.profile.name === "string"
              ? args.profile.name
              : existing.name ?? existing.fullName;
          const companyName =
            typeof args.profile.companyName === "string"
              ? args.profile.companyName
              : existing.companyName;
          await ctx.db.patch(existing._id, {
            email,
            name,
            fullName: existing.fullName ?? name,
            companyName,
            updatedAt: Date.now(),
          });
          return existing._id;
        }
      }

      const email = normalizeEmail(args.profile.email);
      const existing = email ? await findUserByEmail(ctx, email) : null;
      if (existing && !existing.deletedAt) {
        const name =
          typeof args.profile.name === "string"
            ? args.profile.name
            : existing.name ?? existing.fullName;
        await ctx.db.patch(existing._id, {
          email: email || existing.email,
          name,
          fullName: existing.fullName ?? name,
          supabaseUserId: existing.supabaseUserId ?? existing.externalId,
          updatedAt: Date.now(),
        });
        return existing._id;
      }

      const now = Date.now();
      const name =
        typeof args.profile.name === "string" ? args.profile.name : "";
      const companyName =
        typeof args.profile.companyName === "string"
          ? args.profile.companyName
          : "";
      return await ctx.db.insert("users", {
        externalId: newExternalId(),
        email,
        ...(name ? { name, fullName: name } : {}),
        ...(companyName ? { companyName } : {}),
        phone: "",
        entityType: "individual",
        defaultCurrency: "NGN",
        fiscalYearStart: 1,
        onboardingCompleted: false,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      });
    },
  },
});
