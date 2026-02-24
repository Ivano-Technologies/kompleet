import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.ivanotechnologies.com";

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
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}