/**
 * AI inference logging (formerly ML monitoring).
 *
 * Writes are **non-fatal**: a missing table or insert failure must never break
 * categorization. Drift / model-registry helpers were removed with the ML tier.
 */

import { createServerClient as createClient } from "@/lib/supabase/server";

/**
 * Log an inference for observability. Never throws.
 */
export async function logInference(params: {
  userId: string;
  inferenceId: string;
  merchant: string;
  amount: number;
  predictedCategory: string;
  confidence: number;
  latencyMs: number;
  modelVersion: string;
  provider?: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("ml_inference_logs").insert({
      user_id: params.userId,
      inference_id: params.inferenceId,
      merchant: params.merchant,
      amount: params.amount,
      predicted_category: params.predictedCategory,
      confidence: params.confidence,
      latency_ms: params.latencyMs,
      model_version: params.modelVersion,
      provider: params.provider ?? null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Log Inference Error]", error.message);
    }
  } catch (err) {
    console.error(
      "[Log Inference Error]",
      err instanceof Error ? err.message : err,
    );
  }
}
