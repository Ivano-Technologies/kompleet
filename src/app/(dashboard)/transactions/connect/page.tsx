"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, Loader2, RefreshCw } from "lucide-react";

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
      const res = await fetch("/api/banking/mono/accounts");
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
      setError(
        "Mono is not configured. Please add NEXT_PUBLIC_MONO_PUBLIC_KEY to your environment.",
      );
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Dynamically import Mono Connect widget
      const ConnectModule = await import("@mono.co/connect.js");
      const Connect = ConnectModule.default;

      const connect = new Connect({
        key: monoPublicKey,
        scope: "auth",
        onSuccess: async ({ code }: { code: string }) => {
          try {
            // Exchange code for account
            const res = await fetch("/api/banking/mono/exchange", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (res.ok) {
              setSuccess(
                `Successfully linked ${data.account.bankName} - ${data.account.accountNumber}`,
              );
              fetchAccounts();
            } else {
              setError(data.error || "Failed to link account");
            }
          } catch {
            setError("Failed to complete bank linking");
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
      setError("Failed to load bank connection widget");
      setConnecting(false);
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/banking/mono/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankAccountId: accountId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(
          `Synced ${data.synced} new transactions (${data.categorized} auto-categorized)`,
        );
        fetchAccounts();
      } else {
        setError(data.error || "Sync failed");
      }
    } catch {
      setError("Failed to sync transactions");
    } finally {
      setSyncing(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const maskAccountNumber = (num: string) => {
    if (num.length <= 4) return num;
    return "****" + num.slice(-4);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium mb-4"
        >
          <ArrowLeft size={16} />
          Back to Transactions
        </Link>
        <div className="flex items-center gap-4">
          <Banknote className="w-8 h-8 text-light-text-primary dark:text-dark-text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Connect Bank Account
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Link your Nigerian bank account to automatically sync transactions
            </p>
          </div>
        </div>
      </div>

      {/* Connect Button Card */}
      <div className="p-5 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Banknote className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
              Link a New Bank Account
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              Securely connect your bank through Mono. Your credentials are
              encrypted and never stored on our servers.
            </p>
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="btn-primary mt-4"
            >
              {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {connecting ? "Connecting..." : "Connect Bank Account"}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg">
          <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
          <p className="text-green-800 dark:text-green-300 text-sm">
            {success}
          </p>
        </div>
      )}

      {/* Linked Accounts */}
      <div className="rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface">
        <div className="p-5 border-b border-light-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">
            Linked Accounts
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-light-text-tertiary dark:text-dark-text-tertiary flex items-center justify-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-light-text-secondary dark:text-dark-text-secondary">
              No bank accounts linked yet.
            </p>
            <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
              Click &ldquo;Connect Bank Account&rdquo; above to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-light-background dark:bg-dark-background rounded-lg flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-light-text-primary dark:text-dark-text-primary">
                      {account.bank_name}
                    </p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {account.account_name} &middot;{" "}
                      {maskAccountNumber(account.account_number)}
                    </p>
                    <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-0.5">
                      Last synced: {formatDate(account.last_synced_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right mr-2">
                    <p className="font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {account.currency === "NGN" ? "\u20A6" : account.currency}{" "}
                      {Number(account.balance).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        account.status === "active"
                          ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                          : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                      }`}
                    >
                      {account.status}
                    </span>
                  </div>
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                    className="btn-secondary"
                  >
                    {syncing === account.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw size={14} className="mr-2" />
                    )}
                    {syncing === account.id ? "Syncing..." : "Sync"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
          How bank connection works
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              1.
            </span>
            <span>
              Click &ldquo;Connect Bank Account&rdquo; and select your bank from
              the secure Mono widget
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              2.
            </span>
            <span>
              Log in with your internet/mobile banking credentials (encrypted,
              never stored by us)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              3.
            </span>
            <span>
              Your transactions are automatically imported and categorized
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              4.
            </span>
            <span>
              Click &ldquo;Sync&rdquo; anytime to fetch the latest transactions
            </span>
          </li>
        </ul>
        <p className="mt-4 text-xs text-blue-600 dark:text-blue-400">
          Powered by Mono &middot; Bank-grade encryption &middot; Read-only
          access
        </p>
      </div>
    </div>
  );
}
