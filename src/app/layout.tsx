import { AuthProvider } from '@/contexts/AuthContext';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
});

// Root layout component
export const metadata = {
  title: 'KOMPLEET - Tax Compliance & Financial Management',
  description: 'Professional tax compliance and financial management platform for Nigerian businesses and individuals. Fully aligned with the 2026 Nigerian Tax Act.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
