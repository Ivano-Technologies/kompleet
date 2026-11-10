/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { ThemeProvider, resolveTheme, useTheme } from "@/contexts/ThemeContext";
import {
  DARK_MODE_ENABLED,
  THEME_BOOT_SCRIPT,
  THEME_BOOT_SCRIPT_WHEN_DISABLED,
  THEME_BOOT_SCRIPT_WHEN_ENABLED,
  THEME_STORAGE_KEY,
} from "@/lib/theme-boot";

const read = (rel: string) => readFileSync(resolve(process.cwd(), rel), "utf8");

function ThemeProbe() {
  const { theme, resolvedTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
    </div>
  );
}

describe("DARK_MODE_ENABLED gate", () => {
  it("is off, and the runtime boot script never applies html.dark", () => {
    expect(DARK_MODE_ENABLED).toBe(false);
    expect(THEME_BOOT_SCRIPT).toBe(THEME_BOOT_SCRIPT_WHEN_DISABLED);
    expect(THEME_BOOT_SCRIPT).not.toBe(THEME_BOOT_SCRIPT_WHEN_ENABLED);
    expect(THEME_BOOT_SCRIPT).toContain('classList.remove("dark")');
    expect(THEME_BOOT_SCRIPT).not.toMatch(/classList\.toggle\("dark"/);
    expect(THEME_BOOT_SCRIPT).not.toMatch(/prefers-color-scheme/);
    expect(THEME_BOOT_SCRIPT).not.toMatch(/matchMedia/);
    expect(THEME_BOOT_SCRIPT_WHEN_ENABLED).toMatch(/classList\.toggle\("dark"/);
  });

  it("does not use next-themes or a system default at runtime", () => {
    const provider = read("src/contexts/ThemeContext.tsx");
    const layout = read("src/app/layout.tsx");
    const pkg = read("package.json");
    expect(pkg).not.toMatch(/next-themes/);
    expect(provider).not.toMatch(/next-themes/);
    expect(layout).not.toMatch(/next-themes|forcedTheme/);
    expect(layout).toMatch(
      /dangerouslySetInnerHTML=\{\{ __html: THEME_BOOT_SCRIPT \}\}/,
    );
    expect(provider).toMatch(/DARK_MODE_ENABLED \? "system" : "light"/);
    expect(resolveTheme("dark")).toBe("light");
    expect(resolveTheme("system")).toBe("light");
  });

  it("keeps Tailwind dark variants on the html.dark class, not a media query", () => {
    const globals = read("src/app/globals.css");
    expect(globals).toMatch(
      /@custom-variant dark \(&:where\(\.dark, \.dark \*\)\)/,
    );
    expect(globals).not.toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  });

  it("hides the toggle in landing nav (incl. mobile), top bar, and settings", () => {
    const nav = read("src/components/landing/LandingNav.tsx");
    const topBar = read("src/components/layout/dashboard/TopBar.tsx");
    const settings = read(
      "src/components/layout/dashboard/SettingsModal.tsx",
    );
    expect(nav).toMatch(/DARK_MODE_ENABLED \? \(/);
    expect(nav).toMatch(/onClick=\{toggleTheme\}/);
    expect(nav).toMatch(/Dark mode/);
    expect(topBar).toMatch(/DARK_MODE_ENABLED \? \(/);
    expect(topBar).toMatch(/aria-label="Toggle theme"/);
    expect(settings).toMatch(/DARK_MODE_ENABLED \? \(/);
    expect(settings).toMatch(/value: "dark" as const/);
    expect(settings).toMatch(/value: "system" as const/);
  });

  it("forces light with no html.dark when localStorage is already dark", () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    Function(THEME_BOOT_SCRIPT)();

    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("ThemeProvider ignores a stored dark preference and never sets html.dark", async () => {
    document.documentElement.classList.add("dark");
    localStorage.setItem(THEME_STORAGE_KEY, "dark");

    const { getByTestId, unmount } = render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("theme").textContent).toBe("light");
      expect(getByTestId("resolved").textContent).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    unmount();
  });
});
