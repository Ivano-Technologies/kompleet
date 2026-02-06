// Force dynamic rendering to avoid static generation errors with context
export const dynamic = 'force-dynamic';

export default function ExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
