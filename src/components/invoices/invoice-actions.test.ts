/** @vitest-environment node */

import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveOrCreateClient } from "./invoice-actions";
import type { InvoiceClient } from "./CustomerCombobox";

const fixtureClient: InvoiceClient = {
  id: "cli-fixture-1",
  legal_name: "Audit Customer One",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: "NG",
};

describe("resolveOrCreateClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the selected client without creating another", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await resolveOrCreateClient({
      selected: fixtureClient,
      pendingName: "Ignored Name",
      clients: [],
    });
    expect(result).toEqual(fixtureClient);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("selects an existing client by typed name", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await resolveOrCreateClient({
      selected: null,
      pendingName: "audit customer one",
      clients: [fixtureClient],
    });
    expect(result?.id).toBe("cli-fixture-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("creates a client from the typed quick-create name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
        expect(init?.method).toBe("POST");
        const body = JSON.parse(String(init?.body)) as { legal_name: string };
        expect(body.legal_name).toBe("Audit Customer One");
        return {
          ok: true,
          json: async () => ({ client: fixtureClient }),
        };
      }),
    );
    const result = await resolveOrCreateClient({
      selected: null,
      pendingName: "Audit Customer One",
      clients: [],
    });
    expect(result).toEqual(fixtureClient);
  });
});
