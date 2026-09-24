/**
 * NDPR consent: persist consent_scan + consent_cloud_sync locally.
 * Cloud table `ndpr_consents` is not in Convex — local SecureStore only.
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

export async function acceptConsent(): Promise<void> {
  const consent: NDPRConsent = {
    consentScan: true,
    consentCloudSync: true,
    consentTimestamp: new Date().toISOString(),
  };
  await setConsentInStore(consent);
}
