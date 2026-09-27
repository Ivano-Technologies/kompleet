"use client";

import { BrandWordmark } from "@/components/brand/BrandWordmark";
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
  partyFromUnknown,
  trimToEmpty,
  type BusinessProfile,
  type PartySnapshot,
} from "@/lib/invoices/profiles";
import type { InvoiceView } from "@/lib/invoices/view-types";
import { cn } from "@/lib/utils";

function senderFromInvoice(
  invoice: InvoiceView,
  profile: BusinessProfile | null,
): PartySnapshot {
  const issued =
    invoice.status === "issued" ||
    invoice.status === "paid" ||
    Boolean(invoice.is_immutable);

  // Drafts: prefer live profile over stale invoice.sender snapshot
  if (!issued && profile) {
    if (!hasLegalName(profile)) return { name: "" };
    return {
      name: profile.legalName,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      email: profile.email,
      phone: profile.phone,
      tin: profile.tin,
      vatNumber: profile.vatNumber,
    };
  }

  const snap = partyFromUnknown(invoice.sender);
  if (snap && trimToEmpty(snap.name)) return snap;
  if (profile && hasLegalName(profile)) {
    return {
      name: profile.legalName,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      email: profile.email,
      phone: profile.phone,
      tin: profile.tin,
      vatNumber: profile.vatNumber,
    };
  }
  return { name: "" };
}

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

function PartyLines({ party }: { party: PartySnapshot }) {
  const cityLine = formatCityLine(party);
  const contact = formatContactLine(party);
  return (
    <>
      {party.addressLine1 && (
        <p className="text-xs text-text-2 leading-snug">{party.addressLine1}</p>
      )}
      {party.addressLine2 && (
        <p className="text-xs text-text-2 leading-snug">{party.addressLine2}</p>
      )}
      {cityLine && <p className="text-xs text-text-2 leading-snug">{cityLine}</p>}
      {contact && <p className="text-xs text-text-3 mt-1.5">{contact}</p>}
      {party.tin && <p className="text-xs text-text-3 mt-1">TIN {party.tin}</p>}
      {party.vatNumber && (
        <p className="text-xs text-text-3">VAT {party.vatNumber}</p>
      )}
    </>
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
  const sender = senderFromInvoice(invoice, profile);
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

  return (
    <div className="space-y-4">
      {(missingLegal || incomplete) && (
        <BusinessNudgeBanner onOpenSettings={onOpenSettings} />
      )}

      <div className="bg-surface border border-border rounded-xl p-7 space-y-5">
        <div className="flex justify-between items-stretch gap-6">
          <div className="flex-1 bg-surface border border-border rounded-xl p-4">
            <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-text-3 mb-2">
              {INV_COPY.fromLabel}
            </p>
            {sender.name ? (
              <>
                <p className="text-[15px] font-bold text-text-1 mb-1.5">{sender.name}</p>
                <PartyLines party={sender} />
              </>
            ) : (
              <>
                <BrandWordmark size="sm" className="text-primary mb-1.5 block" />
                <p className="text-xs text-text-3">{INV_COPY.fromNoAddress}</p>
              </>
            )}
            <button
              type="button"
              onClick={onOpenSettings}
              className="mt-2 text-[11px] font-semibold text-primary"
            >
              {INV_COPY.fromEdit}
            </button>
          </div>

          <div
            className={cn(
              "flex-1 rounded-xl p-4 bg-surface",
              missingClient
                ? "border-2 border-dashed border-warning shadow-[0_0_0_3px_rgba(217,119,6,0.08)]"
                : "border border-border",
            )}
          >
            <p className="text-[10px] font-bold tracking-[0.08em] uppercase text-text-3 mb-2">
              {INV_COPY.billtoLabel}
            </p>
            {billTo ? (
              <>
                <p className="text-[15px] font-bold text-text-1 mb-1.5">{billTo.name}</p>
                <PartyLines party={billTo} />
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
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-[#92400E] mb-2.5">
                  {INV_COPY.billtoEmpty}
                </p>
                {editable && clients && onSelectClient && onClientCreated ? (
                  <>
                    <CustomerCombobox
                      clients={clients}
                      value={null}
                      onChange={onSelectClient}
                      onCreated={onClientCreated}
                    />
                    <p className="mt-3 text-xs text-[#92400E] bg-warning-bg border border-[#FDE68A] rounded-md px-3 py-2">
                      {INV_COPY.billtoRequired}. Save draft is still available.
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-[#92400E]">{INV_COPY.billtoRequired}</p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 py-3 border-y border-surface-2">
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-text-3">
              Issue date
            </p>
            <p className="text-sm font-semibold text-text-1 mt-1">
              {invoice.invoice_date
                ? new Date(invoice.invoice_date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-text-3">
              Due date
            </p>
            <p className="text-sm font-semibold text-text-1 mt-1">
              {invoice.due_date
                ? new Date(invoice.due_date).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider uppercase text-text-3">
              {attachmentNote ? "Attachment" : "Currency"}
            </p>
            <p className="text-sm font-semibold text-text-1 mt-1">
              {attachmentNote ?? "NGN (₦)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
