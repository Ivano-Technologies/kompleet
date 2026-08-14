/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { YearProvider, useYear } from "./year-context";

const getSession = vi.fn();
const onAuthStateChange = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserClient: () => ({
    auth: {
      getSession,
      onAuthStateChange,
    },
  }),
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
    getSession.mockReset();
    onAuthStateChange.mockClear();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not fetch /api/year/available when the session is unresolved-empty", async () => {
    getSession.mockResolvedValue({ data: { session: null } });

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

  it("fetches available years only after a session exists", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
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
