/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EMAIL_SEND_COOLDOWN_MS,
  EMAIL_SEND_HOUR_MS,
  EMAIL_SEND_MAX_PER_HOUR,
  dummyVerificationSendWork,
  isMissingAuthAccountError,
  nextEmailSendState,
  padElapsed,
  withEqualResendWork,
} from "./authResendLimit";

describe("nextEmailSendState", () => {
  it("allows the first send", () => {
    const now = 1_000_000;
    const result = nextEmailSendState(null, now);
    expect(result.allowed).toBe(true);
    expect(result.next).toEqual({
      lastSentAt: now,
      hourStartedAt: now,
      hourCount: 1,
    });
  });

  it("blocks another send inside the cooldown window", () => {
    const now = 1_000_000;
    const first = nextEmailSendState(null, now);
    const second = nextEmailSendState(first.next, now + EMAIL_SEND_COOLDOWN_MS - 1);
    expect(second.allowed).toBe(false);
    expect(second.next).toEqual(first.next);
  });

  it("allows a send after the cooldown", () => {
    const now = 1_000_000;
    const first = nextEmailSendState(null, now);
    const second = nextEmailSendState(first.next, now + EMAIL_SEND_COOLDOWN_MS);
    expect(second.allowed).toBe(true);
    expect(second.next.hourCount).toBe(2);
  });

  it("caps sends in a rolling hour", () => {
    let state = nextEmailSendState(null, 0).next;
    for (let i = 1; i < EMAIL_SEND_MAX_PER_HOUR; i += 1) {
      const result = nextEmailSendState(state, i * EMAIL_SEND_COOLDOWN_MS);
      expect(result.allowed).toBe(true);
      state = result.next;
    }
    const blocked = nextEmailSendState(
      state,
      EMAIL_SEND_MAX_PER_HOUR * EMAIL_SEND_COOLDOWN_MS,
    );
    expect(blocked.allowed).toBe(false);
    const afterHour = nextEmailSendState(state, EMAIL_SEND_HOUR_MS);
    expect(afterHour.allowed).toBe(true);
    expect(afterHour.next.hourCount).toBe(1);
  });
});

describe("isMissingAuthAccountError", () => {
  it("matches Convex Auth InvalidAccountId", () => {
    expect(isMissingAuthAccountError(new Error("InvalidAccountId"))).toBe(true);
    expect(isMissingAuthAccountError(new Error("Invalid credentials"))).toBe(
      false,
    );
  });
});

describe("equal resend work", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("pads both known and unknown paths to the same floor", async () => {
    vi.useFakeTimers();
    const minMs = 40;
    const unknown = withEqualResendWork(
      async () => {
        throw new Error("InvalidAccountId");
      },
      async () => "missing",
      minMs,
    );
    const known = withEqualResendWork(
      async () => "found",
      async () => "missing",
      minMs,
    );
    await vi.advanceTimersByTimeAsync(minMs);
    expect(await unknown).toBe("missing");
    expect(await known).toBe("found");
  });

  it("still throws non-enumeration errors after padding", async () => {
    await expect(
      withEqualResendWork(
        async () => {
          throw new Error("Too many attempts");
        },
        async () => null,
        0,
      ),
    ).rejects.toThrow("Too many attempts");
  });

  it("builds dummy send work without throwing", async () => {
    await expect(dummyVerificationSendWork()).resolves.toBeUndefined();
  });

  it("padElapsed is a no-op when enough time has elapsed", async () => {
    const started = Date.now() - 50;
    await padElapsed(started, 10);
  });
});
