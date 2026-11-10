export const THEME_STORAGE_KEY = "kompleet-theme";

/**
 * Dark mode is implemented (tokens, html.dark, ThemeProvider) but kept out of
 * the product until this is true. Flip it to restore the toggle and dark class.
 */
export const DARK_MODE_ENABLED = false;

/**
 * Pre-paint: apply a stored or OS dark preference. Kept so flipping
 * DARK_MODE_ENABLED restores the old boot path. Not the runtime export while
 * the flag is off.
 */
export const THEME_BOOT_SCRIPT_WHEN_ENABLED = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var dark=t==="dark"||((t==="system"||!t)&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

/**
 * Pre-paint while dark is gated off: never add html.dark, ignore OS preference
 * and any stored 'dark' key (clears it so existing users stay on light).
 */
export const THEME_BOOT_SCRIPT_WHEN_DISABLED = `(function(){try{document.documentElement.classList.remove("dark");localStorage.removeItem(${JSON.stringify(THEME_STORAGE_KEY)});}catch(e){}})();`;

export const THEME_BOOT_SCRIPT = DARK_MODE_ENABLED
  ? THEME_BOOT_SCRIPT_WHEN_ENABLED
  : THEME_BOOT_SCRIPT_WHEN_DISABLED;
