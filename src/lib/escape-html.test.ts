/** @vitest-environment node */

import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("encodes markup characters so they cannot inject into HTML email", () => {
    expect(escapeHtml(`Ada <script>alert(1)</script> & "O'Brien"`)).toBe(
      "Ada &lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;O&#39;Brien&quot;",
    );
  });

  it("stringifies non-strings", () => {
    expect(escapeHtml(undefined)).toBe("undefined");
    expect(escapeHtml(12)).toBe("12");
  });
});
