"use client";

import { DOCS_COPY } from "./docs-copy";

export function DeleteFileDialog({
  filename,
  busy,
  onCancel,
  onConfirm,
}: {
  filename: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-1">
        <h3 className="font-display text-lg text-text-1">
          {DOCS_COPY.deleteTitle(filename)}
        </h3>
        <p className="mt-2 text-sm text-text-2 leading-relaxed">
          {DOCS_COPY.deleteBody}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary text-sm px-3 py-2"
            onClick={onCancel}
            disabled={busy}
          >
            {DOCS_COPY.attachCancel}
          </button>
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-md bg-error text-white hover:bg-error/90 disabled:opacity-50"
            onClick={onConfirm}
            disabled={busy}
          >
            {DOCS_COPY.deleteConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
