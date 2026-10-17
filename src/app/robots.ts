import type { MetadataRoute } from "next";
import { absoluteUrl, PRIVATE_ROUTE_PREFIXES } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTE_PREFIXES],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
