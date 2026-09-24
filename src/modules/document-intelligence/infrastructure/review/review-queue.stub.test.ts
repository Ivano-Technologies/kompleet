/** @vitest-environment node */

import { describe, expect, it, vi } from "vitest";
import { ReviewQueueStub } from "./review-queue.stub";

describe("ReviewQueueStub", () => {
  it("persists review intent through the audit port", async () => {
    const record = vi.fn().mockResolvedValue(undefined);
    const stub = new ReviewQueueStub({ record });
    await stub.enqueueForReview({
      documentId: "doc-1",
      userId: "user-1",
      reason: "vat_mismatch",
    });
    expect(record).toHaveBeenCalledWith({
      userId: "user-1",
      documentId: "doc-1",
      action: "document_manual_review_queued",
      metadata: { reason: "vat_mismatch" },
    });
  });

  it("logs only when no audit adapter is configured", async () => {
    const stub = new ReviewQueueStub();
    await expect(
      stub.enqueueForReview({
        documentId: "doc-1",
        userId: "user-1",
        reason: "low_confidence",
      }),
    ).resolves.toBeUndefined();
  });
});
