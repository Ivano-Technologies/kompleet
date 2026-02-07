import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { getUserProfile } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { currentUser } from '@clerk/nextjs/server';
import { AvatarUpload } from '@/components/avatar-upload';

export default async function ProfilePage() {
  const supabase = await createServerClient();
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    redirect('/login');
  }

  try {
    const user = await requireServerUser(supabase);

    // Fetch user profile from database
    const profileResult = await getUserProfile(supabase, user.id);

    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
          <Link 
            href="/profile/edit" 
            style={{ 
              backgroundColor: '#0070f3', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '6px', 
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Edit Profile
          </Link>
        </div>

        <h1 style={{ marginBottom: '30px' }}>User Profile</h1>

        {/* Avatar Section */}
        <div style={{
          padding: '30px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <AvatarUpload />
        </div>

        {/* Profile Information */}
        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginBottom: '15px' }}>Profile Information</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <strong>Name:</strong> {clerkUser.firstName} {clerkUser.lastName}
            </div>
            <div>
              <strong>Email:</strong> {clerkUser.primaryEmailAddress?.emailAddress}
            </div>
            <div>
              <strong>User ID:</strong> {clerkUser.id}
            </div>
            {profileResult.success && profileResult.data && (
              <>
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
              </>
            )}
            <div>
              <strong>Account Created:</strong> {new Date(clerkUser.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Password Management */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h3 style={{ marginBottom: '10px' }}>🔐 Password & Security</h3>
          <p style={{ marginBottom: '15px' }}>Manage your password and security settings</p>
          <Link 
            href="/forgot-password"
            style={{
              display: 'inline-block',
              backgroundColor: '#ffc107',
              color: '#000',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: '500'
            }}
          >
            Change Password
          </Link>
        </div>

        {!profileResult.success && (
          <div style={{
            padding: '20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <h3>Profile Not Found</h3>
            <p>No profile found in database. This may indicate:</p>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              <li>Profile hasn't been created yet</li>
              <li>Database connection issue</li>
            </ul>
            {profileResult.error && (
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
          <p>This page demonstrates secure profile management:</p>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Profile data protected by Row Level Security</li>
            <li>Avatar managed through Clerk</li>
            <li>Password reset handled securely</li>
            <li>User can only access their own data</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
