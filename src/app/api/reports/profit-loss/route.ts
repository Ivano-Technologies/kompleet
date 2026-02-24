import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { FinancialStatementsService } from "@/lib/services/financial-statements-service";
import { withRateLimit } from "@/lib/with-rate-limit";

export const runtime = "nodejs";

async function handleGET(request: NextRequest) {
  try {
    const supabase = await getSupabaseForRequest(request);

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 },
      );
    }

    // Fetch all transactions for the user
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        category:categories(id, name, category_type, tax_treatment)
      `,
      )
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: true });

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Generate P&L statement
    const statement = FinancialStatementsService.generateProfitLoss(
      transactions,
      startDate,
      endDate,
    );

    // Save to database for history
    const { error: saveError } = await supabase
      .from("financial_statements")
      .insert({
        user_id: user.id,
        statement_type: "profit_loss",
        period_start: startDate,
        period_end: endDate,
        data: statement,
        metadata: {
          generated_at: new Date().toISOString(),
          transaction_count: transactions.length,
        },
      });

    if (saveError) {
      console.error("Error saving statement:", saveError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ statement });
  } catch (error: any) {
    console.error("Error in GET /api/reports/profit-loss:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 20 });
