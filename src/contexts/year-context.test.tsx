/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { YearProvider, useYear } from "./year-context";

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
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses fallback years when /api/year/available is unauthorized", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Unauthorized" }),
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
    expect(fetch).toHaveBeenCalledWith("/api/year/available");
  });

  it("uses years from the API when authenticated", async () => {
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
});
