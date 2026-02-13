import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { llmCategorize } from '@/lib/services/llm-categorization-service';
import { categorizeTransaction, type Category } from '@/lib/services/categorization-service';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.merchant || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: merchant, amount' },
        { status: 400 }
      );
    }

    // Fetch user's categories for context
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name, category_type, tax_treatment, keywords');

    const categoryOptions = (categories || []).map(c => ({
      name: c.name,
      type: c.category_type,
      tax_treatment: c.tax_treatment,
    }));

    // Step 1: Try rules-based categorization first (free, fast)
    const rulesResult = categorizeTransaction(
      body.merchant,
      (categories || []) as Category[]
    );

    // If rules-based is confident enough, use it
    if (rulesResult.confidenceScore >= 70) {
      console.log('[Categorization] Rules-based hit', {
        merchant: body.merchant,
        category: rulesResult.categoryName,
        confidence: rulesResult.confidenceScore,
      });

      return NextResponse.json({
        category: rulesResult.categoryName,
        confidence: rulesResult.confidenceScore,
        inference_id: `rules-${Date.now()}`,
        provider: 'rules',
      });
    }

    // Step 2: Fall back to LLM for low-confidence items
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY;
    if (!apiKey) {
      // No API key — return rules result even if low confidence
      return NextResponse.json({
        category: rulesResult.categoryName || 'Uncategorized',
        confidence: rulesResult.confidenceScore,
        inference_id: `rules-fallback-${Date.now()}`,
        provider: 'rules',
      });
    }

    const llmResult = await llmCategorize(
      {
        merchant: body.merchant,
        amount: body.amount,
        type: body.type,
        channel: body.channel,
        timestamp: body.timestamp,
      },
      categoryOptions
    );

    console.log('[Categorization] LLM result', {
      merchant: body.merchant,
      category: llmResult.category,
      confidence: llmResult.confidence,
      inference_id: llmResult.inference_id,
    });

    // Log inference (non-blocking)
    supabaseAdmin.from('ml_inference_logs').insert({
      user_id: body.user_id || null,
      model_version: 'gpt-4o-mini',
      provider: 'openai',
      input: { merchant: body.merchant, amount: body.amount },
      output: { category: llmResult.category, confidence: llmResult.confidence },
      confidence: llmResult.confidence,
      latency_ms: 0,
      success: true,
    });

    return NextResponse.json({
      category: llmResult.category,
      confidence: llmResult.confidence,
      inference_id: llmResult.inference_id,
      reasoning: llmResult.reasoning,
      provider: 'openai',
    });

  } catch (error) {
    console.error('[Categorization Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 30 });

async function handleGET() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY;
  return NextResponse.json({
    status: apiKey ? 'operational' : 'degraded',
    provider: apiKey ? 'openai (gpt-4o-mini)' : 'rules-only',
    fallback: 'keyword-matching',
    timestamp: new Date().toISOString(),
  });
}

export const GET = withRateLimit(handleGET, { limit: 120 });
