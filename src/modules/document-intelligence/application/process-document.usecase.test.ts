import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  DocumentPersistError,
  ProcessDocumentUseCase,
} from "./process-document.usecase";

const { error, warn } = vi.hoisted(() => ({
  error: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: (...args: unknown[]) => error(...args),
    warn: (...args: unknown[]) => warn(...args),
  },
}));

describe("ProcessDocumentUseCase", () => {
  const repository = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
  };
  const queue = {
    enqueueDocumentProcessing: vi.fn(),
  };
  const auditLog = {
    record: vi.fn(),
  };

  const input = {
    userId: "user-1",
    documentType: "invoice" as const,
    fileUrl: "https://files.example/f",
    idempotencyKey: "idem-1",
  };

  beforeEach(() => {
    repository.findByIdempotencyKey.mockReset();
    repository.create.mockReset();
    queue.enqueueDocumentProcessing.mockReset();
    auditLog.record.mockReset();
    error.mockReset();
    warn.mockReset();
    repository.findByIdempotencyKey.mockResolvedValue(null);
    repository.create.mockImplementation(async (document: { id: string }) => document);
    queue.enqueueDocumentProcessing.mockResolvedValue(undefined);
    auditLog.record.mockResolvedValue(undefined);
  });

  function useCase() {
    return new ProcessDocumentUseCase(
      repository as never,
      queue as never,
      auditLog as never,
    );
  }

  it("maps Convex lookup failures to DocumentPersistError", async () => {
    repository.findByIdempotencyKey.mockRejectedValue(
      new Error("Convex lookup exploded"),
    );
    await expect(useCase().execute(input)).rejects.toBeInstanceOf(
      DocumentPersistError,
    );
    expect(error).toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("maps Convex createMine failures to DocumentPersistError", async () => {
    repository.create.mockRejectedValue(new Error("createMine failed"));
    await expect(useCase().execute(input)).rejects.toMatchObject({
      name: "DocumentPersistError",
      message: "Failed to persist document",
    });
    expect(queue.enqueueDocumentProcessing).not.toHaveBeenCalled();
  });

  it("still returns queued when audit append fails after persist", async () => {
    auditLog.record.mockRejectedValue(new Error("audit down"));
    const result = await useCase().execute(input);
    expect(result).toEqual({
      documentId: expect.any(String),
      status: "queued",
    });
    expect(repository.create).toHaveBeenCalled();
    expect(queue.enqueueDocumentProcessing).toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      "document audit append failed after persist",
      expect.objectContaining({ operation: "document.audit" }),
    );
  });

  it("uses the persisted Convex documentId, not the locally generated UUID", async () => {
    repository.create.mockResolvedValue({
      id: "convex-row-id",
      userId: "user-1",
      documentType: "invoice",
      fileUrl: "https://files.example/f",
      idempotencyKey: "idem-1",
    });
    const result = await useCase().execute(input);
    expect(result).toEqual({
      documentId: "convex-row-id",
      status: "queued",
    });
    expect(queue.enqueueDocumentProcessing).toHaveBeenCalledWith(
      expect.objectContaining({ documentId: "convex-row-id" }),
    );
  });

  it("rethrows Convex auth errors instead of mapping them to persist 502", async () => {
    repository.findByIdempotencyKey.mockRejectedValue(
      new Error("Not authenticated"),
    );
    await expect(useCase().execute(input)).rejects.toThrow("Not authenticated");
    expect(repository.create).not.toHaveBeenCalled();
  });
});
