export const BUSINESS_PROFILE_EVENT = "kompleet:business-profile";

export function emitBusinessProfileChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(BUSINESS_PROFILE_EVENT));
}

export function onBusinessProfileChanged(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(BUSINESS_PROFILE_EVENT, listener);
  return () => window.removeEventListener(BUSINESS_PROFILE_EVENT, listener);
}
