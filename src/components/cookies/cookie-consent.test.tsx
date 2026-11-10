import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentProvider";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import {
  COOKIE_BANNER_HEIGHT_VAR,
  COOKIE_CONSENT_STORAGE_KEY,
  CONSENT_MODE_DEFAULT_DENIED,
  applyCookieBannerHeight,
  clearCookieBannerHeight,
  gtagScriptUrl,
} from "@/lib/cookie-consent";

const MEASUREMENT_ID = "G-TESTCONSENT1";

function gaScript(): HTMLScriptElement | null {
  return document.querySelector(`script[src="${gtagScriptUrl(MEASUREMENT_ID)}"]`);
}

function renderConsentUi() {
  return render(
    <CookieConsentProvider measurementId={MEASUREMENT_ID}>
      <CookieSettingsButton />
    </CookieConsentProvider>,
  );
}

const BANNER_HEIGHT_PX = 190;

class MeasuringResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      x: 0,
      y: 654,
      width: 390,
      height: BANNER_HEIGHT_PX,
      top: 654,
      right: 390,
      bottom: 844,
      left: 0,
      toJSON() {
        return {};
      },
    } as DOMRect);
    this.callback([], this as unknown as ResizeObserver);
  }

  unobserve(): void {}

  disconnect(): void {}
}

describe("Google Analytics cookie consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.gtag;
    delete window.dataLayer;
    document
      .querySelectorAll("script[data-kompleet-ga]")
      .forEach((node) => node.remove());
    vi.stubGlobal("ResizeObserver", MeasuringResizeObserver);
    clearCookieBannerHeight();
  });

  afterEach(() => {
    cleanup();
    clearCookieBannerHeight();
    vi.unstubAllGlobals();
    document
      .querySelectorAll("script[data-kompleet-ga]")
      .forEach((node) => node.remove());
  });

  it("does not load GA before consent", async () => {
    renderConsentUi();

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Cookie notice" }),
      ).toBeInTheDocument();
    });

    expect(gaScript()).toBeNull();
    expect(
      document.querySelector('script[src*="googletagmanager.com"]'),
    ).toBeNull();
    expect(window.gtag).toEqual(expect.any(Function));

    const consentCalls = (window.dataLayer ?? []).filter(
      (entry) => Array.isArray(entry) && entry[0] === "consent",
    );
    expect(consentCalls[0]).toEqual([
      "consent",
      "default",
      CONSENT_MODE_DEFAULT_DENIED,
    ]);
  });

  it("does not load GA when the user declines", async () => {
    const user = userEvent.setup();
    renderConsentUi();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Decline" }));

    expect(gaScript()).toBeNull();
    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(
      "denied",
    );
    expect(
      screen.queryByRole("dialog", { name: "Cookie notice" }),
    ).not.toBeInTheDocument();
  });

  it("loads GA only after accept", async () => {
    const user = userEvent.setup();
    renderConsentUi();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Accept" })).toBeInTheDocument();
    });

    expect(gaScript()).toBeNull();

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(gaScript()).not.toBeNull();
    expect(window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)).toBe(
      "granted",
    );
  });

  it("lets Cookie settings reopen the banner after a stored choice", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "denied");
    renderConsentUi();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cookie settings" }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("dialog", { name: "Cookie notice" }),
    ).not.toBeInTheDocument();
    expect(gaScript()).toBeNull();

    await user.click(screen.getByRole("button", { name: "Cookie settings" }));

    expect(
      screen.getByRole("dialog", { name: "Cookie notice" }),
    ).toBeInTheDocument();
    expect(gaScript()).toBeNull();
  });

  it("reserves the measured banner height on the document while open", async () => {
    renderConsentUi();

    await waitFor(() => {
      expect(
        document.documentElement.style.getPropertyValue(COOKIE_BANNER_HEIGHT_VAR),
      ).toBe(`${BANNER_HEIGHT_PX}px`);
    });
  });

  it("removes the reserved inset when the banner closes", async () => {
    const user = userEvent.setup();
    renderConsentUi();

    await waitFor(() => {
      expect(
        screen.getByRole("dialog", { name: "Cookie notice" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Decline" }));

    expect(
      document.documentElement.style.getPropertyValue(COOKIE_BANNER_HEIGHT_VAR),
    ).toBe("0px");
  });

  it("stays below settings dialogs and scrolls at a 390-wide viewport", () => {
    const banner = readFileSync(
      resolve(process.cwd(), "src/components/cookies/CookieConsentBanner.tsx"),
      "utf8",
    );
    expect(banner).toMatch(/\bz-40\b/);
    expect(banner).toMatch(/max-h-\[40vh\]/);
    expect(banner).toMatch(/overflow-y-auto/);
  });

  it("keeps Decline and Accept equal width on one row at a narrow width", async () => {
    renderConsentUi();

    const decline = await screen.findByRole("button", { name: "Decline" });
    const accept = screen.getByRole("button", { name: "Accept" });
    const row = decline.parentElement;
    expect(row).not.toBeNull();
    expect(row).toHaveClass("grid-cols-2");
    expect(row?.className).toMatch(/\bgap-2\b/);
    expect(row?.firstElementChild).toBe(decline);
    expect(row?.lastElementChild).toBe(accept);
  });
});

describe("cookie banner height helpers", () => {
  afterEach(() => {
    clearCookieBannerHeight();
  });

  it("writes a CSS custom property and clears it", () => {
    applyCookieBannerHeight(189.2);
    expect(
      document.documentElement.style.getPropertyValue(COOKIE_BANNER_HEIGHT_VAR),
    ).toBe("190px");
    clearCookieBannerHeight();
    expect(
      document.documentElement.style.getPropertyValue(COOKIE_BANNER_HEIGHT_VAR),
    ).toBe("0px");
  });

  it("pads body from the measured CSS variable", () => {
    const globals = readFileSync(
      resolve(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    expect(globals).toMatch(/--cookie-banner-height:\s*0px/);
    expect(globals).toMatch(
      /padding-bottom:\s*var\(--cookie-banner-height, 0px\)/,
    );
    expect(globals).toMatch(
      /scroll-padding-bottom:\s*var\(--cookie-banner-height, 0px\)/,
    );
  });
});
