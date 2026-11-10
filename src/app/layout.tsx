import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { connection } from "next/server";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import "./globals.css";
import { CANONICAL_ORIGIN } from "@/lib/seo/site";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { YearProvider } from "@/contexts/year-context";
import { ConvexAuthClientProvider } from "@/components/providers/ConvexAuthClientProvider";
import { ErrorToaster } from "@/components/ui/error-toast";
import { AuthLinkErrorRedirect } from "@/components/auth/AuthLinkErrorRedirect";
import { CookieConsentProvider } from "@/components/cookies/CookieConsentProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

const ceoruse = localFont({
  src: "../../public/fonts/ceoruse.otf",
  variable: "--font-ceoruse",
  display: "swap",
});

// Canonical host. Set NEXT_PUBLIC_SITE_URL per-environment in Vercel; the
// fallback exists so local and preview builds still emit absolute OG URLs.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://kompleet.techivano.com";

export const viewport: Viewport = {
  themeColor: "#0D9488",
};

export const metadata: Metadata = {
  // Production host for canonical and OG image URLs (see src/lib/seo/site.ts).
  metadataBase: new URL(CANONICAL_ORIGIN),
  title: "Kompleet: Stress-Free Bookkeeping and Invoicing",
  description:
    "Bookkeeping made simple. Track spending, send invoices and export clean financial reports from one simple web app built for growing businesses.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Kompleet: Stress-Free Bookkeeping and Invoicing",
    description:
      "Bookkeeping made simple. Track spending, send invoices and export clean financial reports from one simple web app built for growing businesses.",
    url: siteUrl,
    siteName: "Kompleet",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kompleet: Stress-Free Bookkeeping and Invoicing",
    description:
      "Bookkeeping made simple. Track spending, send invoices and export clean financial reports from one simple web app built for growing businesses.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nonce CSP requires a fresh render per request (Next.js CSP guide).
  await connection();

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`${montserrat.variable} ${ceoruse.variable}`}>
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="theme-color" content="#0D9488" />
        </head>
        <body className="font-body">
          <ConvexAuthClientProvider>
            <ThemeProvider>
              <CookieConsentProvider>
                <YearProvider>{children}</YearProvider>
                <ErrorToaster />
                <AuthLinkErrorRedirect />
              </CookieConsentProvider>
            </ThemeProvider>
          </ConvexAuthClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}