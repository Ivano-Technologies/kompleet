import { createServerClient } from '@/lib/supabase/server';
import { requireServerUser } from '@/lib/supabase/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { RecentCalculations } from '@/components/RecentCalculations';

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
          marginBottom: '20px',
        }}>
          <h3 style={{ marginBottom: '10px' }}>Protected Content</h3>
          <p>This page is only accessible to authenticated users.</p>
          <p>Your session is being managed by Supabase with server-side verification.</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <RecentCalculations />
        </div>

        <div style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
        }}>
          <h3 style={{ marginBottom: '15px' }}>Navigation</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/history" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 'bold' }}>
                📊 Calculation History
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/profile" style={{ color: '#0070f3', textDecoration: 'none' }}>
                → View Profile (Database + RLS)
              </Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/reports" style={{ color: '#0070f3', textDecoration: 'none' }}>
                → View Reports (Protected)
              </Link>
            </li>
            <li>
              <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
                → Home (Public)
              </Link>
            </li>
          </ul>

          <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Tax Calculators</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <li>
              <Link href="/calculators/business-tax" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px' }}>
                → Business Tax
              </Link>
            </li>
            <li>
              <Link href="/calculators/individual-tax" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px' }}>
                → Individual Tax
              </Link>
            </li>
            <li>
              <Link href="/calculators/vat" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px' }}>
                → VAT
              </Link>
            </li>
            <li>
              <Link href="/calculators/capital-allowances" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px' }}>
                → Capital Allowances
              </Link>
            </li>
            <li>
              <Link href="/calculators/stamp-duty" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px' }}>
                → Stamp Duty
              </Link>
            </li>
            <li>
              <Link href="/calculators/property-tax" style={{ color: '#0070f3', textDecoration: 'none', fontSize: '14px' }}>
                → Property Tax
              </Link>
            </li>
          </ul>
        </div>
      </div>
    );
  } catch (error) {
    // User not authenticated - redirect to login
    redirect('/login');
  }
}
