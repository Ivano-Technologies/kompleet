"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { INV_COPY } from "./invoice-copy";
import { ErrorText } from "@/components/ui/error-ref";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

const inputCls =
  "mt-1 w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-surface text-text-1 placeholder-text-3 focus:outline-none focus:border-primary";

function StatusDialogShell({
  title,
  hint,
  onClose,
  children,
}: {
  title: string;
  hint: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="invoice-status-dialog-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="invoice-status-dialog-title"
              className="font-display text-xl text-text-1"
            >
              {title}
            </h2>
            <p className="text-sm text-text-2 mt-1">{hint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-3 hover:text-text-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function MarkPaidDialog({
  error,
  busy,
  onClose,
  onConfirm,
}: {
  error: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (input: { paidOn: string; note: string }) => void;
}) {
  const [paidOn, setPaidOn] = useState(todayIsoDate);
  const [note, setNote] = useState("");

  return (
    <StatusDialogShell
      title={INV_COPY.markPaid}
      hint={INV_COPY.markPaidHint}
      onClose={onClose}
    >
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm({ paidOn, note });
        }}
      >
        <label className="block text-sm text-text-2">
          {INV_COPY.markPaidDate}
          <input
            type="date"
            required
            value={paidOn}
            onChange={(event) => setPaidOn(event.target.value)}
            className={inputCls}
          />
        </label>
        <label className="block text-sm text-text-2">
          {INV_COPY.markPaidNote}
          <input
            type="text"
            value={note}
            maxLength={200}
            onChange={(event) => setNote(event.target.value)}
            className={inputCls}
          />
        </label>
        {error ? (
          <p className="text-sm text-error">
            <ErrorText text={error} />
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary text-sm px-3 py-2" onClick={onClose}>
            {INV_COPY.markPaidClose}
          </button>
          <button type="submit" className="btn-primary text-sm px-3 py-2" disabled={busy}>
            {INV_COPY.markPaidConfirm}
          </button>
        </div>
      </form>
    </StatusDialogShell>
  );
}

export function CancelInvoiceDialog({
  error,
  busy,
  onClose,
  onConfirm,
}: {
  error: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <StatusDialogShell
      title={INV_COPY.cancelInvoice}
      hint={INV_COPY.cancelHint}
      onClose={onClose}
    >
      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason);
        }}
      >
        <label className="block text-sm text-text-2">
          {INV_COPY.cancelReason}
          <textarea
            required
            value={reason}
            maxLength={500}
            rows={3}
            onChange={(event) => setReason(event.target.value)}
            className={inputCls}
          />
        </label>
        {error ? (
          <p className="text-sm text-error">
            <ErrorText text={error} />
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary text-sm px-3 py-2" onClick={onClose}>
            {INV_COPY.cancelClose}
          </button>
          <button
            type="submit"
            className="btn-secondary text-sm px-3 py-2 text-error"
            disabled={busy || !reason.trim()}
          >
            {INV_COPY.cancelConfirm}
          </button>
        </div>
      </form>
    </StatusDialogShell>
  );
}
