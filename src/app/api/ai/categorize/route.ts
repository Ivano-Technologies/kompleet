// TODO(IVA-64 Phase 5): ml_inference_logs is not in Convex schema. Categorize via Convex categories only.
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/with-rate-limit";
import { llmCategorize } from "@/lib/services/llm-categorization-service";
import {
  categorizeTransaction,
  type Category,
} from "@/lib/services/categorization-service";
import { api } from "@/lib/convex/http";
import { isUnauthorized, requireAuthedConvex } from "@/lib/convex/server";
import { z } from "zod";

const categorizeSchema = z.object({
  merchant: z.string().min(1, "Merchant is required").max(500),
  amount: z.number(),
  type: z.enum(["debit", "credit"]).optional(),
  channel: z.string().optional(),
  timestamp: z.string().optional(),
});

async function handlePOST(request: NextRequest) {
  try {
    const { convex } = await requireAuthedConvex(request);
    const body = await request.json();
    const parsed = categorizeSchema.safeParse(body);
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

    const rulesResult = categorizeTransaction(
      parsed.data.merchant,
      rulesCategories,
    );

    if (rulesResult.confidenceScore >= 70) {
      return NextResponse.json({
        category: rulesResult.categoryName,
        confidence: rulesResult.confidenceScore,
        inference_id: `rules-${Date.now()}`,
        provider: "rules",
      });
    }

    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        category: rulesResult.categoryName || "Uncategorized",
        confidence: rulesResult.confidenceScore,
        inference_id: `rules-fallback-${Date.now()}`,
        provider: "rules",
      });
    }

    const llmResult = await llmCategorize(
      {
        merchant: parsed.data.merchant,
        amount: parsed.data.amount,
        type: parsed.data.type,
        channel: parsed.data.channel,
        timestamp: parsed.data.timestamp,
      },
      categoryOptions,
    );

    return NextResponse.json({
      category: llmResult.category,
      confidence: llmResult.confidence,
      inference_id: llmResult.inference_id,
      reasoning: llmResult.reasoning,
      provider: "openai",
    });
  } catch (error) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Categorization Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 30 });

async function handleGET() {
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.OPEN_AI_API_KEY ||
    process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
  return NextResponse.json({
    status: apiKey ? "operational" : "degraded",
    provider: apiKey ? "openai (gpt-4o-mini)" : "rules-only",
    fallback: "keyword-matching",
    timestamp: new Date().toISOString(),
  });
}

export const GET = withRateLimit(handleGET, { limit: 120 });
