import type { AuditLogPort } from "../../application/ports/audit-log.port";

export class InMemoryAuditLogAdapter implements AuditLogPort {
  private readonly events: Array<{
    userId: string;
    documentId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }> = [];

  async record(event: {
    userId: string;
    documentId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.events.push(event);
  }
}
