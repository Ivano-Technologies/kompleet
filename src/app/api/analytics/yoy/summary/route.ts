import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";

async function handleGET(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const currentYear = parseInt(
      request.nextUrl.searchParams.get("year") ||
        new Date().getFullYear().toString(),
      10,
    );
    const previousYear = currentYear - 1;

    const [current, previous] = await Promise.all([
      convex.query(api.transactions.totalsForYear, { taxYear: currentYear }),
      convex.query(api.transactions.totalsForYear, { taxYear: previousYear }),
    ]);

    const currentIncome = current.income;
    const currentExpenses = current.expenses;
    const previousIncome = previous.income;
    const previousExpenses = previous.expenses;

    const currentNetIncome = currentIncome - currentExpenses;
    const previousNetIncome = previousIncome - previousExpenses;
    const currentTax = Math.max(0, currentNetIncome * 0.2);
    const previousTax = Math.max(0, previousNetIncome * 0.2);

    const incomeChange = currentIncome - previousIncome;
    const incomeChangePercent =
      previousIncome > 0 ? (incomeChange / previousIncome) * 100 : 0;
    const expensesChange = currentExpenses - previousExpenses;
    const expensesChangePercent =
      previousExpenses > 0 ? (expensesChange / previousExpenses) * 100 : 0;
    const taxChange = currentTax - previousTax;
    const taxChangePercent =
      previousTax > 0 ? (taxChange / previousTax) * 100 : 0;
    const netIncomeChange = currentNetIncome - previousNetIncome;
    const netIncomeChangePercent =
      previousNetIncome > 0 ? (netIncomeChange / previousNetIncome) * 100 : 0;

    return NextResponse.json({
      income: {
        current: currentIncome,
        previous: previousIncome,
        change: incomeChange,
        changePercent: incomeChangePercent,
      },
      expenses: {
        current: currentExpenses,
        previous: previousExpenses,
        change: expensesChange,
        changePercent: expensesChangePercent,
      },
      tax: {
        current: currentTax,
        previous: previousTax,
        change: taxChange,
        changePercent: taxChangePercent,
      },
      netIncome: {
        current: currentNetIncome,
        previous: previousNetIncome,
        change: netIncomeChange,
        changePercent: netIncomeChangePercent,
      },
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error in /api/analytics/yoy/summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET);
