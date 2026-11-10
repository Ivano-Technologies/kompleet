export const THEME_STORAGE_KEY = "kompleet-theme";

/**
 * Runs before paint so a stored dark preference does not flash the light
 * cream tokens. Mirrors ThemeProvider's resolve rules.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var dark=t==="dark"||((t==="system"||!t)&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;
