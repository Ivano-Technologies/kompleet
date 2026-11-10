"use client";

import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard";
import { SettingsModal } from "@/components/layout/dashboard/SettingsModal";
import TransactionsPage from "@/app/(dashboard)/transactions/page";
import InvoicesPage from "@/app/(dashboard)/invoices/page";
import ExportCenterPage from "@/app/(dashboard)/export/page";
import CategoriesPage from "@/app/(dashboard)/categories/page";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { NewInvoiceSheet } from "@/components/invoices/NewInvoiceSheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { INV_COPY, INV_STATUS_LABEL } from "@/components/invoices/invoice-copy";
import type { InvoiceView } from "@/lib/invoices/view-types";
import {
  emptyBusinessProfile,
  type BusinessProfile,
} from "@/lib/invoices/profiles";
import { FIXTURE_INVOICE, installAuditShotFetch } from "./shot-fetch";

const SHOT_USER = {
  email: "chukwuemeka@fixture.test",
  id: "audit-shot-user",
  role: "user",
  displayName: "Chukwuemeka Okonkwo-Adebayo",
};

const PROFILE: BusinessProfile = {
  ...emptyBusinessProfile(),
  legalName: "Test Traders Ltd",
  addressLine1: "12 Fixture Close",
  city: "Lagos",
  state: "Lagos",
  country: "NG",
  email: "billing@fixture.test",
};

function InvoiceDetailShot({ state }: { state: string | null }) {
  const recipient = "ada@fixture.test";
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-1">
            {FIXTURE_INVOICE.invoice_number}
          </h1>
          <p className="text-sm text-text-2 mt-1">Tax year 2026</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
            {INV_STATUS_LABEL.issued}
          </span>
          <button type="button" className="btn-primary">
            <Send size={16} />
            {INV_COPY.sendInvoice}
          </button>
        </div>
      </div>
      {state === "sent" ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success"
        >
          {INV_COPY.emailSent(recipient)}
        </p>
      ) : null}
      <InvoicePreview
        invoice={FIXTURE_INVOICE as InvoiceView}
        profile={PROFILE}
        clients={[]}
        selectedClient={null}
        onSelectClient={() => undefined}
        onClientCreated={() => undefined}
        onOpenSettings={() => undefined}
        editable={false}
      />
      {state === "confirm" ? (
        <ConfirmDialog
          title={INV_COPY.sendConfirmTitle(
            FIXTURE_INVOICE.invoice_number,
            recipient,
          )}
          hint={INV_COPY.sendConfirmHint}
          confirmLabel={INV_COPY.sendInvoice}
          cancelLabel={INV_COPY.sendConfirmCancel}
          onConfirm={() => undefined}
          onCancel={() => undefined}
        />
      ) : null}
    </div>
  );
}

type ShotView =
  | "books"
  | "invoices"
  | "invoice-detail"
  | "new-invoice"
  | "export"
  | "export-empty"
  | "categories"
  | "settings";

function shotView(value: string | null): ShotView {
  switch (value) {
    case "books":
    case "invoices":
    case "invoice-detail":
    case "new-invoice":
    case "export":
    case "export-empty":
    case "categories":
    case "settings":
      return value;
    default:
      return "books";
  }
}

export default function AuditThemeShotPage() {
  const params = useSearchParams();
  const view = shotView(params.get("view"));
  installAuditShotFetch({ emptyExport: view === "export-empty" });

  let body;
  switch (view) {
    case "books":
      body = <TransactionsPage />;
      break;
    case "invoices":
      body = <InvoicesPage />;
      break;
    case "invoice-detail":
      body = <InvoiceDetailShot state={params.get("state")} />;
      break;
    case "new-invoice":
      body = (
        <>
          <InvoicesPage />
          <NewInvoiceSheet open onClose={() => undefined} />
        </>
      );
      break;
    case "export":
    case "export-empty":
      body = <ExportCenterPage />;
      break;
    case "categories":
      body = <CategoriesPage />;
      break;
    case "settings":
      body = (
        <>
          <p className="text-sm text-text-2">Account settings</p>
          <SettingsModal open onOpenChange={() => undefined} />
        </>
      );
      break;
    default: {
      const _exhaustive: never = view;
      body = <p>Unknown shot {_exhaustive}</p>;
      break;
    }
  }

  return <DashboardShell user={SHOT_USER}>{body}</DashboardShell>;
}
