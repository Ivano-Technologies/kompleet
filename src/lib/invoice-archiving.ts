import { createClient } from '@/lib/supabase/server';

/**
 * 7-Year Invoice Archiving Service
 * Implements NRS-compliant invoice retention and archiving
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

/**
 * Archive an invoice for 7-year retention
 * Makes invoice immutable and moves to long-term storage
 */
export async function archiveInvoice(options: ArchiveOptions): Promise<ArchiveResult> {
  const { invoice_id, user_id, reason = 'Automatic archiving after 30 days' } = options;

  try {
    const supabase = createClient();

    // Get invoice
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !invoice) {
      throw new Error('Invoice not found');
    }

    // Check if already archived
    if (invoice.status === 'archived') {
      return { success: true, archive_id: invoice.id };
    }

    // Calculate retention expiry (7 years from now)
    const retentionExpiry = new Date();
    retentionExpiry.setFullYear(retentionExpiry.getFullYear() + 7);

    // Create archive record
    const { data: archive, error: archiveError } = await supabase
      .from('invoice_archives')
      .insert({
        invoice_id,
        user_id,
        archived_at: new Date().toISOString(),
        retention_expiry: retentionExpiry.toISOString(),
        reason,
        original_data: invoice, // Store complete invoice snapshot
        checksum: await calculateChecksum(invoice) // Tamper-evident
      })
      .select()
      .single();

    if (archiveError) {
      throw new Error(`Failed to create archive: ${archiveError.message}`);
    }

    // Update invoice status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        is_immutable: true
      })
      .eq('id', invoice_id)
      .eq('user_id', user_id);

    if (updateError) {
      throw new Error(`Failed to update invoice status: ${updateError.message}`);
    }

    // Log audit event
    await supabase.from('invoice_audit_logs').insert({
      invoice_id,
      user_id,
      action: 'archived',
      details: { reason, retention_expiry: retentionExpiry.toISOString() },
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      archive_id: archive.id
    };
  } catch (error: any) {
    console.error('Error archiving invoice:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Retrieve archived invoice
 * Logs access for compliance
 */
export async function retrieveArchivedInvoice(
  invoice_id: string,
  user_id: string
): Promise<any> {
  try {
    const supabase = createClient();

    // Get archive record
    const { data: archive, error } = await supabase
      .from('invoice_archives')
      .select('*')
      .eq('invoice_id', invoice_id)
      .eq('user_id', user_id)
      .single();

    if (error || !archive) {
      throw new Error('Archived invoice not found');
    }

    // Verify checksum (tamper detection)
    const currentChecksum = await calculateChecksum(archive.original_data);
    if (currentChecksum !== archive.checksum) {
      throw new Error('Archive integrity check failed - possible tampering detected');
    }

    // Log access
    await supabase.from('invoice_audit_logs').insert({
      invoice_id,
      user_id,
      action: 'archive_accessed',
      details: { archive_id: archive.id },
      timestamp: new Date().toISOString()
    });

    return archive.original_data;
  } catch (error: any) {
    console.error('Error retrieving archived invoice:', error);
    throw error;
  }
}

/**
 * Background job: Archive invoices older than 30 days
 * Should run daily via cron
 */
export async function archiveOldInvoices(): Promise<{
  archived_count: number;
  errors: string[];
}> {
  try {
    const supabase = createClient();

    // Find invoices older than 30 days that are issued/paid
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, user_id')
      .in('status', ['issued', 'paid'])
      .lt('issued_at', thirtyDaysAgo.toISOString());

    if (error) {
      throw new Error(`Failed to fetch old invoices: ${error.message}`);
    }

    const errors: string[] = [];
    let archived_count = 0;

    // Archive each invoice
    for (const invoice of invoices || []) {
      const result = await archiveInvoice({
        invoice_id: invoice.id,
        user_id: invoice.user_id,
        reason: 'Automatic archiving after 30 days'
      });

      if (result.success) {
        archived_count++;
      } else {
        errors.push(`Invoice ${invoice.id}: ${result.error}`);
      }
    }

    return { archived_count, errors };
  } catch (error: any) {
    console.error('Error in archiveOldInvoices:', error);
    return { archived_count: 0, errors: [error.message] };
  }
}

/**
 * Check retention policy compliance
 * Returns invoices that can be safely deleted (> 7 years)
 */
export async function checkRetentionCompliance(user_id: string): Promise<{
  compliant: boolean;
  expired_archives: string[];
  total_archives: number;
}> {
  try {
    const supabase = createClient();

    // Get all archives for user
    const { data: archives, error } = await supabase
      .from('invoice_archives')
      .select('id, retention_expiry')
      .eq('user_id', user_id);

    if (error) {
      throw new Error(`Failed to fetch archives: ${error.message}`);
    }

    const now = new Date();
    const expired_archives = (archives || [])
      .filter(a => new Date(a.retention_expiry) < now)
      .map(a => a.id);

    return {
      compliant: true,
      expired_archives,
      total_archives: archives?.length || 0
    };
  } catch (error: any) {
    console.error('Error checking retention compliance:', error);
    return {
      compliant: false,
      expired_archives: [],
      total_archives: 0
    };
  }
}

/**
 * Calculate SHA-256 checksum for tamper detection
 */
async function calculateChecksum(data: any): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);
  
  // Use Web Crypto API for SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Generate compliance report for audits
 */
export async function generateComplianceReport(user_id: string): Promise<{
  total_invoices: number;
  archived_invoices: number;
  oldest_archive_date: string | null;
  retention_compliance: boolean;
  audit_log_count: number;
}> {
  try {
    const supabase = createClient();

    // Count total invoices
    const { count: total_invoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    // Count archived invoices
    const { count: archived_invoices, data: archives } = await supabase
      .from('invoice_archives')
      .select('archived_at', { count: 'exact' })
      .eq('user_id', user_id)
      .order('archived_at', { ascending: true })
      .limit(1);

    // Count audit logs
    const { count: audit_log_count } = await supabase
      .from('invoice_audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    // Check retention compliance
    const compliance = await checkRetentionCompliance(user_id);

    return {
      total_invoices: total_invoices || 0,
      archived_invoices: archived_invoices || 0,
      oldest_archive_date: archives?.[0]?.archived_at || null,
      retention_compliance: compliance.compliant,
      audit_log_count: audit_log_count || 0
    };
  } catch (error: any) {
    console.error('Error generating compliance report:', error);
    throw error;
  }
}
