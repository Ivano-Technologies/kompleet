import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { migrateYearData, type MigrationOptions } from '@/lib/data-migration-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      source_year,
      target_year,
      include_transactions = true,
      include_categories = true,
      include_forms = false,
      dry_run = true
    } = body;

    if (!source_year || !target_year) {
      return NextResponse.json(
        { error: 'source_year and target_year are required' },
        { status: 400 }
      );
    }

    if (source_year === target_year) {
      return NextResponse.json(
        { error: 'source_year and target_year must be different' },
        { status: 400 }
      );
    }

    const options: MigrationOptions = {
      sourceYear: source_year,
      targetYear: target_year,
      includeTransactions: include_transactions,
      includeCategories: include_categories,
      includeForms: include_forms,
      dryRun: dry_run
    };

    // Perform migration
    const result = await migrateYearData(user.id, options);

    // Log audit trail
    await supabase.from('audit_logs').insert({
      user_id: user.id,
      action: dry_run ? 'migration_dry_run' : 'migration_execute',
      resource_type: 'year_data',
      metadata: {
        source_year,
        target_year,
        result
      },
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/migration/migrate:', error);
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    );
  }
}
