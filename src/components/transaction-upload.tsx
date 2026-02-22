/**
 * Transaction Upload Component
 * Drag-and-drop file upload with bank selection
 */

"use client";

import { useState } from "react";
import { SUPPORTED_BANKS } from "@/lib/transaction-import/bank-configs";

interface UploadResult {
  success: boolean;
  sessionId?: string;
  imported?: number;
  duplicates?: number;
  pendingReview?: number;
  errors?: number;
  error?: string;
}

export function TransactionUpload() {
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedBank) {
      alert("Please select a bank and choose a file");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bankCode", selectedBank);

      const response = await fetch("/api/transactions/upload-v2", {
        method: "POST",
        body: formData,
        credentials: "include", // Include cookies for authentication
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setFile(null);
      } else {
        setResult({ success: false, error: data.error || "Upload failed" });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Import Bank Statement
        </h2>
        <p className="text-muted">
          Upload your bank statement (CSV, Excel, or PDF) to automatically
          import transactions
        </p>
      </div>

      {/* Bank Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Your Bank
        </label>
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-surface text-foreground"
          disabled={uploading}
        >
          <option value="">-- Select Bank --</option>
          {SUPPORTED_BANKS.map((bank) => (
            <option key={bank.code} value={bank.code}>
              {bank.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? "border-primary bg-primary/10" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        {file ? (
          <div>
            <p className="text-lg font-medium text-foreground">{file.name}</p>
            <p className="text-sm text-muted">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-foreground mb-2">
              Drag and drop your file here
            </p>
            <p className="text-sm text-muted">or click to browse</p>
            <p className="text-xs text-muted mt-2">
              Supported formats: CSV, Excel (.xlsx, .xls) • Max size: 10MB
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!file || !selectedBank || uploading}
        className="w-full px-6 py-3 bg-primary text-background font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {uploading ? "Uploading..." : "Upload and Import"}
      </button>

      {/* Result */}
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? "bg-success/10 border border-success"
              : "bg-error/10 border border-error"
          }`}
        >
          {result.success ? (
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Import Successful!
              </h3>
              <ul className="text-sm text-muted space-y-1">
                <li>✓ Imported: {result.imported} transactions</li>
                <li>⚠ Duplicates skipped: {result.duplicates}</li>
                {result.pendingReview! > 0 && (
                  <li>⏳ Pending review: {result.pendingReview}</li>
                )}
                {result.errors! > 0 && <li>✗ Errors: {result.errors}</li>}
              </ul>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-error mb-2">Import Failed</h3>
              <p className="text-sm text-muted">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
