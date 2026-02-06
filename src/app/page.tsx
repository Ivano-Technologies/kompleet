import Link from 'next/link';

// Home page with new KOMPLEET branding
export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A6847 0%, #0d8a5d 100%)',
      color: 'white'
    }}>
      {/* Hero Section */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '80px 20px',
        textAlign: 'center' 
      }}>
        {/* Logo */}
        <div style={{
          width: '80px',
          height: '80px',
          backgroundColor: 'white',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px',
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#0A6847'
        }}>
          &lt;
        </div>

        <h1 style={{ 
          fontSize: '56px',
          fontWeight: 'bold',
          marginBottom: '20px',
          letterSpacing: '-1px'
        }}>
          KOMPLEET
        </h1>
        
        {/* Tagline */}
        <p style={{ 
          fontSize: '24px',
          marginBottom: '40px',
          fontWeight: '500',
          lineHeight: '1.5',
          maxWidth: '800px',
          margin: '0 auto 40px'
        }}>
          Kompleet records. Kompleet filings. Kompleet compliance.
        </p>

        <p style={{ 
          fontSize: '18px',
          marginBottom: '50px',
          opacity: 0.9,
          maxWidth: '700px',
          margin: '0 auto 50px',
          lineHeight: '1.6'
        }}>
          Professional tax compliance and financial management platform for Nigerian businesses and individuals. 
          Fully aligned with the 2026 Nigerian Tax Act.
        </p>
        
        {/* CTA Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          justifyContent: 'center', 
          marginBottom: '80px',
          flexWrap: 'wrap'
        }}>
          <Link 
            href="/signup" 
            style={{
              padding: '16px 40px',
              backgroundColor: 'white',
              color: '#0A6847',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s'
            }}
          >
            Get Started Free
          </Link>
          <Link 
            href="/login" 
            style={{
              padding: '16px 40px',
              backgroundColor: 'transparent',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '18px',
              fontWeight: '600',
              border: '2px solid white'
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Features Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginTop: '80px',
          textAlign: 'left'
        }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '15px' }}>📊</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
              Kompleet Records
            </h3>
            <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
              Track all transactions, manage categories, and maintain comprehensive financial records with real-time insights.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '15px' }}>📄</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
              Kompleet Filings
            </h3>
            <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
              Generate NRS-compliant e-invoices, automate tax calculations, and submit filings with digital signatures.
            </p>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '30px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ fontSize: '36px', marginBottom: '15px' }}>✅</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px' }}>
              Kompleet Compliance
            </h3>
            <p style={{ opacity: 0.9, lineHeight: '1.6' }}>
              Stay compliant with 2026 Nigerian Tax Act, receive deadline reminders, and maintain audit-ready records.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div style={{
          marginTop: '80px',
          padding: '50px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: '600', marginBottom: '40px' }}>
            Everything You Need for Tax Compliance
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            textAlign: 'left'
          }}>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>🧮 Tax Calculators</h4>
              <p style={{ opacity: 0.9, fontSize: '15px' }}>CIT, PIT, VAT, Capital Allowances, Stamp Duty, Property Tax</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>📱 Mobile App</h4>
              <p style={{ opacity: 0.9, fontSize: '15px' }}>iOS & Android apps for on-the-go management</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>🔐 Secure & Private</h4>
              <p style={{ opacity: 0.9, fontSize: '15px' }}>Bank-level encryption, NDPR compliant</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>📈 Reports & Analytics</h4>
              <p style={{ opacity: 0.9, fontSize: '15px' }}>Balance Sheet, P&L, Tax Summary with PDF export</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>🔔 Smart Reminders</h4>
              <p style={{ opacity: 0.9, fontSize: '15px' }}>Never miss a tax deadline with automated alerts</p>
            </div>
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>📋 E-Invoicing</h4>
              <p style={{ opacity: 0.9, fontSize: '15px' }}>NRS-compliant invoices with digital signatures</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '80px',
          paddingTop: '40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          opacity: 0.8,
          fontSize: '14px'
        }}>
          <p style={{ marginBottom: '10px' }}>
            © 2026 Ivano Technologies Ltd. All rights reserved.
          </p>
          <p>
            Kompleet records. Kompleet filings. Kompleet compliance.
          </p>
        </div>
      </div>
    </main>
  );
}
