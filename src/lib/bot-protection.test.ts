import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BOT_BLOCKED_MESSAGE,
  assertHumanRequest,
  botIdServerEnabled,
  turnstileExpected,
  verifyTurnstileToken,
} from "./bot-protection";

describe("bot protection env gates", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is off when BotID and Turnstile env are absent", () => {
    vi.stubEnv("BOTID_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    expect(botIdServerEnabled()).toBe(false);
    expect(turnstileExpected()).toBe(false);
  });

  it("verifies Turnstile tokens against siteverify", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(verifyTurnstileToken("tok_abc", "1.1.1.1")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects missing Turnstile tokens when the site key is advertised", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false }),
      }),
    );

    const result = await assertHumanRequest(
      new Request("https://kompleet.test/api/contact", { method: "POST" }),
      { turnstileToken: null },
    );
    expect(result).toEqual({ ok: false, message: BOT_BLOCKED_MESSAGE });
  });

  it("allows the request when no bot env is set", async () => {
    vi.stubEnv("BOTID_ENABLED", "");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const result = await assertHumanRequest(
      new Request("https://kompleet.test/api/auth", { method: "POST" }),
    );
    expect(result).toEqual({ ok: true });
  });
});
