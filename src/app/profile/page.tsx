import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { getUserProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createServerClient();
  
  try {
    const user = await requireServerUser(supabase);

    // Fetch user profile from database
    // This demonstrates RLS in action - user can only fetch their own profile
    const profileResult = await getUserProfile(supabase, user.id);

    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>

        <h1 style={{ marginBottom: '20px' }}>User Profile</h1>

        {profileResult.success && profileResult.data ? (
          <div style={{
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <h2 style={{ marginBottom: '15px' }}>Profile Information</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>User ID:</strong> {profileResult.data.id}
              </div>
              <div>
                <strong>Subscription Tier:</strong>{' '}
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}>
                  {profileResult.data.subscription_tier}
                </span>
              </div>
              <div>
                <strong>Entity Type:</strong> {profileResult.data.entity_type}
              </div>
              <div>
                <strong>Fiscal Year Start:</strong> {profileResult.data.fiscal_year_start_month}
              </div>
              <div>
                <strong>Onboarding Complete:</strong>{' '}
                {profileResult.data.onboarding_completed ? '✅ Yes' : '❌ No'}
              </div>
              <div>
                <strong>Created:</strong> {new Date(profileResult.data.created_at).toLocaleString()}
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date(profileResult.data.updated_at).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <h3>Profile Not Found</h3>
            <p>No profile found for this user. This may indicate:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>Profile hasn't been created yet</li>
              <li>Database connection issue</li>
              <li>RLS policy blocking access (security working correctly)</li>
            </ul>
            {!profileResult.success && profileResult.error && (
              <p style={{ marginTop: '10px', color: '#c00' }}>
                <strong>Error:</strong> {profileResult.error}
              </p>
            )}
          </div>
        )}

        <div style={{
          padding: '20px',
          backgroundColor: '#e8f4f8',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginBottom: '10px' }}>🔒 RLS Protection Active</h3>
          <p>This page demonstrates database access with Row Level Security:</p>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Profile query uses <code>auth.uid()</code> to enforce ownership</li>
            <li>User can only fetch their own profile data</li>
            <li>Attempting to fetch another user's profile returns empty result</li>
            <li>Server-side queries use explicit client parameter (no globals)</li>
          </ul>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginBottom: '10px' }}>Database Query Pattern</h3>
          <pre style={{
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '14px',
          }}>
{`// Server-side query with explicit client
const result = await getUserProfile(supabase, userId);

// RLS policy enforces:
// WHERE auth.uid() = id

// Result:
// - Success: User's own profile
// - Failure: Empty result (not an error)`}
          </pre>
        </div>
      </div>
    );
  } catch (error) {
    // User not authenticated - redirect to login
    redirect('/login');
  }
}
