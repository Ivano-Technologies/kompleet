import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's notification preferences
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('reminder_preferences')
      .eq('id', user.id)
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Return default preferences if profile not found
      return NextResponse.json({
        success: true,
        preferences: {
          enabled: true,
          email: true,
          inApp: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      preferences: profile.reminder_preferences || {
        enabled: true,
        email: true,
        inApp: true
      }
    });

  } catch (error) {
    console.error('Get notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { enabled, email, inApp } = body;

    // Validate preferences
    if (typeof enabled !== 'boolean' || typeof email !== 'boolean' || typeof inApp !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // Update user's notification preferences
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        reminder_preferences: {
          enabled,
          email,
          inApp
        }
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: {
        enabled,
        email,
        inApp
      }
    });

  } catch (error) {
    console.error('Update notification preferences error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
