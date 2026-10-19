import { useState, useEffect } from "react";
import { toFriendlyMessage, UserFacingError } from "@/lib/friendly-error";

interface TaxRule {
  value: any;
  confidence: string;
  notes: string;
  lastReviewed: string;
}

interface TaxRulesResponse {
  success: boolean;
  ruleType: string;
  versionId: string;
  rules: Record<string, TaxRule>;
  count: number;
}

export function useTaxRules(ruleType: string) {
  const [rules, setRules] = useState<Record<string, TaxRule> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRules() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/tax-rules?type=${ruleType}`, {
          credentials: "include", // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch tax rules: ${response.statusText}`);
        }

        const data: TaxRulesResponse = await response.json();

        if (!data.success) {
          throw new UserFacingError("We couldn't load tax rules. Please try again.");
        }

        setRules(data.rules);
      } catch (err) {
        console.error("Error fetching tax rules:", err);
        setError(toFriendlyMessage(err));
      } finally {
        setLoading(false);
      }
    }

    if (ruleType) {
      fetchRules();
    }
  }, [ruleType]);

  return { rules, loading, error };
}
