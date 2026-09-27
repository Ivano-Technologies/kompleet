import { redirect } from "next/navigation";

export default async function InvoiceEditRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/invoices/${id}`);
}
