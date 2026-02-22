"use client";

import React from "react";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface UploadErrorProps {
  error?: string;
  onRetry: () => void;
}

export default function UploadError({ error, onRetry }: UploadErrorProps) {
  // Determine troubleshooting steps based on error
  const getTroubleshootingSteps = (errorMessage?: string): string[] => {
    if (!errorMessage) {
      return [
        "Re-export the statement from your bank",
        "Try a different file format (CSV instead of PDF)",
        "Check that the file is not corrupted",
      ];
    }

    if (errorMessage.toLowerCase().includes("password")) {
      return [
        "Remove the copy protection in your PDF reader",
        "Export as a new PDF without encryption",
        "Try uploading a CSV export from your bank instead",
      ];
    }

    if (errorMessage.toLowerCase().includes("file type")) {
      return [
        "Only PDF, Excel, CSV, and ZIP files are supported",
        "Check the file extension",
        "Try re-exporting from your bank",
      ];
    }

    if (errorMessage.toLowerCase().includes("size")) {
      return [
        "File exceeds 100 MB limit",
        "Try uploading a smaller file",
        "Contact support for large files",
      ];
    }

    return [
      "Re-export the statement from your bank",
      "Try a different file format",
      "Check that the file is not corrupted",
    ];
  };

  const troubleshootingSteps = getTroubleshootingSteps(error);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20 dark:border-slate-800/20">
        <div className="p-8 sm:p-12">
          {/* Error icon */}
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-2">
            We couldn't read this file
          </h2>

          {/* Error message */}
          {error && (
            <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
              {error}
            </p>
          )}

          {/* Troubleshooting */}
          <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex gap-3 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                What you can try:
              </h3>
            </div>
            <ol className="space-y-2 ml-8 text-sm text-blue-900 dark:text-blue-200">
              {troubleshootingSteps.map((step, index) => (
                <li key={index} className="list-decimal">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={onRetry}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-6"
            >
              Try Again
            </Button>

            <Button
              variant="outline"
              className="w-full py-6"
              onClick={() => {
                window.location.href = "/support";
              }}
            >
              Contact Support
            </Button>
          </div>

          {/* Error details for support */}
          {error && (
            <div className="mt-6 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 font-mono">
              <p className="font-semibold mb-1">Error details (for support):</p>
              <p className="break-words">{error}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
