import Link from 'next/link';

// Home page
export default function Home() {
  return (
    <main style={{ maxWidth: '800px', margin: '100px auto', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '20px' }}>Welcome to Kompleet Platform</h1>
      <p style={{ marginBottom: '30px', fontSize: '18px', color: '#666' }}>
        Professional platform for transaction management and tax compliance
      </p>
      
      <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '40px' }}>
        <Link 
          href="/login" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
          }}
        >
          Login
        </Link>
        <Link 
          href="/signup" 
          style={{
            padding: '12px 24px',
            backgroundColor: '#fff',
            color: '#0070f3',
            textDecoration: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            border: '2px solid #0070f3',
          }}
        >
          Sign Up
        </Link>
      </div>

      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        textAlign: 'left',
      }}>
        <h3 style={{ marginBottom: '15px' }}>Features</h3>
        <ul style={{ paddingLeft: '20px' }}>
          <li>Secure authentication with Supabase</li>
          <li>Protected routes and middleware</li>
          <li>Transaction management</li>
          <li>Tax compliance tools</li>
        </ul>
      </div>
    </main>
  );
}
