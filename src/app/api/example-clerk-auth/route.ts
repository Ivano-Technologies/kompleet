/**
 * Example API route demonstrating Clerk authentication with Supabase
 * This shows how to use Clerk JWT to access Supabase with RLS
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createSupabaseClerkClient } from '@/lib/supabase-clerk';

export async function GET() {
  // Get Clerk authentication
  const { userId, getToken } = await auth();

  // Check if user is authenticated
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Create Supabase client with Clerk JWT
    const supabase = await createSupabaseClerkClient(getToken);

    // Example: Fetch user's transactions (RLS will automatically filter by clerk_user_id)
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    // Example: Fetch user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (profile doesn't exist yet)
      console.error('Profile fetch error:', profileError);
    }

    return NextResponse.json({
      success: true,
      userId,
      profile,
      transactions,
      message: 'Successfully authenticated with Clerk and accessed Supabase',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
