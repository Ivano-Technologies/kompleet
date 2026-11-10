/**
 * Filing Deadline Manager
 * Manages tax filing deadlines for NRS returns.
 * Calendar dates come from convex/lib/deadlineCalendar.ts (one source of truth).
 */

import { filingDeadlinesForTaxYear } from "../../../convex/lib/deadlineCalendar";

export interface FilingDeadline {
  taxType: "PIT" | "CIT" | "VAT" | "WHT";
  description: string;
  dueDate: string;
  frequency: "annual" | "monthly" | "quarterly";
  legalReference: string;
}

function legalReferenceFor(formType: string): string {
  if (formType === "PIT") return "NRS PIT return";
  if (formType === "CIT") return "NRS CIT return";
  return "NRS VAT return";
}

function taxTypeFor(formType: string): FilingDeadline["taxType"] {
  if (formType === "PIT") return "PIT";
  if (formType === "CIT") return "CIT";
  return "VAT";
}

/**
 * Get filing deadlines for a given tax year
 */
export function getFilingDeadlines(taxYear: number): FilingDeadline[] {
  return filingDeadlinesForTaxYear(taxYear).map((deadline) => {
    const taxType = taxTypeFor(deadline.formType);
    return {
      taxType,
      description: deadline.description,
      dueDate: deadline.deadlineDate,
      frequency: taxType === "VAT" ? "monthly" : "annual",
      legalReference: legalReferenceFor(deadline.formType),
    };
  });
}

/**
 * Get upcoming deadlines
 */
export function getUpcomingDeadlines(
  deadlines: FilingDeadline[],
  daysAhead: number = 30,
): FilingDeadline[] {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  return deadlines
    .filter((deadline) => {
      const dueDate = new Date(deadline.dueDate);
      return dueDate >= today && dueDate <= futureDate;
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
}

/**
 * Get overdue deadlines
 */
export function getOverdueDeadlines(
  deadlines: FilingDeadline[],
): FilingDeadline[] {
  const today = new Date();

  return deadlines
    .filter((deadline) => {
      const dueDate = new Date(deadline.dueDate);
      return dueDate < today;
    })
    .sort(
      (a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );
}

/**
 * Calculate days until deadline
 */
export function daysUntilDeadline(deadline: FilingDeadline): number {
  const today = new Date();
  const dueDate = new Date(deadline.dueDate);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get deadline status
 */
export function getDeadlineStatus(
  deadline: FilingDeadline,
): "overdue" | "urgent" | "upcoming" | "future" {
  const days = daysUntilDeadline(deadline);

  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "upcoming";
  return "future";
}

/**
 * Format deadline for display
 */
export function formatDeadline(deadline: FilingDeadline): string {
  const date = new Date(deadline.dueDate);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
