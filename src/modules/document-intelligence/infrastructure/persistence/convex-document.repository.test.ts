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
    const created = await repo().create(document);
    expect(created.id).toBe("doc-1");
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

  it("retries createMine with the deployed arg subset after extra-field rejection", async () => {
    mutation
      .mockRejectedValueOnce(
        new Error(
          "ArgumentValidationError: Object contains extra field `documentType` that is not in the validator.",
        ),
      )
      .mockResolvedValueOnce({ ...record, id: "convex-assigned-id" });
    const document = createQueuedDocument({
      id: "doc-1",
      userId: "user-1",
      documentType: "invoice",
      fileUrl: "https://files/invoice.pdf",
      idempotencyKey: "idem-1",
    });
    const created = await repo().create(document);
    expect(created.id).toBe("convex-assigned-id");
    expect(mutation).toHaveBeenCalledTimes(2);
    expect(mutation.mock.calls[1]?.[1]).toEqual({
      idempotencyKey: "idem-1",
      status: "queued",
      payload: {
        documentType: "invoice",
        fileUrl: "https://files/invoice.pdf",
        confidenceScore: null,
        structuredData: null,
        errorMessage: null,
      },
    });
    expect(mutation.mock.calls[1]?.[1]).not.toHaveProperty("externalId");
    expect(mutation.mock.calls[1]?.[1]).not.toHaveProperty("documentType");
    expect(mutation.mock.calls[1]?.[1]).not.toHaveProperty("fileUrl");
  });

  it("treats a missing getMineByIdempotencyKey function as no existing row", async () => {
    query.mockRejectedValue(
      new Error(
        "Could not find public function for 'documents:getMineByIdempotencyKey'.",
      ),
    );
    await expect(
      repo().findByIdempotencyKey("idem-1", "user-1"),
    ).resolves.toBeNull();
  });

  it("does not swallow missing worker idempotency functions", async () => {
    query.mockRejectedValue(
      new Error(
        "Could not find public function for 'documents:workerGetByIdempotencyKey'.",
      ),
    );
    await expect(
      repo(true).findByIdempotencyKey("idem-1", "user-1"),
    ).rejects.toThrow(/Could not find public function/);
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
