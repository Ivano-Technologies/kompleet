import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogPort } from "../../application/ports/audit-log.port";

export class SupabaseAuditLogAdapter implements AuditLogPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async record(event: {
    userId: string;
    documentId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { error } = await this.supabase.from("audit_logs").insert({
      user_id: event.userId,
      action: event.action,
      resource_type: "document",
      resource_id: event.documentId,
      metadata: event.metadata ?? {},
    });

    if (error) {
      throw new Error(`Failed to write audit event: ${error.message}`);
    }
  }
}
