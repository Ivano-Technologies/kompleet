import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

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
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
