'use client';

import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PasswordPrompt from './PasswordPrompt';
import UploadProgress from './UploadProgress';
import UploadSuccess from './UploadSuccess';
import UploadError from './UploadError';

export type UploadState = 'idle' | 'uploading' | 'password_required' | 'parsing' | 'success' | 'error';

interface UploadWidgetProps {
  onSuccess?: (transactionCount: number) => void;
  onError?: (error: string) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

interface UploadWidgetState {
  state: UploadState;
  file?: File;
  progress: number;
  transactionCount?: number;
  error?: string;
  requiresPassword: boolean;
  passwordAttempts: number;
}

export default function UploadWidget({
  onSuccess,
  onError,
  maxFileSize = 100 * 1024 * 1024, // 100 MB
  acceptedFormats = ['pdf', 'xlsx', 'xls', 'csv', 'zip'],
}: UploadWidgetProps) {
  const [uploadState, setUploadState] = useState<UploadWidgetState>({
    state: 'idle',
    progress: 0,
    requiresPassword: false,
    passwordAttempts: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOverRef = useRef(false);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    // Validate file type
    const ext = file.name.toLowerCase().split('.').pop() || '';
    if (!acceptedFormats.includes(ext)) {
      setUploadState(prev => ({
        ...prev,
        state: 'error',
        error: `Invalid file type. Only ${acceptedFormats.join(', ').toUpperCase()} files are supported.`,
      }));
      onError?.(
        `Invalid file type. Only ${acceptedFormats.join(', ').toUpperCase()} files are supported.`
      );
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setUploadState(prev => ({
        ...prev,
        state: 'error',
        error: `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)} MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB).`,
      }));
      onError?.(
        `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)} MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB).`
      );
      return;
    }

    // Start upload
    setUploadState(prev => ({
      ...prev,
      state: 'uploading',
      file,
      progress: 0,
      error: undefined,
    }));

    await uploadFile(file);
  };

  // Upload file to API
  const uploadFile = async (file: File, password?: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (password) {
        formData.append('password', password);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 30, 90),
        }));
      }, 500);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadState(prev => ({ ...prev, progress: 100 }));

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPassword) {
          setUploadState(prev => ({
            ...prev,
            state: 'password_required',
            requiresPassword: true,
            passwordAttempts: 0,
          }));
          return;
        }

        throw new Error(data.message || 'Upload failed');
      }

      if (data.success) {
        setUploadState(prev => ({
          ...prev,
          state: 'success',
          transactionCount: data.transactionCount,
        }));
        onSuccess?.(data.transactionCount);
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUploadState(prev => ({
        ...prev,
        state: 'error',
        error: errorMessage,
      }));
      onError?.(errorMessage);
    }
  };

  // Handle password submission
  const handlePasswordSubmit = async (password: string) => {
    if (uploadState.passwordAttempts >= 3) {
      setUploadState(prev => ({
        ...prev,
        state: 'error',
        error: 'Too many failed password attempts. Please try again later.',
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      state: 'uploading',
      passwordAttempts: prev.passwordAttempts + 1,
    }));

    await uploadFile(uploadState.file!, password);
  };

  // Handle password cancel
  const handlePasswordCancel = () => {
    setUploadState(prev => ({
      ...prev,
      state: 'idle',
      file: undefined,
      requiresPassword: false,
      passwordAttempts: 0,
    }));
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = true;
  };

  const handleDragLeave = () => {
    dragOverRef.current = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragOverRef.current = false;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle retry
  const handleRetry = () => {
    setUploadState(prev => ({
      ...prev,
      state: 'idle',
      file: undefined,
      error: undefined,
      progress: 0,
    }));
    fileInputRef.current?.click();
  };

  // Handle upload another
  const handleUploadAnother = () => {
    setUploadState(prev => ({
      ...prev,
      state: 'idle',
      file: undefined,
      transactionCount: undefined,
      progress: 0,
    }));
    fileInputRef.current?.click();
  };

  // Render based on state
  if (uploadState.state === 'password_required' && uploadState.file) {
    return (
      <PasswordPrompt
        fileName={uploadState.file.name}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
        isOpen={true}
        attemptsRemaining={3 - uploadState.passwordAttempts}
        isLoading={false}
      />
    );
  }

  if (uploadState.state === 'uploading' || uploadState.state === 'parsing') {
    return <UploadProgress progress={uploadState.progress} />;
  }

  if (uploadState.state === 'success' && uploadState.transactionCount !== undefined) {
    return (
      <UploadSuccess
        transactionCount={uploadState.transactionCount}
        onReview={() => {
          // Navigate to review page
          window.location.href = '/transactions/review';
        }}
        onUploadAnother={handleUploadAnother}
      />
    );
  }

  if (uploadState.state === 'error') {
    return <UploadError error={uploadState.error} onRetry={handleRetry} />;
  }

  // Idle state - upload form
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20">
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Upload your bank statement
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              PDF, Excel, or CSV. Your file is processed securely and deleted after reading.
            </p>
          </div>

          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragOverRef.current
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-green-500 dark:hover:border-green-600'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              accept=".pdf,.xlsx,.xls,.csv,.zip"
              className="hidden"
              aria-label="Upload bank statement"
            />

            <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" />

            <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">
              Drag and drop your file here
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">or</p>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Browse Files
            </Button>
          </div>

          {/* File info */}
          <div className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <p>Max file size: {(maxFileSize / 1024 / 1024).toFixed(0)} MB</p>
            <p>Accepted formats: {acceptedFormats.map(f => f.toUpperCase()).join(', ')}</p>
          </div>

          {/* Security note */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900 dark:text-blue-200">
              🔒 We never store your bank statement or password.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
