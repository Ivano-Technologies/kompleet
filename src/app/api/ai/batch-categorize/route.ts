import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { llmBatchCategorize } from "@/lib/services/llm-categorization-service";
import {
  categorizeTransaction,
  type Category,
} from "@/lib/services/categorization-service";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const batchCategorizeSchema = z.object({
  transactions: z
    .array(
      z.object({
        merchant: z.string().min(1),
        amount: z.number(),
        type: z.enum(["debit", "credit"]).optional(),
        channel: z.string().optional(),
        timestamp: z.string().optional(),
      }),
    )
    .min(1)
    .max(100),
});

async function handlePOST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = batchCategorizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Fetch categories for context (using per-request client with RLS)
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, category_type, tax_treatment, keywords");

    const categoryOptions = (categories || []).map((c) => ({
      name: c.name,
      type: c.category_type,
      tax_treatment: c.tax_treatment,
    }));

    // Step 1: Rules-based categorization for all transactions
    const rulesResults = parsed.data.transactions.map(
      (txn: { merchant: string }) =>
        categorizeTransaction(txn.merchant, (categories || []) as Category[]),
    );

    // Step 2: Identify low-confidence items that need LLM
    const needsLLM: number[] = [];
    rulesResults.forEach((r: { confidenceScore: number }, i: number) => {
      if (r.confidenceScore < 70) needsLLM.push(i);
    });

    // Step 3: If there are low-confidence items and we have an API key, use LLM
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    let llmResults: Record<
      number,
      {
        category: string;
        confidence: number;
        reasoning: string;
        inference_id: string;
      }
    > = {};

    if (needsLLM.length > 0 && apiKey) {
      const llmInputs = needsLLM.map((i) => ({
        merchant: parsed.data.transactions[i].merchant,
        amount: parsed.data.transactions[i].amount,
        type: parsed.data.transactions[i].type,
        channel: parsed.data.transactions[i].channel,
        timestamp: parsed.data.transactions[i].timestamp,
      }));

      const batchResults = await llmBatchCategorize(llmInputs, categoryOptions);
      needsLLM.forEach((originalIdx, batchIdx) => {
        llmResults[originalIdx] = batchResults[batchIdx];
      });
    }

    // Step 4: Merge results
    const results = parsed.data.transactions.map((_: unknown, i: number) => {
      if (llmResults[i]) {
        return {
          category: llmResults[i].category,
          confidence: llmResults[i].confidence,
          inference_id: llmResults[i].inference_id,
          provider: "openai",
        };
      }
      return {
        category: rulesResults[i].categoryName || "Uncategorized",
        confidence: rulesResults[i].confidenceScore,
        inference_id: `rules-${Date.now()}-${i}`,
        provider: "rules",
      };
    });

    console.log("[Batch Categorization]", {
      total: parsed.data.transactions.length,
      rules_handled: parsed.data.transactions.length - needsLLM.length,
      llm_handled: Object.keys(llmResults).length,
      llm_skipped: needsLLM.length - Object.keys(llmResults).length,
    });

    return NextResponse.json({
      count: results.length,
      model_version: apiKey ? "gpt-4o-mini" : "rules-only",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("[Batch Categorization Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
