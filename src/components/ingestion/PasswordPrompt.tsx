'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface PasswordPromptProps {
  fileName: string;
  onSubmit: (password: string) => Promise<void>;
  onCancel: () => void;
  isOpen: boolean;
  attemptsRemaining: number;
  isLoading: boolean;
  error?: string;
}

export default function PasswordPrompt({
  fileName,
  onSubmit,
  onCancel,
  isOpen,
  attemptsRemaining,
  isLoading,
  error,
}: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-focus on open
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setLocalError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to unlock file');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit(e as any);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border border-white/20 dark:border-slate-800/20">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <DialogTitle className="text-xl">This file is password protected</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter the password used to open this statement. We use it only to unlock the file and
            never store it.
          </p>

          {/* File name */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">File:</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{fileName}</p>
          </div>

          {/* Password input */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setLocalError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter password"
                  disabled={isSubmitting || isLoading}
                  className="pr-10"
                  autoFocus
                  aria-label="Enter password to unlock file"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Show password checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={e => setShowPassword(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Show password</span>
            </label>

            {/* Error message */}
            {(localError || error) && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 dark:text-red-200">{localError || error}</p>
              </div>
            )}

            {/* Attempts remaining */}
            {attemptsRemaining < 3 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
              </p>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!password || isSubmitting || isLoading || attemptsRemaining <= 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Unlocking...
                  </>
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </form>

          {/* Support link */}
          {attemptsRemaining <= 0 && (
            <div className="text-center pt-2">
              <a href="/support" className="text-sm text-green-600 hover:text-green-700 dark:text-green-400">
                Need help? Contact support
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
