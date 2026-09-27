"use client";

import { TriageSheet } from "@/components/review/TriageSheet";

export default function TransactionReviewPage() {
  return (
    <div className="space-y-4">
      <TriageSheet open variant="page" onClose={() => undefined} />
    </div>
  );
}
