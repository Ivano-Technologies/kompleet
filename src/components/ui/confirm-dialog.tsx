"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { ErrorText } from "@/components/ui/error-ref";

export function ConfirmDialog({
  title,
  hint,
  confirmLabel,
  cancelLabel = "Cancel",
  confirmTone = "primary",
  busy = false,
  error,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  hint?: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: "primary" | "danger";
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const confirmClass =
    confirmTone === "danger"
      ? "text-sm px-3 py-2 rounded-[10px] bg-error text-white hover:bg-error/90 font-semibold disabled:opacity-50"
      : "btn-primary text-sm px-3 py-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="confirm-dialog-title"
              className="font-display text-xl text-text-1"
            >
              {title}
            </h2>
            {hint ? <p className="text-sm text-text-2 mt-1">{hint}</p> : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-text-3 hover:text-text-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
        {error ? (
          <p className="mt-3 text-sm text-error">
            <ErrorText text={error} />
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary text-sm px-3 py-2"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={busy}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
