"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  DELETE_ACCOUNT_PHRASE,
  RETENTION_NOTE,
} from "@/lib/account-deletion";

const inputCls =
  "mt-1 w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500";

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DeleteAccountDialog({
  error,
  busy,
  onClose,
  onConfirm,
}: {
  error: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: (confirmText: string) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const matches = confirmText.trim() === DELETE_ACCOUNT_PHRASE;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true",
      );

    const frame = window.requestAnimationFrame(() => {
      (inputRef.current ?? focusables()[0])?.focus();
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !root?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !root?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    function onFocusIn(event: FocusEvent) {
      if (root?.contains(event.target as Node)) return;
      event.preventDefault();
      (inputRef.current ?? focusables()[0])?.focus();
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [onClose, busy]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-30 flex items-center justify-center px-4 py-4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        className="relative z-10 w-full max-w-md rounded-xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="delete-account-title"
              className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary"
            >
              Delete account
            </h2>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              Your profile, files, drafts and activity are removed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-light-text-tertiary dark:text-dark-text-tertiary hover:text-light-text-primary dark:hover:text-dark-text-primary"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-3">
          {RETENTION_NOTE}
        </p>
        <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mt-4">
          Type{" "}
          <span className="font-mono font-semibold">{DELETE_ACCOUNT_PHRASE}</span>{" "}
          to confirm.
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            className={inputCls}
          />
        </label>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-3 py-1.5 text-sm rounded-lg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !matches}
            onClick={() => onConfirm(confirmText.trim())}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
