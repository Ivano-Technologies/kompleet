import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { redirect } from 'next/navigation';
import LogoutButton from './LogoutButton';

export default async function DashboardPage() {
  const supabase = await createServerClient();
  
  try {
    const user = await requireServerUser(supabase);

    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px' 
        }}>
          <h1>Dashboard</h1>
          <LogoutButton />
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginBottom: '15px' }}>Welcome!</h2>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#e8f4f8',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginBottom: '10px' }}>Protected Content</h3>
          <p>This page is only accessible to authenticated users.</p>
          <p>Your session is being managed by Supabase with server-side verification.</p>
        </div>
      </div>
    );
  } catch (error) {
    // User not authenticated - redirect to login
    redirect('/login');
  }
}
