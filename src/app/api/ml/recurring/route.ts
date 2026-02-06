import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { 
  detectRecurringPatterns, 
  saveRecurringPatterns,
  getRecurringPatterns 
} from '@/lib/ml/recurring-detection';

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Detect recurring patterns
    const patterns = await detectRecurringPatterns(user.id);
    
    // Save patterns
    const count = await saveRecurringPatterns(user.id, patterns);
    
    return NextResponse.json({
      success: true,
      patterns_detected: count,
      patterns
    });
    
  } catch (error) {
    console.error('[Recurring Detection API Error]', error);
    return NextResponse.json(
      { error: 'Failed to detect recurring patterns' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get saved patterns
    const patterns = await getRecurringPatterns(user.id);
    
    return NextResponse.json({
      patterns,
      count: patterns.length
    });
    
  } catch (error) {
    console.error('[Get Recurring Patterns API Error]', error);
    return NextResponse.json(
      { error: 'Failed to get recurring patterns' },
      { status: 500 }
    );
  }
}
