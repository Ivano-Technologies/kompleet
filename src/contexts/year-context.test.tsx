/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { YearProvider, useYear } from "./year-context";

const authState = { isLoading: false, isAuthenticated: false };

vi.mock("convex/react", () => ({
  useConvexAuth: () => authState,
}));

function Probe() {
  const { availableYears, isLoading } = useYear();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="years">{availableYears.join(",")}</span>
    </div>
  );
}

describe("YearProvider", () => {
  const currentYear = new Date().getFullYear();
  const fallback = `${currentYear - 2},${currentYear - 1},${currentYear}`;

  beforeEach(() => {
    authState.isLoading = false;
    authState.isAuthenticated = false;
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch /api/year/available until Convex auth resolves", async () => {
    authState.isLoading = true;
    authState.isAuthenticated = false;

    const { getByTestId } = render(
      <YearProvider>
        <Probe />
      </YearProvider>,
    );

    expect(getByTestId("loading").textContent).toBe("true");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses fallback years and skips the API when unauthenticated", async () => {
    const { getByTestId } = render(
      <YearProvider>
        <Probe />
      </YearProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("false");
    });
    expect(getByTestId("years").textContent).toBe(fallback);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses years from the API when authenticated", async () => {
    authState.isAuthenticated = true;
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ years: [2024, 2025] }),
    } as Response);

    const { getByTestId } = render(
      <YearProvider>
        <Probe />
      </YearProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("years").textContent).toBe("2024,2025");
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe("/api/year/available");
  });

  it("uses fallback years when the authenticated fetch is not ok", async () => {
    authState.isAuthenticated = true;
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    } as Response);

    const { getByTestId } = render(
      <YearProvider>
        <Probe />
      </YearProvider>,
    );

    await waitFor(() => {
      expect(getByTestId("loading").textContent).toBe("false");
    });
    expect(getByTestId("years").textContent).toBe(fallback);
  });
});
