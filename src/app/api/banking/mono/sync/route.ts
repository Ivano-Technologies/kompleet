import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { getTransactions, syncAccount } from '@/lib/services/mono-service';
import { categorizeTransaction, type Category } from '@/lib/services/categorization-service';

/**
 * POST /api/banking/mono/sync
 * Sync transactions from a linked Mono bank account
 */
async function handlePOST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bankAccountId } = await request.json();

    if (!bankAccountId) {
      return NextResponse.json(
        { error: 'Missing bankAccountId' },
        { status: 400 }
      );
    }

    // Get the bank account record
    const { data: bankAccount, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', bankAccountId)
      .eq('user_id', user.id)
      .eq('provider', 'mono')
      .single();

    if (fetchError || !bankAccount) {
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      );
    }

    const monoAccountId = bankAccount.metadata?.mono_account_id;
    if (!monoAccountId) {
      return NextResponse.json(
        { error: 'Invalid Mono account configuration' },
        { status: 400 }
      );
    }

    // Trigger a fresh sync from the bank
    try {
      await syncAccount(monoAccountId);
    } catch {
      // Sync may fail if already in progress, continue with fetching
    }

    // Calculate date range: last sync or 90 days ago
    const lastSync = bankAccount.last_synced_at
      ? new Date(bankAccount.last_synced_at)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const startDate = formatMonoDate(lastSync);
    const endDate = formatMonoDate(new Date());

    // Fetch transactions from Mono
    const { transactions: monoTransactions, total } = await getTransactions(
      monoAccountId,
      { start: startDate, end: endDate, limit: 500 }
    );

    // Fetch user's categories for auto-categorization
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, category_type, tax_treatment, keywords');

    // Get existing external IDs to skip duplicates
    const { data: existingTxns } = await supabase
      .from('transactions')
      .select('external_id')
      .eq('bank_account_id', bankAccountId);

    const existingIds = new Set((existingTxns || []).map(t => t.external_id));

    // Filter out already-synced transactions
    const newTransactions = monoTransactions.filter(t => !existingIds.has(t.id));

    if (newTransactions.length === 0) {
      // Update last synced timestamp
      await supabase
        .from('bank_accounts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', bankAccountId);

      return NextResponse.json({
        success: true,
        synced: 0,
        total,
        message: 'No new transactions found',
      });
    }

    // Process and store new transactions
    const transactionsToInsert = newTransactions.map(t => {
      // Auto-categorize using rules engine
      const catResult = categorizeTransaction(
        t.narration,
        (categories || []) as Category[]
      );

      return {
        bank_account_id: bankAccountId,
        external_id: t.id,
        type: t.type,
        amount: (t.amount / 100).toFixed(2), // kobo to Naira
        currency: 'NGN',
        description: t.narration,
        date: t.date,
        category: catResult.categoryName || null,
        category_confidence: catResult.confidenceScore
          ? (catResult.confidenceScore / 100).toFixed(2)
          : null,
        is_categorized: catResult.confidenceScore >= 70,
        metadata: {
          mono_category: t.category,
          balance_after: t.balance / 100,
          source: 'mono_sync',
        },
      };
    });

    // Batch insert (max 500 at a time)
    const { error: insertError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert);

    if (insertError) {
      console.error('[Mono Sync] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to store transactions' },
        { status: 500 }
      );
    }

    // Update bank account last sync time and balance
    const latestBalance = monoTransactions[0]?.balance;
    await supabase
      .from('bank_accounts')
      .update({
        last_synced_at: new Date().toISOString(),
        ...(latestBalance !== undefined && {
          balance: (latestBalance / 100).toFixed(2),
        }),
      })
      .eq('id', bankAccountId);

    return NextResponse.json({
      success: true,
      synced: transactionsToInsert.length,
      total,
      categorized: transactionsToInsert.filter(t => t.is_categorized).length,
    });
  } catch (error) {
    console.error('[Mono Sync Error]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}

/** Format date as DD-MM-YYYY for Mono API */
function formatMonoDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
