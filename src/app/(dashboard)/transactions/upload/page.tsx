"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { StatementDropZone } from "@/components/import/StatementDropZone";
import type { StatementUploadResult } from "@/components/import/StatementDropZone";
import { ImportToast } from "@/components/import/ImportToast";
import { DROP_COPY } from "@/components/import/statement-copy";

export default function AdvancedImportPage() {
  const [toast, setToast] = useState<StatementUploadResult | null>(null);

  const handleSuccess = useCallback((result: StatementUploadResult) => {
    setToast(result);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {DROP_COPY.advancedBack}
        </Link>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-text-3">
          {DROP_COPY.advancedEyebrow}
        </p>
        <h1 className="font-display text-2xl text-text-1 mt-2">
          {DROP_COPY.advancedTitle}
        </h1>
        <p className="text-sm text-text-2 mt-1">
          Use this page for password-protected PDFs or to pick a bank after AUTO
          fails.
        </p>
      </div>

      <StatementDropZone
        variant="hero"
        showWhy={false}
        showBankSelect
        title={DROP_COPY.booksStripTitle}
        subtitle={DROP_COPY.booksStripSub}
        onSuccess={handleSuccess}
      />

      {toast && (
        <ImportToast result={toast} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}
