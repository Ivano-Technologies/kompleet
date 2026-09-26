import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import "./globals.css";
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

export const metadata: Metadata = {
  title: "Kompleet — Track Every Naira & Stay Compliant in Nigeria",
  description:
    "Track spending, send invoices, export tax-ready reports for Nigerian SMEs.",
  keywords: [
    "expense tracking Nigeria",
    "SME finance Nigeria",
    "tax compliance Nigeria",
    "cash flow Nigeria",
    "Kompleet app",
  ],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Kompleet — Track Every Naira & Stay Compliant in Nigeria",
    description:
      "Track spending, send invoices, export tax-ready reports for Nigerian SMEs.",
    url: siteUrl,
    siteName: "Kompleet",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kompleet — Track Every Naira & Stay Compliant in Nigeria",
    description:
      "Track spending, send invoices, export tax-ready reports for Nigerian SMEs.",
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