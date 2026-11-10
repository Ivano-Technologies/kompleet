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
  type QueryCtx,
} from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import {
  dueRemindersAt,
  isReminderEmailEnabled,
  reminderAppliesToEntity,
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
  entityType: v.union(v.literal("individual"), v.literal("company")),
});

const candidatePageApi = v.object({
  page: v.array(candidateApi),
  isDone: v.boolean(),
  continueCursor: v.string(),
});

type CandidatePage = {
  page: Array<{
    userId: Id<"users">;
    email: string;
    name: string;
    entityType: "individual" | "company";
  }>;
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
    console.warn("[reminders] mail key unset; skip send");
    return false;
  }

  try {
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
  } catch (err) {
    console.error("[reminders] Resend threw", err);
    return false;
  }
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
      .take(200);
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
          entityType: user.entityType,
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

export async function wasSentHandler(
  ctx: QueryCtx,
  args: {
    userId: Id<"users">;
    formType: string;
    taxYear: number;
    daysRemaining: number;
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
  return existing !== null;
}

export const wasSent = internalQuery({
  args: {
    userId: v.id("users"),
    formType: v.string(),
    taxYear: v.number(),
    daysRemaining: v.number(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => wasSentHandler(ctx, args),
});

export async function releaseSendHandler(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    formType: string;
    taxYear: number;
    daysRemaining: number;
  },
): Promise<null> {
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
  if (existing) await ctx.db.delete(existing._id);
  return null;
}

export const releaseSend = internalMutation({
  args: {
    userId: v.id("users"),
    formType: v.string(),
    taxYear: v.number(),
    daysRemaining: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => releaseSendHandler(ctx, args),
});

export type SendDueRemindersDeps = {
  now: number;
  listPage: (cursor: string | null) => Promise<CandidatePage>;
  wasSent: (args: {
    userId: Id<"users">;
    formType: string;
    taxYear: number;
    daysRemaining: number;
  }) => Promise<boolean>;
  recordSend: (args: {
    userId: Id<"users">;
    formType: string;
    taxYear: number;
    daysRemaining: number;
    deadlineDate: string;
    now: number;
  }) => Promise<boolean>;
  sendEmail: (to: string, template: EmailTemplate) => Promise<boolean>;
  due?: ReturnType<typeof dueRemindersAt>;
};

export async function sendDueRemindersHandler(
  deps: SendDueRemindersDeps,
): Promise<{ due: number; claimed: number }> {
  const due = deps.due ?? dueRemindersAt(deps.now);
  if (due.length === 0) {
    return { due: 0, claimed: 0 };
  }

  let cursor: string | null = null;
  let claimed = 0;
  for (;;) {
    const page = await deps.listPage(cursor);
    for (const user of page.page) {
      try {
        for (const reminder of due) {
          if (!reminderAppliesToEntity(reminder.formType, user.entityType)) {
            continue;
          }
          const already = await deps.wasSent({
            userId: user.userId,
            formType: reminder.formType,
            taxYear: reminder.taxYear,
            daysRemaining: reminder.daysRemaining,
          });
          if (already) continue;
          const template = reminderTemplate(reminder.daysRemaining, user.name, {
            formType: reminder.formType,
            taxYear: reminder.taxYear,
            deadlineDate: reminder.deadlineDate,
            daysRemaining: reminder.daysRemaining,
            description: reminder.description,
          });
          let sent = false;
          try {
            sent = await deps.sendEmail(user.email, template);
          } catch (err) {
            console.error("[reminders] send threw", err);
            continue;
          }
          if (!sent) continue;
          const recorded = await deps.recordSend({
            userId: user.userId,
            formType: reminder.formType,
            taxYear: reminder.taxYear,
            daysRemaining: reminder.daysRemaining,
            deadlineDate: reminder.deadlineDate,
            now: deps.now,
          });
          if (recorded) claimed += 1;
        }
      } catch (err) {
        console.error("[reminders] user failed", err);
      }
    }
    if (page.isDone) break;
    cursor = page.continueCursor;
  }

  return { due: due.length, claimed };
}

export const sendDueReminders = internalAction({
  args: {},
  returns: v.object({
    due: v.number(),
    claimed: v.number(),
  }),
  handler: async (ctx): Promise<{ due: number; claimed: number }> => {
    const now = Date.now();
    const listPage = async (
      cursor: string | null,
    ): Promise<CandidatePage> =>
      ctx.runQuery(internal.reminders.listCandidates, {
        paginationOpts: { numItems: 50, cursor },
      });
    const peekSent = async (args: {
      userId: Id<"users">;
      formType: string;
      taxYear: number;
      daysRemaining: number;
    }): Promise<boolean> => ctx.runQuery(internal.reminders.wasSent, args);
    const recordSend = async (args: {
      userId: Id<"users">;
      formType: string;
      taxYear: number;
      daysRemaining: number;
      deadlineDate: string;
      now: number;
    }): Promise<boolean> => ctx.runMutation(internal.reminders.claimSend, args);
    return await sendDueRemindersHandler({
      now,
      listPage,
      wasSent: peekSent,
      recordSend,
      sendEmail: sendReminderEmail,
    });
  },
});
