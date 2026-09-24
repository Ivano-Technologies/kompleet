import { api } from "@/lib/convex/http";
import { requireAuthedConvex } from "@/lib/convex/server";

/**
 * 7-Year Invoice Archiving Service
 * Implements NRS-compliant invoice retention and archiving via Convex.
 */

export interface ArchiveOptions {
  invoice_id: string;
  user_id: string;
  reason?: string;
}

export interface ArchiveResult {
  success: boolean;
  archive_id?: string;
  error?: string;
}

export async function archiveInvoice(
  options: ArchiveOptions,
): Promise<ArchiveResult> {
  const {
    invoice_id,
    reason = "Automatic archiving after 30 days",
  } = options;

  try {
    const { convex } = await requireAuthedConvex();
    const invoice = await convex.query(api.invoices.getMine, {
      externalId: invoice_id,
    });
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    if (invoice.status === "archived") {
      return { success: true, archive_id: invoice.id };
    }
    const result = await convex.mutation(api.invoices.archiveMine, {
      externalId: invoice_id,
      reason,
    });
    return {
      success: result.success,
      archive_id: result.archive_id ?? invoice.id,
    };
  } catch (error: unknown) {
    console.error("Error archiving invoice:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
}

export async function retrieveArchivedInvoice(
  invoice_id: string,
  _user_id: string,
): Promise<unknown> {
  const { convex } = await requireAuthedConvex();
  const snapshot = await convex.query(api.invoices.getArchiveMine, {
    invoiceExternalId: invoice_id,
  });
  if (!snapshot) {
    throw new Error("Archived invoice not found");
  }
  return snapshot;
}

export async function archiveOldInvoices(): Promise<{
  archived_count: number;
  errors: string[];
}> {
  try {
    const { convex, user } = await requireAuthedConvex();
    const invoices = await convex.query(api.invoices.listMine, {});
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const errors: string[] = [];
    let archived_count = 0;

    for (const invoice of invoices) {
      if (invoice.status !== "issued" && invoice.status !== "paid") continue;
      const issuedAt = Date.parse(invoice.updated_at);
      if (!Number.isFinite(issuedAt) || issuedAt > thirtyDaysAgo) continue;
      const result = await archiveInvoice({
        invoice_id: invoice.id,
        user_id: user.id,
        reason: "Automatic archiving after 30 days",
      });
      if (result.success) {
        archived_count += 1;
      } else {
        errors.push(`Invoice ${invoice.id}: ${result.error}`);
      }
    }

    return { archived_count, errors };
  } catch (error: unknown) {
    console.error("Error in archiveOldInvoices:", error);
    return {
      archived_count: 0,
      errors: [error instanceof Error ? error.message : "Archive job failed"],
    };
  }
}

export async function checkRetentionCompliance(_user_id: string): Promise<{
  compliant: boolean;
  expired_archives: string[];
  total_archives: number;
}> {
  try {
    const { convex } = await requireAuthedConvex();
    const archives = await convex.query(api.invoices.listArchivesMine, {});
    const cutoff = Date.now() - 7 * 365 * 24 * 60 * 60 * 1000;
    const expired_archives = archives
      .filter((a) => Date.parse(a.created_at) < cutoff)
      .map((a) => a.id);
    return {
      compliant: true,
      expired_archives,
      total_archives: archives.length,
    };
  } catch (error: unknown) {
    console.error("Error checking retention compliance:", error);
    return {
      compliant: false,
      expired_archives: [],
      total_archives: 0,
    };
  }
}

export async function generateComplianceReport(user_id: string): Promise<{
  total_invoices: number;
  archived_invoices: number;
  oldest_archive_date: string | null;
  retention_compliance: boolean;
  audit_log_count: number;
}> {
  const { convex } = await requireAuthedConvex();
  const [invoices, archives] = await Promise.all([
    convex.query(api.invoices.listMine, {}),
    convex.query(api.invoices.listArchivesMine, {}),
  ]);
  const compliance = await checkRetentionCompliance(user_id);
  const oldest = [...archives].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )[0];
  return {
    total_invoices: invoices.length,
    archived_invoices: archives.length,
    oldest_archive_date: oldest?.created_at ?? null,
    retention_compliance: compliance.compliant,
    audit_log_count: 0,
  };
}
