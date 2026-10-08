/** Locked AUTH-DENSITY tokens (IVA-90). Keep fields; tighten rhythm only. */
export const AUTH_LABEL =
  "text-xs font-bold uppercase tracking-wider text-text-2 dark:text-dark-text-2";

export const AUTH_INPUT =
  "mt-1 h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20";

export const AUTH_INPUT_BARE =
  "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-text-1 focus:border-primary focus:ring-2 focus:ring-primary/20";

export const AUTH_INPUT_WITH_TOGGLE = `${AUTH_INPUT_BARE} pr-11`;

/**
 * Auth CTA. White on accent (#0D9488) is only 3.74:1, so the resting fill is
 * the accent-hover teal (#0F766E, 5.47:1) and hover goes one step deeper
 * (#115E59, 7.58:1). Same fill in light and dark.
 */
export const AUTH_SUBMIT =
  "flex h-11 w-full items-center justify-center gap-2 rounded-md bg-accent-hover text-sm font-bold text-charcoal hover:bg-[#115E59] disabled:opacity-50";

/**
 * Inline auth link. Primary navy (#0B3A5C) is 11.6:1 on the light card but
 * 1.4:1 on the dark card, so dark mode switches to teal-400 (#2DD4BF, 9.1:1).
 */
export const AUTH_LINK =
  "font-bold text-primary hover:underline dark:text-teal-400";

/** Muted auth link (Back to Login etc.). */
export const AUTH_LINK_MUTED =
  "text-xs text-text-3 hover:text-text-1 dark:text-dark-text-3 dark:hover:text-dark-text-1";

export const AUTH_ERROR =
  "mb-3 rounded-md border border-error/30 bg-error-bg p-2.5 text-sm text-error dark:bg-error-darkBg dark:text-error-dark";

export const AUTH_FORM = "space-y-3";

// text-4 / dark-text-4 measured 2.5:1 / 3.65:1 on the card; text-3 tokens clear 4.5:1.
export const AUTH_EYEBROW =
  "mb-1 text-xs font-bold uppercase tracking-widest text-text-3 dark:text-dark-text-3";

export const AUTH_TITLE =
  "mb-1 font-display text-[26px] font-bold leading-tight text-text-1 dark:text-dark-text-1";

export const AUTH_SUBTITLE =
  "text-sm leading-snug text-text-3 dark:text-dark-text-3";

/** Marketing subtitle — hide on short laptop viewports (AUTH-DENSITY). */
export const AUTH_SUBTITLE_FOLD = `${AUTH_SUBTITLE} auth-sub`;

export const AUTH_TITLE_BLOCK = "mb-3";

export const AUTH_TERMS =
  "mt-3 text-center text-xs text-text-3 dark:text-dark-text-3";

export const AUTH_TRUST =
  "mt-3 flex items-center justify-center gap-3 border-t border-border pt-3 text-xs text-text-3 dark:border-dark-border dark:text-dark-text-3";
