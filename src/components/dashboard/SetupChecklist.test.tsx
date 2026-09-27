/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupChecklist } from "./SetupChecklist";
import { SETUP_COPY } from "./setup-copy";
import { emptyBusinessProfile } from "@/lib/invoices/profiles";
import { checklistSoftKey } from "@/lib/invoices/setup-checklist";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const USER_ID = "user_iva84";

function mockProfile(partial: Record<string, string> = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        profile: { ...emptyBusinessProfile(), ...partial },
      }),
    }),
  );
}

describe("SetupChecklist", () => {
  beforeEach(() => {
    push.mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the card for an incomplete profile and opens Settings → Business", async () => {
    mockProfile({ legalName: "Lekki Crafts Ltd" });
    render(<SetupChecklist userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SETUP_COPY.progress(1))).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: SETUP_COPY.ctaPrimary })).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: SETUP_COPY.ctaPrimary }));
    expect(push).toHaveBeenCalledWith("/dashboard?settings=business");
  });

  it("soft-dismisses the card in localStorage but keeps banner dismiss in memory only", async () => {
    mockProfile();
    const { unmount } = render(<SetupChecklist userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: SETUP_COPY.ctaLater }).length).toBeGreaterThan(0);
    });
    const later = screen.getAllByRole("button", { name: SETUP_COPY.ctaLater });
    await userEvent.click(later[later.length - 1]!);

    expect(window.localStorage.getItem(checklistSoftKey(USER_ID))).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.bannerSub)).toBeTruthy();
    expect(screen.queryByRole("button", { name: SETUP_COPY.ctaPrimary })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: SETUP_COPY.bannerDismiss }));
    expect(screen.queryByText(SETUP_COPY.bannerSub)).toBeNull();
    expect(
      Object.keys(window.localStorage).filter((key) => key.includes("banner")),
    ).toEqual([]);
    expect(
      Object.keys(window.sessionStorage).filter((key) => key.includes("banner")),
    ).toEqual([]);
    expect(window.sessionStorage.length).toBe(0);

    unmount();
    mockProfile();
    render(<SetupChecklist userId={USER_ID} />);
    await waitFor(() => {
      expect(screen.getByText(SETUP_COPY.bannerSub)).toBeTruthy();
    });
  });

  it("counts account email as contact so tax-skipped complete moment is 3 of 4", async () => {
    let stored: Record<string, string> = {
      legalName: "Lekki Crafts Ltd",
      addressLine1: "14 Marina",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async () => ({
        ok: true,
        json: async () => ({
          profile: { ...emptyBusinessProfile(), ...stored },
        }),
      })),
    );
    render(
      <SetupChecklist userId={USER_ID} accountEmail="billing@lekkicrafts.ng" />,
    );
    await waitFor(() => {
      expect(screen.getByText(SETUP_COPY.progress(2))).toBeTruthy();
    });

    stored = {
      legalName: "Lekki Crafts Ltd",
      addressLine1: "14 Marina",
      city: "Lagos",
    };
    window.dispatchEvent(new Event("kompleet:business-profile"));

    await waitFor(() => {
      expect(screen.getByText(SETUP_COPY.progress(3))).toBeTruthy();
    });
    expect(screen.getByText(SETUP_COPY.itemSkipped)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.subComplete)).toBeTruthy();
  });

  it("hides the card permanently when the IVA-82 complete-profile rule is met on first load", async () => {
    mockProfile({
      legalName: "Lekki Crafts Ltd",
      addressLine1: "14 Marina",
      city: "Lagos",
    });
    render(<SetupChecklist userId={USER_ID} />);

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(screen.queryByText(SETUP_COPY.title)).toBeNull();
    expect(screen.queryByText(SETUP_COPY.bannerSub)).toBeNull();
  });
});
