import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CANONICAL_APP_HOST,
  eventIsFailedToFetch,
  shouldDropStaleHostFailedFetch,
} from "./drop-stale-host-fetch";

const failedFetchEvent = {
  exception: {
    values: [{ type: "TypeError", value: "Failed to fetch" }],
  },
};

describe("KOMPLEET-PLATFORM-6 stale-host Failed to fetch filter", () => {
  it("recognises Failed to fetch and TypeError Failed to fetch only", () => {
    expect(eventIsFailedToFetch(failedFetchEvent)).toBe(true);
    expect(
      eventIsFailedToFetch({
        exception: { values: [{ value: "TypeError: Failed to fetch" }] },
      }),
    ).toBe(true);
    expect(eventIsFailedToFetch({ message: "Failed to fetch" })).toBe(true);
    expect(
      eventIsFailedToFetch({
        exception: { values: [{ type: "Error", value: "Failed to fetch tax rules" }] },
      }),
    ).toBe(false);
    expect(
      eventIsFailedToFetch({
        exception: { values: [{ type: "Error", value: "NetworkError" }] },
      }),
    ).toBe(false);
  });

  it("drops Failed to fetch off the canonical host and keeps it on kompleet", () => {
    expect(
      shouldDropStaleHostFailedFetch(failedFetchEvent, "www.ivanotechnologies.com"),
    ).toBe(true);
    expect(
      shouldDropStaleHostFailedFetch(failedFetchEvent, "ivanotechnologies.com"),
    ).toBe(true);
    expect(
      shouldDropStaleHostFailedFetch(failedFetchEvent, CANONICAL_APP_HOST),
    ).toBe(false);
    expect(
      shouldDropStaleHostFailedFetch(
        {
          ...failedFetchEvent,
          request: { url: `https://${CANONICAL_APP_HOST}/transactions` },
        },
        undefined,
      ),
    ).toBe(false);
  });

  it("does not drop other errors or events with an unknown host", () => {
    expect(
      shouldDropStaleHostFailedFetch(
        { exception: { values: [{ type: "Error", value: "boom" }] } },
        "www.ivanotechnologies.com",
      ),
    ).toBe(false);
    expect(shouldDropStaleHostFailedFetch(failedFetchEvent, undefined)).toBe(
      false,
    );
    expect(shouldDropStaleHostFailedFetch(failedFetchEvent, "")).toBe(false);
  });

  it("wires the client beforeSend filter and does not widen CORS", () => {
    const client = readFileSync(
      resolve(process.cwd(), "instrumentation-client.ts"),
      "utf8",
    );
    const cors = readFileSync(resolve(process.cwd(), "src/lib/cors.ts"), "utf8");
    expect(client).toMatch(/shouldDropStaleHostFailedFetch/);
    expect(client).toMatch(/window\.location\.hostname/);
    expect(client).not.toMatch(/ivanotechnologies\.com/);
    expect(cors).toMatch(/ALWAYS_ALLOWED_ORIGINS = \["https:\/\/kompleet\.techivano\.com"\]/);
    expect(cors).not.toMatch(/ALWAYS_ALLOWED_ORIGINS[\s\S]*ivanotechnologies/);
    expect(cors).toMatch(/intentionally absent/);
  });
});
