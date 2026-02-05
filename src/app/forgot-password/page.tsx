'use client';

import { useState, FormEvent } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createBrowserClient();
      
      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Forgot Password</h1>
      
      {error && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c00',
        }}>
          {error}
        </div>
      )}

      {success ? (
        <div>
          <div style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#efe',
            border: '1px solid #cfc',
            borderRadius: '4px',
            color: '#060',
          }}>
            <strong>Check your email!</strong>
            <p style={{ marginTop: '10px', marginBottom: 0 }}>
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </p>
          </div>

          <p style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link href="/login" style={{ color: '#0070f3' }}>
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
                backgroundColor: loading ? '#ccc' : '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#0070f3' }}>
              Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
