import { ClerkProvider } from '@clerk/nextjs';

// Root layout component
export const metadata = {
  title: 'Kompleet Platform',
  description: 'Professional platform for transaction management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
