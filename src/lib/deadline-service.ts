/**
 * Filing deadline calendar helpers.
 * Postgres `filing_deadlines` / `deadline_reminders` are not in Convex.
 * Live `/api/deadlines/upcoming` returns an empty list after Phase 5.
 */

export interface Deadline {
  id: string;
  form_type: "PIT" | "CIT" | "VAT_Q1" | "VAT_Q2" | "VAT_Q3" | "VAT_Q4";
  tax_year: number;
  deadline_date: string;
  description: string;
  status: "upcoming" | "due_soon" | "overdue";
  days_remaining: number;
}

export function calculateDeadlineStatus(deadlineDate: string): {
  status: "upcoming" | "due_soon" | "overdue";
  daysRemaining: number;
} {
  const now = new Date();
  const deadline = new Date(deadlineDate);
  const diffTime = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let status: "upcoming" | "due_soon" | "overdue";
  if (daysRemaining < 0) {
    status = "overdue";
  } else if (daysRemaining <= 7) {
    status = "due_soon";
  } else {
    status = "upcoming";
  }

  return {
    status,
    daysRemaining,
  };
}

export async function getUpcomingDeadlines(
  _userId: string,
): Promise<Deadline[]> {
  return [];
}
