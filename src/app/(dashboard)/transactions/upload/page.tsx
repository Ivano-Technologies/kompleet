"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  UploadCloud,
  File as FileIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { SUPPORTED_BANKS } from "@/lib/transaction-import/bank-configs";

interface UploadResult {
  success: boolean;
  sessionId?: string;
  imported: number;
  duplicates: number;
  pendingReview?: number;
  errors: number;
  balanceValidation?: {
    valid: boolean;
    openingBalance?: number;
    closingBalance?: number;
    discrepancy?: number;
  };
  error?: string;
}

export default function TransactionUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [bankCode, setBankCode] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      if (
        !fileName.endsWith(".csv") &&
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls") &&
        !fileName.endsWith(".pdf")
      ) {
        setError("Please select a CSV, Excel, or PDF file");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!bankCode) {
      setError("Please select a bank");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bankCode", bankCode);

      const response = await fetch("/api/transactions/upload-v2", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data as UploadResult);
        setFile(null);
        const fileInput = document.getElementById(
          "file-input",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setError(data.error || data.message || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error("Upload error:", err);
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
      if (
        !fileName.endsWith(".csv") &&
        !fileName.endsWith(".xlsx") &&
        !fileName.endsWith(".xls") &&
        !fileName.endsWith(".pdf")
      ) {
        setError("Please select a CSV, Excel, or PDF file");
        return;
      }

      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/transactions"
          className="text-primary-600 hover:text-primary-700 font-medium mb-4 inline-flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Link>
        <div className="flex items-center gap-4">
          <UploadCloud className="w-8 h-8 text-light-text-primary dark:text-dark-text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Upload Transactions
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Import transactions from your bank statement (CSV, Excel, or PDF)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-light-surface dark:bg-dark-surface rounded-xl p-5 border border-light-border dark:border-dark-border mb-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
            Select Bank
          </label>
          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full px-4 py-2 border border-light-border dark:border-dark-border rounded-lg bg-light-background dark:bg-dark-background focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select your bank...</option>
            {SUPPORTED_BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary mt-1">
            Select the bank that issued this statement
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-light-border dark:border-dark-border rounded-xl p-8 text-center hover:border-primary-500 transition-colors"
        >
          <input
            id="file-input"
            type="file"
            accept=".csv,.xlsx,.xls,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {file ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <FileIcon className="w-12 h-12 text-primary-600" />
              </div>
              <div>
                <p className="text-lg font-medium text-light-text-primary dark:text-dark-text-primary">
                  {file.name}
                </p>
                <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  const fileInput = document.getElementById(
                    "file-input",
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.value = "";
                }}
                className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 text-sm font-medium inline-flex items-center"
              >
                <X className="w-4 h-4 mr-1" />
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <UploadCloud className="w-12 h-12 text-light-text-tertiary dark:text-dark-text-tertiary" />
              </div>
              <div>
                <button
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Click to upload
                </button>
                <span className="text-light-text-secondary dark:text-dark-text-secondary">
                  {" "}
                  or drag and drop
                </span>
              </div>
              <p className="text-sm text-light-text-tertiary dark:text-dark-text-tertiary">
                CSV, Excel, or PDF files up to 10MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-lg">
            <p className="text-red-800 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!file || !bankCode || uploading}
            className="w-full btn-primary"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Transactions"
            )}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`rounded-xl p-6 ${result.success ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-900/30" : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30"}`}
        >
          <h3
            className={`text-lg font-semibold mb-4 flex items-center gap-2 ${result.success ? "text-primary-900 dark:text-primary-300" : "text-red-900 dark:text-red-300"}`}
          >
            {result.success ? (
              <>
                <CheckCircle2 className="w-5 h-5" /> Upload Complete
              </>
            ) : (
              "Upload Failed"
            )}
          </h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Imported:
              </span>
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {result.imported} transactions
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-text-secondary dark:text-dark-text-secondary">
                Duplicates skipped:
              </span>
              <span className="font-medium text-light-text-tertiary dark:text-dark-text-tertiary">
                {result.duplicates}
              </span>
            </div>
            {(result.pendingReview ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">
                  Pending review:
                </span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {result.pendingReview}
                </span>
              </div>
            )}
            {result.errors > 0 && (
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">
                  Errors:
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {result.errors}
                </span>
              </div>
            )}
            {result.balanceValidation && !result.balanceValidation.valid && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-amber-700 dark:text-amber-400 text-xs">
                  Balance validation mismatch detected. Please review your
                  transactions for accuracy.
                </p>
              </div>
            )}
            {result.sessionId && (
              <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary mt-2">
                Session: {result.sessionId}
              </p>
            )}
          </div>

          {result.success && result.imported > 0 && (
            <div className="mt-6 space-y-3">
              <button
                onClick={() => router.push("/transactions")}
                className="w-full btn-primary"
              >
                View Transactions
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/transactions/review")}
                  className="flex-1 btn-secondary"
                >
                  Review Uncategorized
                </button>
                {(result.duplicates > 0 || (result.pendingReview ?? 0) > 0) && (
                  <button
                    onClick={() => router.push("/transactions/duplicates")}
                    className="flex-1 bg-light-surface dark:bg-dark-surface text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-800 px-4 py-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm font-medium"
                  >
                    Resolve Duplicates (
                    {result.duplicates + (result.pendingReview ?? 0)})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-6 mt-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3">
          How to prepare your bank statement
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-400">
          <li>Download your bank statement in CSV, Excel, or PDF format</li>
          <li>
            For CSV/Excel: Make sure it includes Date, Description, Amount
            columns
          </li>
          <li>
            For PDF: Upload the statement as-is — AI will extract transactions
            automatically
          </li>
          <li>Select your bank from the dropdown above</li>
          <li>
            Upload the file and we&apos;ll automatically categorize your
            transactions
          </li>
        </ol>

        <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-900/50">
          <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
            Or add a single transaction from a receipt photo:{" "}
            <Link
              href="/transactions/add-from-receipt"
              className="font-medium underline hover:no-underline"
            >
              Add from receipt
            </Link>
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-400 font-medium mb-2">
            Supported banks:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-500">
            {SUPPORTED_BANKS.map((bank) => (
              <li key={bank.code}>{bank.name}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
