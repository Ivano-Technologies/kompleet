/**
 * Premium gating for expense features: teams, full sync, mileage.
 * Free = scan + manual + export. Premium = teams, full sync, mileage.
 * Uses profiles.subscription_tier (free | premium). Returns 402 when limit exceeded.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type SubscriptionTier = "free" | "premium";

const DEFAULT_TIER: SubscriptionTier = "free";

/**
 * Get the user's subscription tier from profiles. Uses auth.uid() as profile id.
 */
export async function getSubscriptionTier(
  supabase: SupabaseClient,
  userId: string
): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .maybeSingle();
  const tier = data?.subscription_tier as SubscriptionTier | null | undefined;
  if (tier === "premium" || tier === "free") return tier;
  return DEFAULT_TIER;
}

/**
 * Check if the user has premium. If not, returns an object suitable for 402 response.
 */
export async function requirePremium(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: true } | { allowed: false; status: 402; body: { error: string } }> {
  const tier = await getSubscriptionTier(supabase, userId);
  if (tier === "premium") return { allowed: true };
  return {
    allowed: false,
    status: 402,
    body: {
      error:
        "Premium required for this feature. Upgrade to access teams, full sync, and mileage.",
    },
  };
}
