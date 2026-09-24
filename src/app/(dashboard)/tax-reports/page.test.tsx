/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import TaxReportsPage from "./page";

const authState = { isLoading: false, isAuthenticated: false };

vi.mock("convex/react", () => ({
  useConvexAuth: () => authState,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("TaxReportsPage", () => {
  beforeEach(() => {
    authState.isLoading = false;
    authState.isAuthenticated = false;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch /api/tax-reports until Convex auth resolves", () => {
    authState.isLoading = true;
    render(<TaxReportsPage />);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("skips the API when unauthenticated", async () => {
    render(<TaxReportsPage />);
    await waitFor(() => {
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  it("fetches once auth is ready", async () => {
    authState.isAuthenticated = true;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ reports: [] }),
    } as Response);

    render(<TaxReportsPage />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/tax-reports");
    expect(vi.mocked(fetch).mock.calls[0]?.[1]).toEqual({
      credentials: "same-origin",
    });
  });
});
