/**
 * NDPR consent: check and persist consent_scan + consent_cloud_sync.
 * Supabase ndpr_consents table is source of truth when online;
 * local cache (e.g. SecureStore) used to avoid blocking UI when offline.
 */

import * as SecureStore from "expo-secure-store";

const CONSENT_KEY = "ndpr_consent_given";

export interface NDPRConsent {
  consentScan: boolean;
  consentCloudSync: boolean;
  consentTimestamp: string;
}

export async function getConsentFromStore(): Promise<NDPRConsent | null> {
  try {
    const raw = await SecureStore.getItemAsync(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NDPRConsent;
  } catch {
    return null;
  }
}

export async function setConsentInStore(consent: NDPRConsent): Promise<void> {
  await SecureStore.setItemAsync(CONSENT_KEY, JSON.stringify(consent));
}

export async function hasConsent(): Promise<boolean> {
  const c = await getConsentFromStore();
  return !!(c?.consentScan && c?.consentCloudSync);
}

/**
 * Call after user accepts NDPR (e.g. in modal).
 * Persist locally and optionally sync to Supabase when client is available.
 */
export async function acceptConsent(supabase?: {
  from: (table: string) => {
    upsert: (row: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> };
}): Promise<void> {
  const consent: NDPRConsent = {
    consentScan: true,
    consentCloudSync: true,
    consentTimestamp: new Date().toISOString(),
  };
  await setConsentInStore(consent);

  if (supabase) {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      if (userId) {
        await supabase.from("ndpr_consents").upsert({
          user_id: userId,
          consent_scan: true,
          consent_cloud_sync: true,
          consent_timestamp: consent.consentTimestamp,
        });
      }
    } catch {
      // Offline or not signed in; local consent still saved
    }
  }
}
