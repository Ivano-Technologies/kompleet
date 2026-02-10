'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UploadResult {
  success: boolean;
  message: string;
  imported: number;
  duplicates: number;
  errors: number;
}

export default function TransactionUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [bankType, setBankType] = useState<string>('auto');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileName = selectedFile.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        setError('Please select a CSV or Excel file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bankType', bankType);

      const response = await fetch('/api/transactions/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResult = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        setError('Please select a CSV or Excel file');
        return;
      }
      
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/transactions"
          className="text-green-600 hover:text-green-700 font-medium mb-4 inline-block"
        >
          ← Back to Transactions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Upload Transactions</h1>
        <p className="text-gray-600 mt-2">
          Import transactions from your bank statement (CSV format)
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg p-6 mb-6">
        {/* Bank Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bank
          </label>
          <select
            value={bankType}
            onChange={(e) => setBankType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="auto">Auto-detect</option>
            <option value="gtbank">GTBank</option>
            <option value="zenith">Zenith Bank</option>
            <option value="access">Access Bank</option>
            <option value="firstbank">First Bank</option>
            <option value="uba">UBA</option>
            <option value="generic">Generic CSV</option>
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Auto-detect will try to identify your bank from the file format
          </p>
        </div>

        {/* File Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  const fileInput = document.getElementById('file-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <button
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Click to upload
                </button>
                <span className="text-gray-600"> or drag and drop</span>
              </div>
              <p className="text-sm text-gray-500">
                CSV or Excel files up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload Transactions'}
          </button>
        </div>
      </div>

      {/* Upload Result */}
      {result && (
        <div className={`rounded-lg p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
            {result.success ? '✅ Upload Complete' : '❌ Upload Failed'}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Imported:</span>
              <span className="font-medium text-green-600">{result.imported} transactions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Duplicates skipped:</span>
              <span className="font-medium text-gray-600">{result.duplicates}</span>
            </div>
            {result.errors > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-700">Errors:</span>
                <span className="font-medium text-red-600">{result.errors}</span>
              </div>
            )}
          </div>

          {result.success && result.imported > 0 && (
            <div className="mt-6">
              <button
                onClick={() => router.push('/transactions')}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                View Transactions
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          📋 How to prepare your bank statement
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Download your bank statement in CSV format</li>
          <li>Make sure it includes: Date, Description, Amount (or Debit/Credit columns)</li>
          <li>Remove any header rows that don't contain transaction data</li>
          <li>Select your bank from the dropdown above</li>
          <li>Upload the file and we'll automatically categorize your transactions</li>
        </ol>
        
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-2">Supported formats:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>GTBank CSV export</li>
            <li>Zenith Bank CSV export</li>
            <li>Access Bank CSV export</li>
            <li>First Bank CSV export</li>
            <li>UBA CSV export</li>
            <li>Generic CSV with Date, Description, Amount columns</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
