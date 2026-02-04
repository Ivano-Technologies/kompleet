import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ReportsPage() {
  const supabase = await createServerClient();
  
  try {
    const user = await requireServerUser(supabase);

    return (
      <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link href="/dashboard" style={{ color: '#0070f3', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </div>

        <h1 style={{ marginBottom: '20px' }}>Reports</h1>

        <div style={{
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          <h2 style={{ marginBottom: '15px' }}>Protected Content</h2>
          <p>This page is protected and only accessible to authenticated users.</p>
          <p><strong>Current User:</strong> {user.email}</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginBottom: '10px' }}>🔒 Auth Protection Active</h3>
          <p>This page demonstrates server-side auth protection:</p>
          <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
            <li>Middleware blocks unauthenticated access</li>
            <li>Server component verifies session</li>
            <li>Redirects to /login if not authenticated</li>
            <li>Session persists across page refreshes</li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    // User not authenticated - redirect to login
    redirect('/login');
  }
}
