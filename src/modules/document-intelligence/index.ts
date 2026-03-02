import { GetDocumentStatusUseCase } from "./application/get-document-status.usecase";
import { ProcessDocumentUseCase } from "./application/process-document.usecase";
import type { AuditLogPort } from "./application/ports/audit-log.port";
import type { DocumentRepositoryPort } from "./application/ports/document-repository.port";
import type { QueuePort } from "./application/ports/queue.port";
import { InMemoryAuditLogAdapter } from "./infrastructure/audit/in-memory-audit-log.adapter";
import { SupabaseAuditLogAdapter } from "./infrastructure/audit/supabase-audit-log.adapter";
import { InMemoryDocumentRepository } from "./infrastructure/persistence/in-memory-document.repository";
import { SupabaseDocumentRepository } from "./infrastructure/persistence/supabase-document.repository";
import { BullMQAdapter } from "./infrastructure/queue/bullmq.adapter";
import { InMemoryDocumentQueue } from "./infrastructure/queue/in-memory-document.queue";
import { DocumentController } from "./interfaces/document.controller";
export { NotFoundError } from "./interfaces/document.controller";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedController: DocumentController | null = null;

export function getDocumentController(): DocumentController {
  if (cachedController) {
    return cachedController;
  }

  const repository = new InMemoryDocumentRepository();
  cachedController = buildController(repository);

  return cachedController;
}

export function getDocumentControllerWithSupabase(
  supabase: SupabaseClient,
): DocumentController {
  const repository: DocumentRepositoryPort =
    new SupabaseDocumentRepository(supabase);
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required for document queueing.");
  }

  const queue = new BullMQAdapter(redisUrl);
  const auditLog = new SupabaseAuditLogAdapter(supabase);
  return buildController(repository, queue, auditLog);
}

function buildController(
  repository: DocumentRepositoryPort,
  queue: QueuePort = new InMemoryDocumentQueue(),
  auditLog: AuditLogPort = new InMemoryAuditLogAdapter(),
): DocumentController {
  const processDocumentUseCase = new ProcessDocumentUseCase(
    repository,
    queue,
    auditLog,
  );
  const getDocumentStatusUseCase = new GetDocumentStatusUseCase(repository);

  return new DocumentController(processDocumentUseCase, getDocumentStatusUseCase);
}
