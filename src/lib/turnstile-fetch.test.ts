import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPendingTurnstileToken,
  installTurnstileFetchPatch,
  setPendingTurnstileToken,
} from "./turnstile-fetch";

describe("turnstile fetch patch", () => {
  afterEach(() => {
    setPendingTurnstileToken(null);
  });

  it("attaches x-turnstile-token on POST /api/auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    window.fetch = fetchMock as typeof fetch;
    const uninstall = installTurnstileFetchPatch();
    setPendingTurnstileToken("cf-token");

    await window.fetch("/api/auth", { method: "POST", body: "{}" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("x-turnstile-token")).toBe("cf-token");
    uninstall();
  });

  it("leaves unrelated fetches alone", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    window.fetch = fetchMock as typeof fetch;
    const uninstall = installTurnstileFetchPatch();
    setPendingTurnstileToken("cf-token");
    expect(getPendingTurnstileToken()).toBe("cf-token");

    await window.fetch("/api/health", { method: "GET" });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init?.headers);
    expect(headers.get("x-turnstile-token")).toBeNull();
    uninstall();
  });
});
