import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/email/outlook';
import { randomBytes } from 'crypto';
import { withRateLimit } from '@/lib/with-rate-limit';
import { createServerClient } from '@/lib/supabase/server';

async function handlePOST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate state token for CSRF protection
    const state = randomBytes(32).toString('hex');
    
    // Store state in session/cookie
    const response = NextResponse.json({
      authorization_url: getAuthorizationUrl(state),
      state
    });
    
    // Set state cookie
    response.cookies.set('outlook_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });
    
    return response;
    
  } catch (error) {
    console.error('[Outlook Connect Error]', error);
    return NextResponse.json(
      { error: 'Failed to initialize Outlook connection' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, { limit: 10 });
