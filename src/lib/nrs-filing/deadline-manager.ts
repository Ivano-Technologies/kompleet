/**
 * Filing Deadline Manager
 * Manages tax filing deadlines per 2026 Tax Act
 */

export interface FilingDeadline {
  taxType: "PIT" | "CIT" | "VAT" | "WHT";
  description: string;
  dueDate: string;
  frequency: "annual" | "monthly" | "quarterly";
  legalReference: string;
}

/**
 * Get filing deadlines for a given tax year
 */
export function getFilingDeadlines(taxYear: number): FilingDeadline[] {
  const deadlines: FilingDeadline[] = [];

  // Personal Income Tax (PIT) - Annual
  deadlines.push({
    taxType: "PIT",
    description: "Personal Income Tax Return",
    dueDate: `${taxYear + 1}-03-31`, // March 31 of following year
    frequency: "annual",
    legalReference: "Section 81(1) of Nigeria Tax Act 2025",
  });

  // Corporate Income Tax (CIT) - Annual
  deadlines.push({
    taxType: "CIT",
    description: "Corporate Income Tax Return",
    dueDate: `${taxYear + 1}-06-30`, // June 30 of following year
    frequency: "annual",
    legalReference: "Section 82(1) of Nigeria Tax Act 2025",
  });

  // VAT - Monthly
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, "0");
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthStr = nextMonth.toString().padStart(2, "0");
    const year = month === 12 ? taxYear + 1 : taxYear;

    deadlines.push({
      taxType: "VAT",
      description: `VAT Return - ${getMonthName(month)} ${taxYear}`,
      dueDate: `${year}-${nextMonthStr}-21`, // 21st of following month
      frequency: "monthly",
      legalReference: "Section 15 of Value Added Tax Act",
    });
  }

  return deadlines;
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
 * Get month name
 */
function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month - 1];
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
