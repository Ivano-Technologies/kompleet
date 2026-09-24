// TODO(IVA-64 Phase 5): ML prediction tables are not in Convex schema. Categorize via Convex categories only.
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { llmBatchCategorize } from "@/lib/services/llm-categorization-service";
import {
  categorizeTransaction,
  type Category,
} from "@/lib/services/categorization-service";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
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
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = batchCategorizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const categories = await convex.query(api.categories.list, {});
    const categoryOptions = categories.map((c) => ({
      name: c.name,
      type: c.category_type,
      tax_treatment: c.tax_treatment,
      keywords: Array.isArray(c.keywords) ? c.keywords : [],
    }));
    const rulesCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      category_type: c.category_type,
      tax_treatment: c.tax_treatment,
      keywords: Array.isArray(c.keywords) ? c.keywords : [],
    })) as Category[];

    const rulesResults = parsed.data.transactions.map((txn) =>
      categorizeTransaction(txn.merchant, rulesCategories),
    );

    const needsLLM: number[] = [];
    rulesResults.forEach((r, i) => {
      if (r.confidenceScore < 70) needsLLM.push(i);
    });

    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    const llmResults: Record<
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
        merchant: parsed.data.transactions[i]!.merchant,
        amount: parsed.data.transactions[i]!.amount,
        type: parsed.data.transactions[i]!.type,
        channel: parsed.data.transactions[i]!.channel,
        timestamp: parsed.data.transactions[i]!.timestamp,
      }));
      const batchResults = await llmBatchCategorize(llmInputs, categoryOptions);
      needsLLM.forEach((originalIdx, batchIdx) => {
        llmResults[originalIdx] = batchResults[batchIdx]!;
      });
    }

    const results = parsed.data.transactions.map((_, i) => {
      if (llmResults[i]) {
        return {
          category: llmResults[i]!.category,
          confidence: llmResults[i]!.confidence,
          inference_id: llmResults[i]!.inference_id,
          provider: "openai",
        };
      }
      return {
        category: rulesResults[i]!.categoryName || "Uncategorized",
        confidence: rulesResults[i]!.confidenceScore,
        inference_id: `rules-${Date.now()}-${i}`,
        provider: "rules",
      };
    });

    return NextResponse.json({
      count: results.length,
      model_version: apiKey ? "gpt-4o-mini" : "rules-only",
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Batch Categorization Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
