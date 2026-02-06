import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUpcomingDeadlines } from '@/lib/deadline-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get upcoming deadlines
    const deadlines = await getUpcomingDeadlines(user.id);

    return NextResponse.json({
      success: true,
      deadlines,
      count: deadlines.length
    });

  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
