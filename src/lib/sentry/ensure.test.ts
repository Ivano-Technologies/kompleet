import { beforeEach, describe, expect, it, vi } from "vitest";

const close = vi.fn(async () => true);
const init = vi.fn();
const getClient = vi.fn();

vi.mock("@sentry/nextjs", () => ({
  init,
  getClient,
  flush: vi.fn(async () => true),
}));

describe("ensureServerSentry", () => {
  beforeEach(() => {
    close.mockClear();
    init.mockClear();
    getClient.mockReset();
  });

  it("returns true when the current client already has a DSN", async () => {
    getClient.mockReturnValue({ getDsn: () => ({ host: "ingest.example" }) });
    const { ensureServerSentry } = await import("./ensure");
    await expect(ensureServerSentry()).resolves.toBe(true);
    expect(init).not.toHaveBeenCalled();
  });

  it("closes a disabled client and re-inits with the public DSN", async () => {
    getClient
      .mockReturnValueOnce({ getDsn: () => undefined, close })
      .mockReturnValueOnce({ getDsn: () => ({ host: "ingest.example" }) });
    const { ensureServerSentry } = await import("./ensure");
    await expect(ensureServerSentry()).resolves.toBe(true);
    expect(close).toHaveBeenCalledWith(0);
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: expect.stringMatching(/^https:\/\/.+@o\d+\.ingest\.de\.sentry\.io\/\d+$/),
      }),
    );
  });
});
