import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import {
  dueRemindersAt,
  isReminderEmailEnabled,
  type ReminderWindow,
} from "./lib/deadlineCalendar";
import {
  generate1DayReminderEmail,
  generate3DayReminderEmail,
  generate7DayReminderEmail,
  type DeadlineInfo,
  type EmailTemplate,
} from "./lib/reminderEmail";

const prefsApi = v.object({
  emailEnabled: v.boolean(),
});

const historyApi = v.object({
  formType: v.string(),
  taxYear: v.number(),
  daysRemaining: v.number(),
  deadlineDate: v.string(),
  sentAt: v.number(),
});

const candidateApi = v.object({
  userId: v.id("users"),
  email: v.string(),
  name: v.string(),
});

const candidatePageApi = v.object({
  page: v.array(candidateApi),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

type CandidatePage = {
  page: Array<{ userId: Id<"users">; email: string; name: string }>;
  isDone: boolean;
  continueCursor: string;
};

function reminderTemplate(
  daysRemaining: ReminderWindow,
  userName: string,
  deadline: DeadlineInfo,
): EmailTemplate {
  switch (daysRemaining) {
    case 7:
      return generate7DayReminderEmail(userName, deadline);
    case 3:
      return generate3DayReminderEmail(userName, deadline);
    case 1:
      return generate1DayReminderEmail(userName, deadline);
    default: {
      const _exhaustive: never = daysRemaining;
      return _exhaustive;
    }
  }
}

export function reminderEmailFrom(): string {
  return (
    process.env.AUTH_EMAIL_FROM?.trim() ||
    "Kompleet <noreply@techivano.com>"
  );
}

export async function sendReminderEmail(
  to: string,
  template: EmailTemplate,
): Promise<boolean> {
  const apiKey = process.env.AUTH_RESEND_KEY ?? process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `[reminders] AUTH_RESEND_KEY unset; would send "${template.subject}" to ${to}`,
    );
    return true;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: reminderEmailFrom(),
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("[reminders] Resend failed", detail);
    return false;
  }
  return true;
}

export async function claimSendHandler(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    formType: string;
    taxYear: number;
    daysRemaining: number;
    deadlineDate: string;
    now: number;
  },
): Promise<boolean> {
  const existing = await ctx.db
    .query("deadlineReminders")
    .withIndex("by_user_and_key", (q) =>
      q
        .eq("userId", args.userId)
        .eq("formType", args.formType)
        .eq("taxYear", args.taxYear)
        .eq("daysRemaining", args.daysRemaining),
    )
    .unique();
  if (existing) return false;
  await ctx.db.insert("deadlineReminders", {
    userId: args.userId,
    formType: args.formType,
    taxYear: args.taxYear,
    daysRemaining: args.daysRemaining,
    deadlineDate: args.deadlineDate,
    sentAt: args.now,
  });
  return true;
}

export const getMine = query({
  args: {},
  returns: prefsApi,
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    return { emailEnabled: isReminderEmailEnabled(user.reminderEmailEnabled) };
  },
});

export const updateMine = mutation({
  args: { emailEnabled: v.boolean() },
  returns: prefsApi,
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    await ctx.db.patch(user._id, {
      reminderEmailEnabled: args.emailEnabled,
      updatedAt: Date.now(),
    });
    return { emailEnabled: args.emailEnabled };
  },
});

export const listMine = query({
  args: {},
  returns: v.array(historyApi),
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("deadlineReminders")
      .withIndex("by_user_and_key", (q) => q.eq("userId", user._id))
      .collect();
    rows.sort((a, b) => b.sentAt - a.sentAt);
    return rows.map((row) => ({
      formType: row.formType,
      taxYear: row.taxYear,
      daysRemaining: row.daysRemaining,
      deadlineDate: row.deadlineDate,
      sentAt: row.sentAt,
    }));
  },
});

export const listCandidates = internalQuery({
  args: { paginationOpts: paginationOptsValidator },
  returns: candidatePageApi,
  handler: async (ctx, args) => {
    const page = await ctx.db.query("users").paginate(args.paginationOpts);
    return {
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      page: page.page
        .filter(
          (user) =>
            !user.deletedAt &&
            Boolean(user.email) &&
            isReminderEmailEnabled(user.reminderEmailEnabled),
        )
        .map((user) => ({
          userId: user._id,
          email: user.email,
          name: user.fullName ?? user.name ?? "",
        })),
    };
  },
});

export const claimSend = internalMutation({
  args: {
    userId: v.id("users"),
    formType: v.string(),
    taxYear: v.number(),
    daysRemaining: v.number(),
    deadlineDate: v.string(),
    now: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => claimSendHandler(ctx, args),
});

export const sendDueReminders = internalAction({
  args: {},
  returns: v.object({
    due: v.number(),
    claimed: v.number(),
  }),
  handler: async (ctx) => {
    const now = Date.now();
    const due = dueRemindersAt(now);
    if (due.length === 0) {
      return { due: 0, claimed: 0 };
    }

    let cursor: string | null = null;
    let claimed = 0;
    for (;;) {
      const page: CandidatePage = await ctx.runQuery(
        internal.reminders.listCandidates,
        {
          paginationOpts: { numItems: 50, cursor },
        },
      );
      for (const user of page.page) {
        for (const reminder of due) {
          const won = await ctx.runMutation(internal.reminders.claimSend, {
            userId: user.userId,
            formType: reminder.formType,
            taxYear: reminder.taxYear,
            daysRemaining: reminder.daysRemaining,
            deadlineDate: reminder.deadlineDate,
            now,
          });
          if (!won) continue;
          const template = reminderTemplate(
            reminder.daysRemaining,
            user.name,
            {
              formType: reminder.formType,
              taxYear: reminder.taxYear,
              deadlineDate: reminder.deadlineDate,
              daysRemaining: reminder.daysRemaining,
              description: reminder.description,
            },
          );
          const sent = await sendReminderEmail(user.email, template);
          if (sent) claimed += 1;
        }
      }
      if (page.isDone) break;
      cursor = page.continueCursor;
    }

    return { due: due.length, claimed };
  },
});
