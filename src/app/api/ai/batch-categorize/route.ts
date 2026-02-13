import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { llmBatchCategorize } from '@/lib/services/llm-categorization-service';
import { categorizeTransaction, type Category } from '@/lib/services/categorization-service';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.transactions || !Array.isArray(body.transactions)) {
      return NextResponse.json(
        { error: 'Missing or invalid transactions array' },
        { status: 400 }
      );
    }

    for (const txn of body.transactions) {
      if (!txn.merchant || txn.amount === undefined) {
        return NextResponse.json(
          { error: 'Each transaction must have merchant and amount' },
          { status: 400 }
        );
      }
    }

    // Fetch categories for context
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id, name, category_type, tax_treatment, keywords');

    const categoryOptions = (categories || []).map(c => ({
      name: c.name,
      type: c.category_type,
      tax_treatment: c.tax_treatment,
    }));

    // Step 1: Rules-based categorization for all transactions
    const rulesResults = body.transactions.map((txn: { merchant: string }) =>
      categorizeTransaction(txn.merchant, (categories || []) as Category[])
    );

    // Step 2: Identify low-confidence items that need LLM
    const needsLLM: number[] = [];
    rulesResults.forEach((r: { confidenceScore: number }, i: number) => {
      if (r.confidenceScore < 70) needsLLM.push(i);
    });

    // Step 3: If there are low-confidence items and we have an API key, use LLM
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
    let llmResults: Record<number, { category: string; confidence: number; reasoning: string; inference_id: string }> = {};

    if (needsLLM.length > 0 && apiKey) {
      const llmInputs = needsLLM.map(i => ({
        merchant: body.transactions[i].merchant,
        amount: body.transactions[i].amount,
        type: body.transactions[i].type,
        channel: body.transactions[i].channel,
        timestamp: body.transactions[i].timestamp,
      }));

      const batchResults = await llmBatchCategorize(llmInputs, categoryOptions);
      needsLLM.forEach((originalIdx, batchIdx) => {
        llmResults[originalIdx] = batchResults[batchIdx];
      });
    }

    // Step 4: Merge results
    const results = body.transactions.map((_: unknown, i: number) => {
      if (llmResults[i]) {
        return {
          category: llmResults[i].category,
          confidence: llmResults[i].confidence,
          inference_id: llmResults[i].inference_id,
          provider: 'openai',
        };
      }
      return {
        category: rulesResults[i].categoryName || 'Uncategorized',
        confidence: rulesResults[i].confidenceScore,
        inference_id: `rules-${Date.now()}-${i}`,
        provider: 'rules',
      };
    });

    console.log('[Batch Categorization]', {
      total: body.transactions.length,
      rules_handled: body.transactions.length - needsLLM.length,
      llm_handled: Object.keys(llmResults).length,
      llm_skipped: needsLLM.length - Object.keys(llmResults).length,
    });

    return NextResponse.json({
      count: results.length,
      model_version: apiKey ? 'gpt-4o-mini' : 'rules-only',
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('[Batch Categorization Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
