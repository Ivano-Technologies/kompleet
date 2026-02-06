import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserEmail } from '@/lib/email/gmail';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=gmail_${error}`, request.url)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=gmail_missing_params', request.url)
      );
    }
    
    // Verify state token (CSRF protection)
    const storedState = request.cookies.get('gmail_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=gmail_invalid_state', request.url)
      );
    }
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    // Get user's email address
    const emailAddress = await getUserEmail(tokens.access_token);
    
    // Get current user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=unauthorized', request.url)
      );
    }
    
    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);
    
    // Store email connection in database
    const { error: dbError } = await supabase
      .from('email_connections')
      .upsert({
        user_id: user.id,
        provider: 'gmail',
        email_address: emailAddress,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: new Date(tokens.expiry_date).toISOString(),
        last_sync_at: null
      }, {
        onConflict: 'user_id,provider'
      });
    
    if (dbError) {
      console.error('[Gmail Callback DB Error]', dbError);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=gmail_db_error', request.url)
      );
    }
    
    // Clear state cookie
    const response = NextResponse.redirect(
      new URL('/dashboard/settings?success=gmail_connected', request.url)
    );
    response.cookies.delete('gmail_oauth_state');
    
    return response;
    
  } catch (error) {
    console.error('[Gmail Callback Error]', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=gmail_callback_failed', request.url)
    );
  }
}
