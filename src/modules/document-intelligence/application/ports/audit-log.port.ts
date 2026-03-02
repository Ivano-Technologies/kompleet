export interface AuditLogPort {
  record(event: {
    userId: string;
    documentId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
