'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  balance: string;
  currency: string;
  status: string;
  last_synced_at: string | null;
  created_at: string;
}

export default function ConnectBankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const monoPublicKey = process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY;

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/banking/mono/accounts');
      const data = await res.json();
      if (res.ok) {
        setAccounts(data.accounts);
      }
    } catch {
      // Silently fail on initial load
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleConnect = async () => {
    if (!monoPublicKey) {
      setError('Mono is not configured. Please add NEXT_PUBLIC_MONO_PUBLIC_KEY to your environment.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Dynamically import Mono Connect widget
      const ConnectModule = await import('@mono.co/connect.js');
      const Connect = ConnectModule.default;

      const connect = new Connect({
        key: monoPublicKey,
        scope: 'auth',
        onSuccess: async ({ code }: { code: string }) => {
          try {
            // Exchange code for account
            const res = await fetch('/api/banking/mono/exchange', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (res.ok) {
              setSuccess(`Successfully linked ${data.account.bankName} - ${data.account.accountNumber}`);
              fetchAccounts();
            } else {
              setError(data.error || 'Failed to link account');
            }
          } catch {
            setError('Failed to complete bank linking');
          } finally {
            setConnecting(false);
          }
        },
        onClose: () => {
          setConnecting(false);
        },
      });

      connect.setup();
      connect.open();
    } catch {
      setError('Failed to load bank connection widget');
      setConnecting(false);
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/banking/mono/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAccountId: accountId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`Synced ${data.synced} new transactions (${data.categorized} auto-categorized)`);
        fetchAccounts();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch {
      setError('Failed to sync transactions');
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const maskAccountNumber = (num: string) => {
    if (num.length <= 4) return num;
    return '****' + num.slice(-4);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          &larr; Back to Transactions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Connect Bank Account</h1>
        <p className="text-gray-600 mt-2">
          Link your Nigerian bank account to automatically sync transactions
        </p>
      </div>

      {/* Connect Button */}
      <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Link a New Bank Account</h2>
            <p className="text-gray-600 text-sm mt-1">
              Securely connect your bank through Mono. Your credentials are encrypted and never stored on our servers.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting...' : 'Connect Bank Account'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Linked Accounts</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No bank accounts linked yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Click &ldquo;Connect Bank Account&rdquo; above to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{account.bank_name}</p>
                    <p className="text-sm text-gray-500">
                      {account.account_name} &middot; {maskAccountNumber(account.account_number)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last synced: {formatDate(account.last_synced_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-semibold text-gray-900">
                      {account.currency === 'NGN' ? '\u20A6' : account.currency}{' '}
                      {Number(account.balance).toLocaleString('en-NG', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        account.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  >
                    {syncing === account.id ? 'Syncing...' : 'Sync'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          How bank connection works
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 mt-0.5">1.</span>
            <span>Click &ldquo;Connect Bank Account&rdquo; and select your bank from the secure Mono widget</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 mt-0.5">2.</span>
            <span>Log in with your internet/mobile banking credentials (encrypted, never stored by us)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 mt-0.5">3.</span>
            <span>Your transactions are automatically imported and categorized</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 mt-0.5">4.</span>
            <span>Click &ldquo;Sync&rdquo; anytime to fetch the latest transactions</span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-blue-600">
          Powered by Mono &middot; Bank-grade encryption &middot; Read-only access
        </p>
      </div>
    </div>
  );
}
