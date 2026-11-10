/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import {
  contactReplyTo,
  contactSubjectName,
  stripHeaderControls,
} from "./contact-email";

describe("stripHeaderControls", () => {
  it("removes CR, LF, tabs and other C0 controls", () => {
    expect(stripHeaderControls("Ada\r\nBcc: evil@x.com\t\x07")).toBe(
      "AdaBcc: evil@x.com",
    );
  });
});

describe("contactSubjectName", () => {
  it("keeps a normal name", () => {
    expect(contactSubjectName("Ada Okafor")).toBe("Ada Okafor");
  });

  it("strips CR/LF so a name cannot split the Subject header", () => {
    expect(contactSubjectName("Ada\r\nBcc: staff@evil.test")).toBe(
      "AdaBcc: staff@evil.test",
    );
  });
});

describe("contactReplyTo", () => {
  it("returns a trimmed valid address", () => {
    expect(contactReplyTo("  ada@example.com  ")).toBe("ada@example.com");
  });

  it("strips trailing CR/LF and keeps a still-valid address", () => {
    expect(contactReplyTo("ada@example.com\r\n")).toBe("ada@example.com");
  });

  it("omits an address that is invalid after stripping header injection", () => {
    expect(contactReplyTo("ada@example.com\r\nBcc: evil@x.com")).toBeUndefined();
  });

  it("omits a malformed address", () => {
    expect(contactReplyTo("not-an-email")).toBeUndefined();
    expect(contactReplyTo("")).toBeUndefined();
  });
});
