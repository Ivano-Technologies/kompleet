"use client";

/* eslint-disable @next/next/no-img-element -- business logos come from Convex storage URLs */

import { useState } from "react";
import { INV_COPY } from "@/components/invoices/invoice-copy";
import { BIZ_COPY } from "@/components/settings/profile-copy";
import {
  CustomerCombobox,
  type InvoiceClient,
} from "@/components/invoices/CustomerCombobox";
import {
  formatCityLine,
  formatContactLine,
  hasLegalName,
  isBusinessProfileComplete,
  trimToEmpty,
  type BusinessProfile,
  type PartySnapshot,
} from "@/lib/invoices/profiles";
import {
  INVOICE_BW,
  INVOICE_FOOTER_TEXT,
  IVANO_MARK_ALT,
  IVANO_MARK_HEIGHT_PX,
  IVANO_MARK_SRC,
  IVANO_MARK_WIDTH_PX,
  LOGO_MAX_HEIGHT_PX,
  LOGO_MAX_WIDTH_PX,
  resolveInvoiceSender,
  resolveSenderHeader,
  type InvoiceSenderParty,
} from "@/lib/invoices/invoice-branding";
import type { InvoiceView } from "@/lib/invoices/view-types";
import {
  displayTotals,
  hasLineDiscount,
  lineDiscount,
  lineNetAmount,
  vatSummaryRows,
} from "@/lib/invoices/line-amounts";

/*
 * IVA-185: the invoice document is black and white only. The business logo is
 * the one exception, plus the greys of the Ivano V mark. Text #000, secondary
 * #555, hairlines #ddd. Never shows Kompleet as the sender.
 */
const BW = INVOICE_BW;

function billToFromInvoice(invoice: InvoiceView): PartySnapshot | null {
  const info = invoice.customer_info;
  if (!info || !trimToEmpty(info.name)) return null;
  return {
    name: info.name,
    addressLine1: info.addressLine1,
    addressLine2: info.addressLine2,
    city: info.city,
    state: info.state,
    country: info.country,
    email: info.email,
    phone: info.phone,
    tin: info.tin,
  };
}

function PartyLines({ party }: { party: PartySnapshot | InvoiceSenderParty }) {
  const cityLine = formatCityLine(party);
  const contact = formatContactLine(party);
  const lines = [
    party.addressLine1,
    party.addressLine2,
    cityLine,
    contact,
    party.tin ? `TIN ${party.tin}` : null,
    party.vatNumber ? `VAT ${party.vatNumber}` : null,
  ].filter(Boolean) as string[];
  return (
    <>
      {lines.map((line) => (
        <p key={line} className="text-xs leading-snug" style={{ color: BW.secondary }}>
          {line}
        </p>
      ))}
    </>
  );
}

function money(value: number | null | undefined): string {
  return `₦${(value ?? 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return INV_COPY.notSet;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function DateValue({ value }: { value: string | null | undefined }) {
  const text = formatDate(value);
  const empty = text === INV_COPY.notSet;
  return (
    <dd
      className={`text-right ${empty ? "font-normal" : "font-semibold"}`}
      style={empty ? { color: BW.secondary } : undefined}
    >
      {text}
    </dd>
  );
}

/** Left side of the header: logo plus name, name only, or the neutral placeholder. */
export function InvoiceSenderMark({
  sender,
  onOpenSettings,
}: {
  sender: InvoiceSenderParty;
  onOpenSettings?: () => void;
}) {
  const [measured, setMeasured] = useState<{ w: number; h: number } | null>(null);
  const header = resolveSenderHeader({
    name: sender.name,
    logoUrl: sender.logoUrl,
    logoWidth: sender.logoWidth ?? measured?.w,
    logoHeight: sender.logoHeight ?? measured?.h,
  });

  if (header.mode === "logo") {
    return (
      <div className="flex items-center gap-3 min-w-0" data-testid="invoice-sender" data-mode="logo">
        <img
          src={header.logo.url}
          alt={header.name || "Business logo"}
          className="block shrink-0 object-contain"
          style={{
            maxHeight: LOGO_MAX_HEIGHT_PX,
            maxWidth: LOGO_MAX_WIDTH_PX,
            width: "auto",
            height: "auto",
          }}
          onLoad={(event) => {
            const img = event.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setMeasured({ w: img.naturalWidth, h: img.naturalHeight });
            }
          }}
        />
        {header.showName && (
          <p className="font-bold leading-tight break-words min-w-0" style={{ fontSize: 16, color: BW.text }}>
            {header.name}
          </p>
        )}
      </div>
    );
  }

  if (header.mode === "name") {
    return (
      <p
        className="font-bold leading-tight break-words"
        style={{ fontSize: 18, color: BW.text }}
        data-testid="invoice-sender"
        data-mode="name"
      >
        {header.name}
      </p>
    );
  }

  return (
    <div data-testid="invoice-sender" data-mode="placeholder">
      <p className="font-bold leading-tight" style={{ fontSize: 18, color: BW.secondary }}>
        {INV_COPY.fromFallback}
      </p>
      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          className="mt-1 text-xs underline underline-offset-2"
          style={{ color: BW.text }}
        >
          {INV_COPY.addLogo}
        </button>
      )}
    </div>
  );
}

function StatusOutline({ status }: { status: string }) {
  if (!status) return null;
  return (
    <span
      className="inline-block mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
      style={{ border: `1px solid ${BW.text}`, color: BW.text, background: "transparent" }}
      data-testid="invoice-status"
    >
      {status}
    </span>
  );
}

export function BusinessNudgeBanner({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 bg-info-bg border border-[#BFDBFE] rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-bold text-primary">{BIZ_COPY.nudgeTitle}</p>
        <p className="text-xs text-text-2">{BIZ_COPY.nudgeSub}</p>
      </div>
      <button
        type="button"
        onClick={onOpenSettings}
        className="shrink-0 text-xs font-semibold text-primary bg-surface border border-border rounded-md px-3 py-2"
      >
        {BIZ_COPY.nudgeCta}
      </button>
    </div>
  );
}

export function InvoicePreview({
  invoice,
  profile,
  clients,
  selectedClient,
  onSelectClient,
  onClientCreated,
  onOpenSettings,
  editable = false,
}: {
  invoice: InvoiceView;
  profile: BusinessProfile | null;
  clients?: InvoiceClient[];
  selectedClient?: InvoiceClient | null;
  onSelectClient?: (client: InvoiceClient | null) => void;
  onClientCreated?: (client: InvoiceClient) => void;
  onOpenSettings: () => void;
  editable?: boolean;
}) {
  // Issued invoices use the issue time snapshot; drafts use the live profile.
  const sender = resolveInvoiceSender(invoice, profile);
  const billTo = selectedClient
    ? {
        name: selectedClient.legal_name,
        addressLine1: selectedClient.addressLine1,
        addressLine2: selectedClient.addressLine2,
        city: selectedClient.city,
        state: selectedClient.state,
        country: selectedClient.country,
        email: selectedClient.email,
        phone: selectedClient.phone,
      }
    : billToFromInvoice(invoice);
  const missingLegal = !profile || !hasLegalName(profile);
  const incomplete = Boolean(profile && hasLegalName(profile) && !isBusinessProfileComplete(profile));
  const missingClient = !billTo;
  const attachmentNote = invoice.notes?.startsWith("Attached: ")
    ? invoice.notes.replace("Attached: ", "")
    : null;
  const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  // Totals are rebuilt from the lines (Subtotal = sum of rounded line amounts,
  // VAT on the Subtotal, Total = Subtotal + VAT). Stored values only when there are no lines.
  const totals = displayTotals(invoice);
  const subtotal = totals.subtotal || totals.total_amount || 0;
  const showDiscount = hasLineDiscount(lineItems);
  const vatRows =
    lineItems.length > 0
      ? vatSummaryRows(lineItems)
      : totals.vat_amount > 0
        ? [{ label: "VAT", vat: totals.vat_amount }]
        : [];
  const labelCls = "text-[10px] font-bold tracking-[0.08em] uppercase";

  return (
    <div className="space-y-4">
      {(missingLegal || incomplete) && (
        <BusinessNudgeBanner onOpenSettings={onOpenSettings} />
      )}

      <article
        data-testid="invoice-document"
        className="rounded-xl p-4 sm:p-7 space-y-5 min-w-0"
        style={{ background: BW.background, color: BW.text, border: `1px solid ${BW.hairline}` }}
      >
        {/* Header: business on the left, Ivano V mark on the right */}
        <header
          className="flex items-start justify-between gap-4 pb-4"
          style={{ borderBottom: `1px solid ${BW.hairline}` }}
        >
          <div className="min-w-0 flex-1 space-y-2">
            <InvoiceSenderMark
              sender={sender}
              onOpenSettings={trimToEmpty(sender.name) ? undefined : onOpenSettings}
            />
            {trimToEmpty(sender.name) && (
              <div>
                <PartyLines party={sender} />
                {editable && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="mt-1.5 text-[11px] underline underline-offset-2"
                    style={{ color: BW.text }}
                  >
                    {INV_COPY.fromEdit}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end text-right">
            <img
              src={IVANO_MARK_SRC}
              alt={IVANO_MARK_ALT}
              width={IVANO_MARK_WIDTH_PX}
              height={IVANO_MARK_HEIGHT_PX}
              className="block"
              style={{ height: IVANO_MARK_HEIGHT_PX, width: "auto" }}
              data-testid="ivano-mark"
            />
            <p className="mt-2 text-lg font-bold leading-none" style={{ color: BW.text }}>
              INVOICE
            </p>
            <p className="mt-1 text-xs" style={{ color: BW.secondary }}>
              {invoice.invoice_number}
            </p>
            <StatusOutline status={invoice.status} />
          </div>
        </header>

        {/* Bill to and dates */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5">
          <div
            className="rounded-lg"
            style={
              missingClient
                ? { border: `1px dashed ${BW.text}`, padding: 12 }
                : undefined
            }
          >
            <p className={labelCls} style={{ color: BW.secondary }}>
              {INV_COPY.billtoLabel}
            </p>
            {billTo ? (
              <div className="mt-1.5">
                <p className="text-[15px] font-bold mb-1" style={{ color: BW.text }}>
                  {billTo.name}
                </p>
                <PartyLines party={billTo} />
              </div>
            ) : (
              <p className="mt-1.5 text-sm font-semibold" style={{ color: BW.text }}>
                {INV_COPY.billtoEmpty}
              </p>
            )}
            {editable && clients && onSelectClient && onClientCreated && (
              <div className="mt-3">
                <CustomerCombobox
                  clients={clients}
                  value={selectedClient ?? null}
                  onChange={onSelectClient}
                  onCreated={onClientCreated}
                />
              </div>
            )}
            {missingClient && (
              <p className="mt-3 text-xs" style={{ color: BW.secondary }}>
                {INV_COPY.billtoRequired}.{editable ? " Save draft is still available." : ""}
              </p>
            )}
          </div>

          <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1.5 text-xs self-start">
            <dt style={{ color: BW.secondary }}>Issue date</dt>
            <DateValue value={invoice.invoice_date} />
            <dt style={{ color: BW.secondary }}>Due date</dt>
            <DateValue value={invoice.due_date} />
            <dt style={{ color: BW.secondary }}>{attachmentNote ? "Attachment" : "Currency"}</dt>
            <dd className="text-right font-semibold break-all">{attachmentNote ?? "NGN (₦)"}</dd>
          </dl>
        </div>

        {/* Line items: black/grey ink on white only. Tighter Qty/Rate and a
            smaller mobile font so every column, including Amount, fits at 390.
            PDF layout is separate and stays as it is. */}
        <div className="min-w-0">
          <table
            className="w-full table-fixed text-[10px] leading-snug sm:text-sm sm:leading-normal"
            data-testid="invoice-items"
          >
            <colgroup>
              <col />
              <col className="w-8 sm:w-12" />
              <col className="w-[5.25rem] sm:w-24" />
              {showDiscount && <col className="w-[5.25rem] sm:w-24" />}
              <col className="w-[5.5rem] sm:w-28" />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BW.rule}` }}>
                <th className="py-2 pr-1 sm:pr-2 text-left font-bold">Description</th>
                <th className="py-2 px-0.5 sm:px-2 text-right font-bold">Qty</th>
                <th className="py-2 px-0.5 sm:px-2 text-right font-bold">Rate</th>
                {showDiscount && (
                  <th className="py-2 px-0.5 sm:px-2 text-right font-bold">Discount</th>
                )}
                <th className="py-2 pl-0.5 sm:pl-2 text-right font-bold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(lineItems.length > 0
                ? lineItems
                : [{ description: invoice.title || "Services", quantity: 1, unit_price: subtotal, vat_rate: 0, amount: subtotal }]
              ).map((item, index) => (
                <tr key={index} style={{ borderBottom: `1px solid ${BW.hairline}` }}>
                  <td className="py-2 sm:py-2.5 pr-1 sm:pr-2 min-w-0 break-words">{item.description}</td>
                  <td className="py-2 sm:py-2.5 px-0.5 sm:px-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-2 sm:py-2.5 px-0.5 sm:px-2 text-right tabular-nums whitespace-nowrap">
                    {money(item.unit_price)}
                  </td>
                  {showDiscount && (
                    <td className="py-2 sm:py-2.5 px-0.5 sm:px-2 text-right tabular-nums whitespace-nowrap">
                      {lineDiscount(item) > 0 ? money(lineDiscount(item)) : ""}
                    </td>
                  )}
                  <td className="py-2 sm:py-2.5 pl-0.5 sm:pl-2 text-right tabular-nums whitespace-nowrap">
                    {money(lineNetAmount(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals: Total bold, above a single black rule */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span style={{ color: BW.secondary }}>Subtotal</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            {vatRows.map((row) => (
              <div key={row.label} className="flex justify-between" data-testid="invoice-vat-row">
                <span style={{ color: BW.secondary }}>{row.label}</span>
                <span className="tabular-nums">{money(row.vat)}</span>
              </div>
            ))}
            <div
              className="flex justify-between pt-2 pb-1.5 font-bold text-base"
              style={{ borderBottom: `2px solid ${BW.rule}` }}
              data-testid="invoice-total"
            >
              <span>Total</span>
              <span className="tabular-nums">{money(totals.total_amount)}</span>
            </div>
          </div>
        </div>

        <p className="text-center pt-2" style={{ fontSize: 8, color: BW.secondary }}>
          {INVOICE_FOOTER_TEXT}
        </p>
      </article>
    </div>
  );
}
