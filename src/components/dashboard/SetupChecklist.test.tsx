/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupChecklist } from "./SetupChecklist";
import { SETUP_COPY } from "./setup-copy";
import { emptyBusinessProfile } from "@/lib/invoices/profiles";
import {
  checklistBannerSessionKey,
  checklistSoftKey,
} from "@/lib/invoices/setup-checklist";

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

  it("soft-dismisses to the info banner when legalName is empty", async () => {
    mockProfile();
    render(<SetupChecklist userId={USER_ID} />);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: SETUP_COPY.ctaLater }).length).toBeGreaterThan(0);
    });
    const later = screen.getAllByRole("button", { name: SETUP_COPY.ctaLater });
    await userEvent.click(later[later.length - 1]!);

    expect(window.localStorage.getItem(checklistSoftKey(USER_ID))).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.bannerSub)).toBeTruthy();
    expect(screen.queryByRole("button", { name: SETUP_COPY.ctaPrimary })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: SETUP_COPY.bannerDismiss }));
    expect(window.sessionStorage.getItem(checklistBannerSessionKey(USER_ID))).toBeTruthy();
    expect(screen.queryByText(SETUP_COPY.bannerSub)).toBeNull();
  });

  it("hides the card permanently when the IVA-82 complete-profile rule is met", async () => {
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
