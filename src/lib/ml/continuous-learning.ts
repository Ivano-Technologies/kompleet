/**
 * Continuous Learning Pipeline
 * Collects user corrections and triggers model retraining
 */

import { createServerClient as createClient } from "@/lib/supabase/server";

/**
 * Record a user correction for ML training
 */
export async function recordCorrection(params: {
  userId: string;
  inferenceId?: string;
  transactionData: {
    merchant: string;
    amount: number;
    channel?: string;
    timestamp?: string;
  };
  predictedCategory: string;
  correctedCategory: string;
  confidence: number;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("ml_corrections").insert({
    user_id: params.userId,
    inference_id: params.inferenceId || null,
    transaction_data: params.transactionData,
    predicted_category: params.predictedCategory,
    corrected_category: params.correctedCategory,
    confidence: params.confidence,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[Record Correction Error]", error);
    throw error;
  }

  // Check if retraining threshold reached
  await checkRetrainingThreshold();
}

/**
 * Check if model retraining should be triggered
 */
async function checkRetrainingThreshold() {
  const supabase = await createClient();

  // Get last retraining date
  const { data: lastModel } = await supabase
    .from("ml_models")
    .select("created_at")
    .eq("status", "deployed")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastModel) {
    return; // No model deployed yet
  }

  // Count corrections since last training
  const { count } = await supabase
    .from("ml_corrections")
    .select("*", { count: "exact", head: true })
    .gte("created_at", lastModel.created_at);

  // Trigger retraining if > 1000 corrections
  if (count && count > 1000) {
    console.log(
      `[Continuous Learning] Retraining threshold reached: ${count} corrections`,
    );
    await triggerRetraining("threshold");
  }
}

/**
 * Trigger model retraining
 */
export async function triggerRetraining(
  reason: "threshold" | "scheduled" | "manual",
) {
  const supabase = await createClient();

  // Log retraining trigger
  console.log(`[Continuous Learning] Triggering retraining: ${reason}`);

  // Create retraining job record
  const { error } = await supabase.from("ml_retraining_jobs").insert({
    trigger_reason: reason,
    status: "pending",
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[Trigger Retraining Error]", error);
    throw error;
  }

  // In production, this would trigger a background job
  // For now, we'll log it for manual execution
  console.log(
    "[Continuous Learning] Retraining job created - execute train_model.py manually",
  );
}

/**
 * Get correction statistics
 */
export async function getCorrectionStats(userId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("ml_corrections")
    .select("predicted_category, corrected_category, confidence, created_at");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data: corrections, error } = await query
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("[Get Correction Stats Error]", error);
    return null;
  }

  if (!corrections || corrections.length === 0) {
    return {
      totalCorrections: 0,
      correctionRate: 0,
      topMiscategorized: [],
    };
  }

  // Calculate statistics
  const categoryPairs: Record<string, number> = {};

  for (const correction of corrections) {
    const key = `${correction.predicted_category} → ${correction.corrected_category}`;
    categoryPairs[key] = (categoryPairs[key] || 0) + 1;
  }

  const topMiscategorized = Object.entries(categoryPairs)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([pair, count]) => ({ pair, count }));

  return {
    totalCorrections: corrections.length,
    correctionRate: corrections.length, // Would need total predictions for actual rate
    topMiscategorized,
  };
}

/**
 * Export corrections for training
 */
export async function exportCorrectionsForTraining() {
  const supabase = await createClient();

  const { data: corrections, error } = await supabase
    .from("ml_corrections")
    .select("transaction_data, corrected_category, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[Export Corrections Error]", error);
    return [];
  }

  // Format for training CSV
  return (
    corrections?.map((c) => ({
      merchant: c.transaction_data.merchant,
      amount: c.transaction_data.amount,
      channel: c.transaction_data.channel || "unknown",
      timestamp: c.transaction_data.timestamp || c.created_at,
      category: c.corrected_category,
    })) || []
  );
}
