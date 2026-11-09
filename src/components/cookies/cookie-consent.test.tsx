import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentProvider";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import {
  COOKIE_CONSENT_STORAGE_KEY,
  CONSENT_MODE_DEFAULT_DENIED,
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

describe("Google Analytics cookie consent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.gtag;
    delete window.dataLayer;
    document
      .querySelectorAll("script[data-kompleet-ga]")
      .forEach((node) => node.remove());
  });

  afterEach(() => {
    cleanup();
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
});
