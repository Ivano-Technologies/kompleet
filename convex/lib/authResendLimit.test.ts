/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  EMAIL_SEND_COOLDOWN_MS,
  EMAIL_SEND_HOUR_MS,
  EMAIL_SEND_MAX_PER_HOUR,
  isMissingAuthAccountError,
  nextEmailSendState,
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
    expect(second.retryAfterSeconds).toBe(1);
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
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
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
