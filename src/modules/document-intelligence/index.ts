import type { ConvexHttpClient } from "convex/browser";
import { GetDocumentStatusUseCase } from "./application/get-document-status.usecase";
import { ProcessDocumentUseCase } from "./application/process-document.usecase";
import type { AuditLogPort } from "./application/ports/audit-log.port";
import type { DocumentRepositoryPort } from "./application/ports/document-repository.port";
import type { QueuePort } from "./application/ports/queue.port";
import { ConvexAuditLogAdapter } from "./infrastructure/audit/convex-audit-log.adapter";
import { InMemoryAuditLogAdapter } from "./infrastructure/audit/in-memory-audit-log.adapter";
import { ConvexDocumentRepository } from "./infrastructure/persistence/convex-document.repository";
import { InMemoryDocumentRepository } from "./infrastructure/persistence/in-memory-document.repository";
import { InMemoryDocumentQueue } from "./infrastructure/queue/in-memory-document.queue";
import { createDocumentQueue } from "./infrastructure/queue/queue-driver";
import { DocumentController } from "./interfaces/document.controller";
export { NotFoundError } from "./interfaces/document.controller";
export { DocumentPersistError } from "./application/process-document.usecase";
export {
  QueueConfigurationError,
  resolveDocumentQueueDriver,
  setDocumentQueueDepsForTests,
  resetDocumentQueueDriverLogForTests,
} from "./infrastructure/queue/queue-driver";

let cachedController: DocumentController | null = null;

export function getDocumentController(): DocumentController {
  if (cachedController) {
    return cachedController;
  }

  const repository = new InMemoryDocumentRepository();
  cachedController = buildController(repository);

  return cachedController;
}

/** Status reads only need Convex. Do not require Redis/queue here. */
export function getDocumentStatusControllerWithConvex(
  convex: ConvexHttpClient,
): DocumentController {
  const repository: DocumentRepositoryPort = new ConvexDocumentRepository(
    convex,
  );
  const auditLog = new ConvexAuditLogAdapter(convex);
  return buildController(repository, new InMemoryDocumentQueue(), auditLog);
}

/** Upload/queue path. Call only after auth has already failed closed. */
export function getDocumentControllerWithConvex(
  convex: ConvexHttpClient,
): DocumentController {
  const repository: DocumentRepositoryPort = new ConvexDocumentRepository(
    convex,
  );
  const queue = createDocumentQueue();
  const auditLog = new ConvexAuditLogAdapter(convex);
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
