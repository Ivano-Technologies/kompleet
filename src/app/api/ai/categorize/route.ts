import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { llmCategorize } from '@/lib/services/llm-categorization-service';
import { categorizeTransaction, type Category } from '@/lib/services/categorization-service';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const categorizeSchema = z.object({
  merchant: z.string().min(1, 'Merchant is required').max(500),
  amount: z.number(),
  type: z.enum(['debit', 'credit']).optional(),
  channel: z.string().optional(),
  timestamp: z.string().optional(),
});

// Admin client only for ml_inference_logs insert (user may not have insert permission)
const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function handlePOST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = categorizeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch user's categories for context (using per-request client with RLS)
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, category_type, tax_treatment, keywords');

    const categoryOptions = (categories || []).map(c => ({
      name: c.name,
      type: c.category_type,
      tax_treatment: c.tax_treatment,
    }));

    // Step 1: Try rules-based categorization first (free, fast)
    const rulesResult = categorizeTransaction(
      parsed.data.merchant,
      (categories || []) as Category[]
    );

    // If rules-based is confident enough, use it
    if (rulesResult.confidenceScore >= 70) {
      console.log('[Categorization] Rules-based hit', {
        merchant: parsed.data.merchant,
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
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
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
        merchant: parsed.data.merchant,
        amount: parsed.data.amount,
        type: parsed.data.type,
        channel: parsed.data.channel,
        timestamp: parsed.data.timestamp,
      },
      categoryOptions
    );

    console.log('[Categorization] LLM result', {
      merchant: parsed.data.merchant,
      category: llmResult.category,
      confidence: llmResult.confidence,
      inference_id: llmResult.inference_id,
    });

    // Log inference (non-blocking) — use admin client for cross-table insert
    getAdminClient().from('ml_inference_logs').insert({
      user_id: user.id,
      model_version: 'gpt-4o-mini',
      provider: 'openai',
      input: { merchant: parsed.data.merchant, amount: parsed.data.amount },
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
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
  return NextResponse.json({
    status: apiKey ? 'operational' : 'degraded',
    provider: apiKey ? 'openai (gpt-4o-mini)' : 'rules-only',
    fallback: 'keyword-matching',
    timestamp: new Date().toISOString(),
  });
}

export const GET = withRateLimit(handleGET, { limit: 120 });
