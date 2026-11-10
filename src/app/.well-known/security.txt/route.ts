const CANONICAL =
  "https://kompleet.techivano.com/.well-known/security.txt";

/** RFC 9116: Expires must be no more than one year out. */
const EXPIRES = "2027-11-09T00:00:00.000Z";

export const SECURITY_TXT = [
  "Contact: mailto:support@ivanotechnologies.com",
  `Expires: ${EXPIRES}`,
  "Preferred-Languages: en",
  `Canonical: ${CANONICAL}`,
].join("\n");

export function GET() {
  return new Response(`${SECURITY_TXT}\n`, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
