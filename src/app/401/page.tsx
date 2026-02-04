import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div style={{ maxWidth: '600px', margin: '100px auto', padding: '20px', textAlign: 'center' }}>
      <div style={{
        padding: '40px',
        backgroundColor: '#fff3cd',
        border: '2px solid #ffc107',
        borderRadius: '8px',
      }}>
        <h1 style={{ fontSize: '72px', margin: '0 0 20px 0', color: '#856404' }}>401</h1>
        <h2 style={{ marginBottom: '15px', color: '#856404' }}>Unauthorized</h2>
        <p style={{ marginBottom: '30px', color: '#666' }}>
          You need to be logged in to access this page.
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
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
            href="/"
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
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
