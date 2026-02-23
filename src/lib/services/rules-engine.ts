/**
 * Tax Rules Engine Service
 * Handles versioned tax rules, source management, and audit logging
 */

import { createClient } from "@supabase/supabase-js";
import type {
  Source,
  RuleVersion,
  TaxRule,
  GetRulesRequest,
  GetRulesResponse,
  ConfidenceLevel,
} from "@/types/tax";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class RulesEngineService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Get the currently active rule version
   */
  async getActiveRuleVersion(): Promise<RuleVersion | null> {
    const { data, error } = await this.supabase
      .from("rule_versions")
      .select("*")
      .eq("is_active", true)
      .single();

    if (error) {
      console.error("Error fetching active rule version:", error);
      return null;
    }

    return data;
  }

  /**
   * Get rules by version and optional filters
   */
  async getRules(request: GetRulesRequest): Promise<GetRulesResponse | null> {
    let versionId = request.version_id;

    // If no version specified, get active version
    if (!versionId) {
      const activeVersion = await this.getActiveRuleVersion();
      if (!activeVersion) {
        throw new Error("No active rule version found");
      }
      versionId = activeVersion.id;
    }

    // Build query
    let query = this.supabase
      .from("tax_rules")
      .select(
        `
        *,
        source:sources(*),
        rule_version:rule_versions(*)
      `,
      )
      .eq("rule_version_id", versionId);

    // Apply filters
    if (request.rule_type) {
      query = query.eq("rule_type", request.rule_type);
    }

    if (request.rule_keys && request.rule_keys.length > 0) {
      query = query.in("rule_key", request.rule_keys);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching rules:", error);
      return null;
    }

    const rules = data as TaxRule[];
    const version = rules[0]?.rule_version;

    return {
      rules,
      version: version!,
      source: "Nigeria Tax Act 2025",
    };
  }

  /**
   * Get a single rule by key
   */
  async getRule(ruleKey: string, versionId?: string): Promise<TaxRule | null> {
    const response = await this.getRules({
      version_id: versionId,
      rule_keys: [ruleKey],
    });

    if (!response || response.rules.length === 0) {
      return null;
    }

    return response.rules[0];
  }

  /**
   * Get all sources
   */
  async getSources(): Promise<Source[]> {
    const { data, error } = await this.supabase
      .from("sources")
      .select("*")
      .order("type", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching sources:", error);
      return [];
    }

    return data;
  }

  /**
   * Get source by ID
   */
  async getSource(sourceId: string): Promise<Source | null> {
    const { data, error } = await this.supabase
      .from("sources")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (error) {
      console.error("Error fetching source:", error);
      return null;
    }

    return data;
  }

  /**
   * Log a tax calculation to audit trail
   */
  async logCalculation(
    calculationType: string,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<boolean> {
    const activeVersion = await this.getActiveRuleVersion();
    if (!activeVersion) {
      console.error("No active rule version found for audit logging");
      return false;
    }

    const { error } = await this.supabase.from("audit_logs").insert({
      user_id: userId,
      calculation_type: calculationType,
      inputs,
      outputs,
      rule_version_id: activeVersion.id,
      rule_version_number: activeVersion.version_number,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Error logging calculation:", error);
      return false;
    }

    return true;
  }

  /**
   * Get disclaimer text based on confidence level
   */
  getDisclaimer(confidenceLevel: ConfidenceLevel): string {
    const baseDisclaimer =
      "This calculation is based on the Nigeria Tax Act 2025 and related regulations. Tax laws are subject to interpretation and change.";

    const confidenceText = {
      high: "This interpretation is based on primary sources (official legislation and NRS guidance) and has high confidence.",
      medium:
        "This interpretation is based on secondary sources (professional tax firms) and has medium confidence. Please consult a tax professional for confirmation.",
      low: "This interpretation has low confidence due to legal ambiguity or lack of official guidance. Professional tax advice is strongly recommended.",
    };

    return `${baseDisclaimer} ${confidenceText[confidenceLevel]} Last reviewed: ${new Date().toISOString().split("T")[0]}.`;
  }

  /**
   * Create a new rule version (admin only)
   */
  async createRuleVersion(
    versionNumber: string,
    description: string,
    effectiveFrom: Date,
    createdBy: string,
  ): Promise<RuleVersion | null> {
    const { data, error } = await this.supabase
      .from("rule_versions")
      .insert({
        version_number: versionNumber,
        description,
        effective_from: effectiveFrom.toISOString(),
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating rule version:", error);
      return null;
    }

    return data;
  }

  /**
   * Activate a rule version (admin only)
   */
  async activateRuleVersion(versionId: string): Promise<boolean> {
    // Deactivate all versions
    await this.supabase
      .from("rule_versions")
      .update({ is_active: false })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Activate the specified version
    const { error } = await this.supabase
      .from("rule_versions")
      .update({ is_active: true })
      .eq("id", versionId);

    if (error) {
      console.error("Error activating rule version:", error);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const rulesEngine = new RulesEngineService();
