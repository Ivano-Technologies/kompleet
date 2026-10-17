import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/** Share card size for og:image and twitter:image. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = "Kompleet";
export const OG_CONTENT_TYPE = "image/png";

/** Footer tagline under the wordmark (components/landing/LandingFooter.tsx), verbatim. */
const TAGLINE = "Tax compliance and financial management for Nigerian SMEs.";

/* Option C teal lock tokens (tailwind.config.cjs). */
const PRIMARY_DEEP = "#072A45";
const PRIMARY = "#0B3A5C";
const ACCENT = "#0D9488";
/** Hairline and URL text on navy, as text-white/70 on the marketing dark bands. */
const HAIRLINE = "rgba(255, 255, 255, 0.16)";
const URL_TEXT = "rgba(255, 255, 255, 0.7)";

/** Side margin shared by the wordmark, tagline and URL line. */
const SIDE = 104;
const WORDMARK_FONT_SIZE = 146;

/**
 * KOMPLEET share card: primary-deep navy, the Ceoruse KOMPLEET wordmark
 * (BrandWordmark lock, no logo mark), a teal accent rule and the footer
 * tagline. Prerendered at build, so fonts are read from the repo.
 */
export async function renderBrandImage(): Promise<ImageResponse> {
  const root = process.cwd();
  const [ceoruse, montserrat] = await Promise.all([
    readFile(join(root, "public/fonts/ceoruse.otf")),
    readFile(join(root, "src/lib/seo/og/Montserrat-400.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: `0 ${SIDE}px`,
          backgroundColor: PRIMARY_DEEP,
          backgroundImage: `linear-gradient(135deg, ${PRIMARY_DEEP} 0%, ${PRIMARY_DEEP} 50%, ${PRIMARY} 100%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Ceoruse",
            // Ink spans x 104 to 1096: 992px with equal 104px side margins.
            fontSize: WORDMARK_FONT_SIZE,
            lineHeight: 1,
            letterSpacing: 4,
            color: "#FFFFFF",
            textTransform: "uppercase",
          }}
        >
          KOMPLEET
        </div>
        <div
          style={{
            display: "flex",
            width: 120,
            height: 8,
            marginTop: 48,
            borderRadius: 4,
            backgroundColor: ACCENT,
          }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontFamily: "Montserrat",
            fontSize: 44,
            lineHeight: 1.35,
            color: "rgba(255, 255, 255, 0.82)",
            maxWidth: 900,
          }}
        >
          {TAGLINE}
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: SIDE,
            right: SIDE,
            bottom: 56,
            paddingTop: 22,
            borderTop: `1px solid ${HAIRLINE}`,
            fontFamily: "Montserrat",
            fontSize: 26,
            color: URL_TEXT,
          }}
        >
          kompleet.techivano.com
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 14,
            backgroundColor: ACCENT,
          }}
        />
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Ceoruse", data: ceoruse, weight: 700, style: "normal" },
        { name: "Montserrat", data: montserrat, weight: 400, style: "normal" },
      ],
    },
  );
}
