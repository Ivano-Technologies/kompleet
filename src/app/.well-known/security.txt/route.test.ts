import { describe, expect, it } from "vitest";
import { GET, SECURITY_TXT } from "./route";

describe("GET /.well-known/security.txt", () => {
  it("returns RFC 9116 text with the support contact", async () => {
    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    const body = await response.text();
    expect(body).toContain("Contact: mailto:support@ivanotechnologies.com");
    expect(body).toContain("Canonical: https://kompleet.techivano.com/.well-known/security.txt");
    expect(body).toBe(`${SECURITY_TXT}\n`);
  });
});
