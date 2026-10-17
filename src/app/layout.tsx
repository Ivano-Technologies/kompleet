import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import "./globals.css";
import { CANONICAL_ORIGIN } from "@/lib/seo/site";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { YearProvider } from "@/contexts/year-context";
import { ConvexAuthClientProvider } from "@/components/providers/ConvexAuthClientProvider";

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
    "Bookkeeping made simple. Track spending, send invoices and export clean financial reports from one easy web app built for growing businesses.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: { url: "/apple-touch-180.png", sizes: "180x180", type: "image/png" },
  },
  openGraph: {
    title: "Kompleet: Stress-Free Bookkeeping and Invoicing",
    description:
      "Bookkeeping made simple. Track spending, send invoices and export clean financial reports from one easy web app built for growing businesses.",
    url: siteUrl,
    siteName: "Kompleet",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kompleet: Stress-Free Bookkeeping and Invoicing",
    description:
      "Bookkeeping made simple. Track spending, send invoices and export clean financial reports from one easy web app built for growing businesses.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`${montserrat.variable} ${ceoruse.variable}`}>
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
          <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
          <link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-touch-180.png" />
          <meta name="theme-color" content="#0D9488" />
        </head>
        <body className="font-body">
          <ConvexAuthClientProvider>
            <ThemeProvider>
              <YearProvider>{children}</YearProvider>
            </ThemeProvider>
          </ConvexAuthClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}