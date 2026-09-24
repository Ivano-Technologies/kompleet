/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConvexDocumentRepository } from "./convex-document.repository";
import { createQueuedDocument } from "../../domain/document.entity";

const query = vi.fn();
const mutation = vi.fn();

function repo(admin = false) {
  return new ConvexDocumentRepository({ query, mutation } as never, {
    admin,
    workerToken: admin ? "document-worker-token" : undefined,
  });
}

const record = {
  id: "doc-1",
  user_id: "user-1",
  status: "queued",
  document_type: "invoice",
  file_url: "https://files/invoice.pdf",
  file_name: null,
  content_type: null,
  idempotency_key: "idem-1",
  confidence_score: null,
  structured_data: null,
  error_message: null,
  processing_attempt_count: 0,
  created_at: "2026-09-24T00:00:00.000Z",
  updated_at: "2026-09-24T00:00:00.000Z",
};

describe("ConvexDocumentRepository", () => {
  beforeEach(() => {
    query.mockReset();
    mutation.mockReset();
  });

  it("creates via the user-scoped Convex mutation", async () => {
    mutation.mockResolvedValue(record);
    const document = createQueuedDocument({
      id: "doc-1",
      userId: "user-1",
      documentType: "invoice",
      fileUrl: "https://files/invoice.pdf",
      idempotencyKey: "idem-1",
    });
    await repo().create(document);
    expect(mutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        externalId: "doc-1",
        idempotencyKey: "idem-1",
        documentType: "invoice",
        fileUrl: "https://files/invoice.pdf",
      }),
    );
  });

  it("maps getMine rows onto the document entity", async () => {
    query.mockResolvedValue(record);
    const found = await repo().findById("doc-1", "user-1");
    expect(found).toMatchObject({
      id: "doc-1",
      userId: "user-1",
      documentType: "invoice",
      fileUrl: "https://files/invoice.pdf",
      status: "queued",
    });
  });

  it("claims queued documents through the admin internal mutation", async () => {
    mutation.mockResolvedValue({ ...record, status: "processing" });
    const claimed = await repo(true).claimQueuedForProcessing("doc-1", "user-1");
    expect(claimed?.status).toBe("processing");
    expect(mutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        externalId: "doc-1",
        userExternalId: "user-1",
      }),
    );
  });

  it("passes now into the stale-processing query", async () => {
    query.mockResolvedValue([
      {
        documentId: "doc-1",
        userId: "user-1",
        idempotencyKey: "idem-1",
        processingStartedAt: 1_000,
      },
    ]);
    const stale = await repo(true).findStaleProcessingDocuments({
      olderThanMinutes: 15,
      limit: 10,
    });
    expect(stale[0]?.processingStartedAt).toEqual(new Date(1_000));
    expect(query).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        olderThanMinutes: 15,
        limit: 10,
        now: expect.any(Number),
      }),
    );
  });
});
