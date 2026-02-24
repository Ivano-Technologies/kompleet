/**
 * API endpoint for transaction categorization
 * POST /api/categorize
 *
 * Accepts:
 * - transactionIds: string[] - IDs of transactions to categorize
 * - useUserContext: boolean - Whether to use user's learning profile
 *
 * Returns:
 * - predictions: CategoryPrediction[]
 * - averageConfidence: number
 * - message: string
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseForRequest } from "@/lib/supabase/server";
import { categorizeTransactions } from "@/lib/ai/categorizationService";
import { getUserLearningContext } from "@/lib/ai/feedbackService";

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await getSupabaseForRequest(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Parse request body
    const { transactionIds, useUserContext = true } = await request.json();

    if (
      !transactionIds ||
      !Array.isArray(transactionIds) ||
      transactionIds.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "transactionIds array is required" },
        { status: 400 },
      );
    }

    // 3. Fetch transactions
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .in("id", transactionIds)
      .eq("user_id", user.id);

    if (fetchError) {
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch transactions: ${fetchError.message}`,
        },
        { status: 500 },
      );
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No transactions found" },
        { status: 404 },
      );
    }

    // 4. Get user learning context
    let userContext;
    if (useUserContext) {
      userContext = await getUserLearningContext(user.id);
    }

    // 5. Categorize transactions
    const result = await categorizeTransactions(
      transactions.map((tx) => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        counterparty: tx.counterparty,
        currency: tx.currency,
        user_id: tx.user_id,
        source_file_id: tx.source_file_id,
        raw_data: tx.raw_data,
        created_at: tx.created_at,
        updated_at: tx.updated_at || new Date(),
      })),
      userContext,
    );

    // 6. Store predictions
    const predictions = result.predictions.map((p) => ({
      transaction_id: p.transactionId,
      user_id: user.id,
      predicted_category: p.category,
      confidence: p.confidence,
      reasoning: p.reasoning,
      alternatives: p.alternativeCategories,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("categorization_predictions")
      .insert(predictions);

    if (insertError) {
      console.error("Failed to store predictions:", insertError);
      // Don't fail the request, just log the error
    }

    // 7. Return response
    return NextResponse.json({
      success: true,
      predictions: result.predictions,
      totalProcessed: result.totalProcessed,
      successCount: result.successCount,
      failureCount: result.failureCount,
      averageConfidence: result.averageConfidence,
      message: `Successfully categorized ${result.successCount} of ${result.totalProcessed} transactions`,
    });
  } catch (error) {
    console.error("Categorization error:", error);

    return NextResponse.json(
      {
        success: false,
        message: `Categorization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 },
    );
  }
}
