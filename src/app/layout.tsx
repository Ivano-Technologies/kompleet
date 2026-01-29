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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
