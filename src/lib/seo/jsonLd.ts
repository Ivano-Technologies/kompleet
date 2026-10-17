import { CANONICAL_ORIGIN } from "./site";

const IVANO_URL = "https://www.ivanotechnologies.com";

/** Home page structured data: SoftwareApplication + WebSite. */
export function kompleetJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${CANONICAL_ORIGIN}/#software`,
        name: "Kompleet",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: CANONICAL_ORIGIN,
        publisher: {
          "@type": "Organization",
          name: "Ivano Technologies",
          url: IVANO_URL,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${CANONICAL_ORIGIN}/#website`,
        name: "Kompleet",
        url: CANONICAL_ORIGIN,
      },
    ],
  };
}

/** Serialises JSON-LD for a script tag, escaping "<" so it cannot close the tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
