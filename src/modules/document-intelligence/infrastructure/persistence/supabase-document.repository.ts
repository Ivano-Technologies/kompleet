import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import type {
  DocumentEntity,
  DocumentStatus,
  DocumentType,
} from "../../domain/document.entity";
import type { DocumentRepositoryPort } from "../../application/ports/document-repository.port";

interface DocumentRow {
  id: string;
  user_id: string;
  document_type: string;
  file_url: string;
  status: string;
  idempotency_key: string;
  confidence_score: number | null;
  structured_data: Record<string, unknown> | null;
  error_message: string | null;
  processing_started_at: string | null;
  processing_attempt_count: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseDocumentRepository implements DocumentRepositoryPort {
  private readonly maxProcessingAttempts: number;

  constructor(private readonly supabase: SupabaseClient) {
    this.maxProcessingAttempts = parsePositiveInt(
      process.env.MAX_PROCESSING_ATTEMPTS,
      3,
    );
  }

  async create(document: DocumentEntity): Promise<void> {
    const { error } = await this.supabase.from("documents").insert({
      id: document.id,
      user_id: document.userId,
      document_type: document.documentType,
      file_url: document.fileUrl,
      status: document.status,
      idempotency_key: document.idempotencyKey,
      confidence_score: document.confidenceScore,
      structured_data: document.structuredData,
      error_message: document.errorMessage,
      processing_started_at: null,
      processing_attempt_count: 0,
      created_at: document.createdAt.toISOString(),
      updated_at: document.updatedAt.toISOString(),
    });

    if (error) {
      throw new Error(`Failed to create document record: ${error.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<DocumentEntity | null> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle<DocumentRow>();

    if (error) {
      throw new Error(`Failed to fetch document: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.toEntity(data);
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    const { data, error } = await this.supabase
      .from("documents")
      .select("*")
      .eq("idempotency_key", idempotencyKey)
      .eq("user_id", userId)
      .maybeSingle<DocumentRow>();

    if (error) {
      throw new Error(`Failed to fetch document by idempotency key: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.toEntity(data);
  }

  async updateStatus(params: {
    documentId: string;
    userId: string;
    status: DocumentStatus;
    confidenceScore?: number | null;
    structuredData?: Record<string, unknown> | null;
    errorMessage?: string | null;
  }): Promise<void> {
    const updates: Record<string, unknown> = {
      status: params.status,
      updated_at: new Date().toISOString(),
    };

    if (params.confidenceScore !== undefined) {
      updates.confidence_score = params.confidenceScore;
    }

    if (params.structuredData !== undefined) {
      updates.structured_data = params.structuredData;
    }

    if (params.errorMessage !== undefined) {
      updates.error_message = params.errorMessage;
    }

    const { error } = await this.supabase
      .from("documents")
      .update(updates)
      .eq("id", params.documentId)
      .eq("user_id", params.userId);

    if (error) {
      throw new Error(`Failed to update document status: ${error.message}`);
    }
  }

  async claimQueuedForProcessing(
    documentId: string,
    userId: string,
  ): Promise<DocumentEntity | null> {
    const { data: existing, error: existingError } = await this.supabase
      .from("documents")
      .select("status,processing_attempt_count")
      .eq("id", documentId)
      .eq("user_id", userId)
      .maybeSingle<{ status: string; processing_attempt_count: number | null }>();

    if (existingError) {
      throw new Error(
        `Failed to read existing claim state for document: ${existingError.message}`,
      );
    }

    if (!existing || existing.status !== "queued") {
      return null;
    }

    const currentAttempts = existing.processing_attempt_count ?? 0;
    const nextAttemptCount = currentAttempts + 1;

    if (nextAttemptCount > this.maxProcessingAttempts) {
      logger.warn("Document exceeded maximum processing attempts", {
        operation: "worker.document.metrics.max_attempts_exceeded",
        documentId,
        userId,
        maxProcessingAttempts: this.maxProcessingAttempts,
        processingAttemptCount: nextAttemptCount,
      });
      const { error: ceilingError } = await this.supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: "max_processing_attempts_exceeded",
          processing_started_at: null,
          processing_attempt_count: nextAttemptCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .eq("user_id", userId)
        .eq("status", "queued")
        .eq("processing_attempt_count", currentAttempts);

      if (ceilingError) {
        throw new Error(
          `Failed to mark document failed after max attempts: ${ceilingError.message}`,
        );
      }

      return null;
    }

    const { data, error } = await this.supabase
      .from("documents")
      .update({
        status: "processing",
        processing_started_at: new Date().toISOString(),
        processing_attempt_count: nextAttemptCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("user_id", userId)
      .eq("status", "queued")
      .eq("processing_attempt_count", currentAttempts)
      .select("*")
      .maybeSingle<DocumentRow>();

    if (error) {
      throw new Error(`Failed to claim queued document: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return this.toEntity(data);
  }

  async completeProcessing(params: {
    documentId: string;
    userId: string;
    structuredData: Record<string, unknown>;
    confidenceScore: number;
  }): Promise<void> {
    const now = new Date().toISOString();

    const { error: validatedError } = await this.supabase
      .from("documents")
      .update({
        status: "validated",
        structured_data: params.structuredData,
        confidence_score: params.confidenceScore,
        error_message: null,
        processing_started_at: null,
        updated_at: now,
      })
      .eq("id", params.documentId)
      .eq("user_id", params.userId)
      .eq("status", "processing");

    if (validatedError) {
      throw new Error(
        `Failed to transition document to validated: ${validatedError.message}`,
      );
    }

    const { error: completedError } = await this.supabase
      .from("documents")
      .update({
        status: "completed",
        updated_at: now,
      })
      .eq("id", params.documentId)
      .eq("user_id", params.userId)
      .eq("status", "validated");

    if (completedError) {
      throw new Error(
        `Failed to transition document to completed: ${completedError.message}`,
      );
    }
  }

  async failProcessing(params: {
    documentId: string;
    userId: string;
    errorMessage: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("documents")
      .update({
        status: "failed",
        error_message: params.errorMessage,
        processing_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.documentId)
      .eq("user_id", params.userId)
      .eq("status", "processing");

    if (error) {
      throw new Error(`Failed to transition document to failed: ${error.message}`);
    }
  }

  async markNeedsReview(params: {
    documentId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    const { error } = await this.supabase
      .from("documents")
      .update({
        status: "needs_review",
        error_message: params.reason,
        processing_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.documentId)
      .eq("user_id", params.userId)
      .eq("status", "processing");

    if (error) {
      throw new Error(
        `Failed to transition document to needs_review: ${error.message}`,
      );
    }
  }

  async findStaleProcessingDocuments(params: {
    olderThanMinutes: number;
    limit: number;
  }): Promise<
    Array<{
      documentId: string;
      userId: string;
      idempotencyKey: string;
      processingStartedAt: Date | null;
    }>
  > {
    const threshold = new Date(
      Date.now() - params.olderThanMinutes * 60 * 1000,
    ).toISOString();

    const { data, error } = await this.supabase
      .from("documents")
      .select("id,user_id,idempotency_key,processing_started_at")
      .eq("status", "processing")
      .lt("processing_started_at", threshold)
      .order("processing_started_at", { ascending: true })
      .limit(params.limit);

    if (error) {
      throw new Error(
        `Failed to fetch stale processing documents: ${error.message}`,
      );
    }

    return (data ?? []).map((row) => ({
      documentId: row.id as string,
      userId: row.user_id as string,
      idempotencyKey: row.idempotency_key as string,
      processingStartedAt: row.processing_started_at
        ? new Date(row.processing_started_at as string)
        : null,
    }));
  }

  async requeueStaleProcessingDocument(params: {
    documentId: string;
    userId: string;
  }): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("documents")
      .update({
        status: "queued",
        processing_started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.documentId)
      .eq("user_id", params.userId)
      .eq("status", "processing")
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to requeue stale document: ${error.message}`);
    }

    return Boolean(data);
  }

  private toEntity(row: DocumentRow): DocumentEntity {
    return {
      id: row.id,
      userId: row.user_id,
      documentType: row.document_type as DocumentType,
      fileUrl: row.file_url,
      status: row.status as DocumentStatus,
      idempotencyKey: row.idempotency_key,
      confidenceScore: row.confidence_score,
      structuredData: row.structured_data,
      errorMessage: row.error_message,
      // Recovery logic uses DB-native field outside domain contract.
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}
