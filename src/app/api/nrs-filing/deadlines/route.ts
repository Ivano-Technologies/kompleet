/**
 * Filing Deadlines API
 * GET /api/nrs-filing/deadlines
 * Returns tax filing deadlines
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import {
  getFilingDeadlines,
  getUpcomingDeadlines,
  getOverdueDeadlines,
  getDeadlineStatus,
  daysUntilDeadline,
  formatDeadline,
} from '@/lib/nrs-filing/deadline-manager';
import { withRateLimit } from '@/lib/with-rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handleGET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const taxYear = parseInt(searchParams.get('taxYear') || new Date().getFullYear().toString(), 10);
    const filter = searchParams.get('filter'); // 'upcoming', 'overdue', or null for all

    // Get all deadlines for the tax year
    const allDeadlines = getFilingDeadlines(taxYear);

    // Filter deadlines based on request
    let filteredDeadlines = allDeadlines;

    if (filter === 'upcoming') {
      filteredDeadlines = getUpcomingDeadlines(allDeadlines, 30);
    } else if (filter === 'overdue') {
      filteredDeadlines = getOverdueDeadlines(allDeadlines);
    }

    // Enrich deadlines with status and formatting
    const enrichedDeadlines = filteredDeadlines.map((deadline) => ({
      ...deadline,
      status: getDeadlineStatus(deadline),
      daysUntil: daysUntilDeadline(deadline),
      formattedDate: formatDeadline(deadline),
    }));

    // Get summary stats
    const stats = {
      total: allDeadlines.length,
      overdue: getOverdueDeadlines(allDeadlines).length,
      upcoming: getUpcomingDeadlines(allDeadlines, 30).length,
      urgent: getUpcomingDeadlines(allDeadlines, 7).length,
    };

    return NextResponse.json({
      deadlines: enrichedDeadlines,
      stats,
      taxYear,
    });

  } catch (error) {
    console.error('Get filing deadlines error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filing deadlines' },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(handleGET);
