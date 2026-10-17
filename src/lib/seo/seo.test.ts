import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { kompleetJsonLd } from "./jsonLd";

describe("kompleet SEO surfaces", () => {
  it("robots allows marketing, blocks app routes, points at the sitemap", () => {
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(
      expect.arrayContaining(["/api/", "/app/", "/dashboard", "/login", "/auth/"]),
    );
    // "/app" alone would also block /apple-touch-icon.png.
    expect(rules.disallow).not.toContain("/app");
    expect(r.sitemap).toBe("https://kompleet.techivano.com/sitemap.xml");
  });

  it("sitemap lists only public marketing pages on the production host", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls[0]).toBe("https://kompleet.techivano.com");
    expect(urls).toContain("https://kompleet.techivano.com/pricing");
    for (const url of urls) {
      expect(new URL(url).origin).toBe("https://kompleet.techivano.com");
      expect(url).not.toMatch(/\/(dashboard|login|signup|app|api|admin)(\/|$)/);
    }
  });

  it("JSON-LD describes Kompleet and its publisher", () => {
    const graph = kompleetJsonLd()["@graph"] as Record<string, unknown>[];
    const app = graph.find((node) => node["@type"] === "SoftwareApplication");
    expect(app).toMatchObject({
      name: "Kompleet",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: "https://kompleet.techivano.com",
      publisher: {
        "@type": "Organization",
        name: "Ivano Technologies",
        url: "https://www.ivanotechnologies.com",
      },
    });
    expect(graph.find((node) => node["@type"] === "WebSite")).toMatchObject({
      name: "Kompleet",
      url: "https://kompleet.techivano.com",
    });
  });
});
