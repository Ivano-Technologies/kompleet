import { describe, expect, it } from "vitest";
import { createQueuedDocument } from "@/modules/document-intelligence/domain/document.entity";
import { InMemoryDocumentRepository } from "@/modules/document-intelligence/infrastructure/persistence/in-memory-document.repository";

describe("InMemoryDocumentRepository attempt ceiling", () => {
  it("marks document failed when claim attempts exceed ceiling", async () => {
    const repository = new InMemoryDocumentRepository();
    const document = createQueuedDocument({
      id: "doc-attempt-ceiling",
      userId: "user-1",
      documentType: "invoice",
      fileUrl: "memory://invoice.pdf",
      idempotencyKey: "idem-attempt-ceiling",
    });
    await repository.create(document);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const claimed = await repository.claimQueuedForProcessing(
        document.id,
        document.userId,
      );
      expect(claimed).toBeTruthy();
      const requeued = await repository.requeueStaleProcessingDocument({
        documentId: document.id,
        userId: document.userId,
      });
      expect(requeued).toBe(true);
    }

    const fourthClaim = await repository.claimQueuedForProcessing(
      document.id,
      document.userId,
    );
    expect(fourthClaim).toBeNull();

    const finalState = await repository.findById(document.id, document.userId);
    expect(finalState?.status).toBe("failed");
    expect(finalState?.errorMessage).toBe("max_processing_attempts_exceeded");
  });
});
