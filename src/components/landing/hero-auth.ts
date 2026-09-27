export const HERO_AUTH_ID = "hero-auth";
export const HERO_AUTH_EVENT = "kompleet:hero-auth";

export type HeroAuthMode = "signup" | "signin";

export function requestHeroAuth(mode: HeroAuthMode = "signin"): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<HeroAuthMode>(HERO_AUTH_EVENT, { detail: mode }),
  );

  document.getElementById(HERO_AUTH_ID)?.scrollIntoView?.({
    behavior: "smooth",
    block: "center",
  });
}
