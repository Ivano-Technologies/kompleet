import type { ConvexHttpClient } from "convex/browser";
import { api } from "@/lib/convex/http";
import type { AuditLogPort } from "../../application/ports/audit-log.port";

export interface ConvexAuditLogAdapterOptions {
  admin?: boolean;
  workerToken?: string;
}

export class ConvexAuditLogAdapter implements AuditLogPort {
  constructor(
    private readonly convex: ConvexHttpClient,
    private readonly options: ConvexAuditLogAdapterOptions = {},
  ) {}

  async record(event: {
    userId: string;
    documentId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (this.options.admin) {
      const workerToken = this.options.workerToken;
      if (!workerToken) {
        throw new Error(
          "DOCUMENT_WORKER_TOKEN is required for worker audit calls.",
        );
      }
      await this.convex.mutation(api.audit.appendForWorker, {
        workerToken,
        userExternalId: event.userId,
        action: event.action,
        resourceType: "document",
        entityId: event.documentId,
        metadata: event.metadata ?? {},
      });
      return;
    }

    await this.convex.mutation(api.audit.append, {
      action: event.action,
      resourceType: "document",
      entityId: event.documentId,
      metadata: event.metadata ?? {},
    });
  }
}
