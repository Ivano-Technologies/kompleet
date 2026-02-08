import Link from 'next/link';

// Nigerian-Inspired KOMPLEET Landing Page with Glassmorphism
export default function Home() {
  return (
    <main style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1B5E4F 0%, #00A86B 50%, #0D3B2E 100%)',
      color: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle Nigerian Pattern Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 30-30 30L0 30z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
        pointerEvents: 'none'
      }} />

      {/* Hero Section */}
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '100px 32px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo with Glass Effect */}
        <div style={{
          width: '160px',
          height: '160px',
          margin: '0 auto 40px',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          borderRadius: '32px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <img 
            src="/assets/logo-primary.png" 
            alt="KOMPLEET Logo" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Year Badge */}
        <div style={{
          display: 'inline-block',
          padding: '8px 24px',
          background: 'linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)',
          borderRadius: '24px',
          fontSize: '14px',
          fontWeight: '700',
          marginBottom: '24px',
          boxShadow: '0 4px 16px rgba(255, 107, 53, 0.4)',
          letterSpacing: '1px'
        }}>
          2026
        </div>

        <h1 style={{ 
          fontSize: '72px',
          fontWeight: '800',
          marginBottom: '24px',
          letterSpacing: '-2px',
          lineHeight: '1.1',
          textShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
        }}>
          KOMPLEET
        </h1>
        
        {/* Tagline */}
        <p style={{ 
          fontSize: '30px',
          marginBottom: '20px',
          fontWeight: '600',
          lineHeight: '1.4',
          maxWidth: '900px',
          margin: '0 auto 20px',
          fontFamily: "'Playfair Display', serif",
          fontStyle: 'italic'
        }}>
          Kompleet records. Kompleet filings. Kompleet compliance.
        </p>

        <p style={{ 
          fontSize: '20px',
          marginBottom: '60px',
          opacity: 0.95,
          maxWidth: '800px',
          margin: '0 auto 60px',
          lineHeight: '1.7',
          fontWeight: '400'
        }}>
          Professional tax compliance and financial management platform for Nigerian businesses and individuals. 
          Fully aligned with the 2026 Nigerian Tax Act.
        </p>
        
        {/* CTA Buttons with Glassmorphism */}
        <div style={{ 
          display: 'flex', 
          gap: '24px', 
          justifyContent: 'center', 
          marginBottom: '100px',
          flexWrap: 'wrap'
        }}>
          <Link 
            href="/sign-in" 
            className="cta-button-primary"
            style={{
              padding: '18px 48px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block',
              border: 'none'
            }}
          >
            Get Started Free
          </Link>
          <Link 
            href="/sign-in" 
            className="cta-button-secondary"
            style={{
              padding: '18px 48px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block'
            }}
          >
            Sign In
          </Link>
        </div>

        {/* Features Grid with Enhanced Glassmorphism */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          marginTop: '100px',
          textAlign: 'left'
        }}>
          <div className="feature-card" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>📊</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
              Kompleet Records
            </h3>
            <p style={{ opacity: 0.95, lineHeight: '1.7', fontSize: '16px' }}>
              Track all transactions, manage categories, and maintain comprehensive financial records with real-time insights.
            </p>
          </div>

          <div className="feature-card" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #004E89 0%, #00A86B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>📄</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
              Kompleet Filings
            </h3>
            <p style={{ opacity: 0.95, lineHeight: '1.7', fontSize: '16px' }}>
              Generate NRS-compliant e-invoices, automate tax calculations, and submit filings with digital signatures.
            </p>
          </div>

          <div className="feature-card" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            padding: '40px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '20px',
              background: 'linear-gradient(135deg, #00A86B 0%, #F7B801 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>✅</div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
              Kompleet Compliance
            </h3>
            <p style={{ opacity: 0.95, lineHeight: '1.7', fontSize: '16px' }}>
              Stay compliant with 2026 Nigerian Tax Act, receive deadline reminders, and maintain audit-ready records.
            </p>
          </div>
        </div>

        {/* Key Features Section with Glass Container */}
        <div style={{
          marginTop: '100px',
          padding: '60px 50px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '32px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <h2 style={{ 
            fontSize: '42px', 
            fontWeight: '800', 
            marginBottom: '50px',
            textAlign: 'center',
            color: 'white'
          }}>
            Why Choose KOMPLEET?
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px',
            textAlign: 'left'
          }}>
            <div>
              <div style={{ 
                fontSize: '32px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700'
              }}>🇳🇬</div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'white' }}>
                Nigerian-First Design
              </h4>
              <p style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '16px' }}>
                Built specifically for Nigerian tax regulations and business practices
              </p>
            </div>

            <div>
              <div style={{ 
                fontSize: '32px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #004E89 0%, #00A86B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700'
              }}>🔒</div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'white' }}>
                Bank-Level Security
              </h4>
              <p style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '16px' }}>
                Your financial data is encrypted and protected with enterprise-grade security
              </p>
            </div>

            <div>
              <div style={{ 
                fontSize: '32px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #00A86B 0%, #F7B801 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700'
              }}>⚡</div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'white' }}>
                Real-Time Updates
              </h4>
              <p style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '16px' }}>
                Stay current with automatic tax law updates and compliance changes
              </p>
            </div>

            <div>
              <div style={{ 
                fontSize: '32px', 
                marginBottom: '16px',
                background: 'linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '700'
              }}>📱</div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: 'white' }}>
                Mobile & Web Access
              </h4>
              <p style={{ opacity: 0.9, lineHeight: '1.6', fontSize: '16px' }}>
                Manage your finances anywhere, anytime, on any device
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          marginTop: '100px',
          padding: '60px 40px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            fontSize: '42px', 
            fontWeight: '800', 
            marginBottom: '24px',
            color: 'white'
          }}>
            Ready to Get Started?
          </h2>
          <p style={{ 
            fontSize: '20px', 
            marginBottom: '40px', 
            opacity: 0.95,
            maxWidth: '700px',
            margin: '0 auto 40px',
            lineHeight: '1.7'
          }}>
            Join thousands of Nigerian businesses and individuals who trust KOMPLEET for their tax compliance needs.
          </p>
          <Link 
            href="/sign-in" 
            className="cta-button-primary"
            style={{
              padding: '20px 60px',
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7B801 100%)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '20px',
              fontWeight: '700',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'inline-block',
              border: 'none'
            }}
          >
            Start Free Trial
          </Link>
        </div>
      </div>

      <style jsx>{`
        .cta-button-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 12px 32px rgba(255, 107, 53, 0.5);
        }
        
        .cta-button-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </main>
  );
}
