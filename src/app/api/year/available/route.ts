import { NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { withRateLimit } from '@/lib/with-rate-limit';

async function handleGET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch available tax years for the user
    const { data: taxYears, error } = await supabase
      .from('user_tax_years')
      .select('tax_year')
      .eq('user_id', user.id)
      .order('tax_year', { ascending: false });

    if (error) {
      console.error('Error fetching tax years:', error);
      // Return default years if query fails
      const currentYear = new Date().getFullYear();
      return NextResponse.json({
        years: [currentYear - 2, currentYear - 1, currentYear]
      });
    }

    // Extract years from results
    const years = taxYears?.map(ty => ty.tax_year) || [];

    // If no years found, return default years
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      return NextResponse.json({
        years: [currentYear - 2, currentYear - 1, currentYear]
      });
    }

    return NextResponse.json({ years });
  } catch (error) {
    console.error('Error in /api/year/available:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 120 });
