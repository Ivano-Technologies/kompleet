"use client";

import { useRef, useState, type DragEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { INV_COPY } from "./invoice-copy";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";
const MAX_BYTES = 10 * 1024 * 1024;

function isSupportedInvoiceFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  );
}

export function InvoiceDropZone({
  onFile,
  disabled = false,
  compact = false,
  className,
}: {
  onFile: (file: File) => Promise<void> | void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const takeFile = async (file: File | undefined) => {
    if (!file || disabled || busy) return;
    if (!isSupportedInvoiceFile(file)) {
      setError("Please select a PDF or image");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File size must be less than 10MB");
      return;
    }
    setError(null);
    setFileName(file.name);
    setBusy(true);
    try {
      await onFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create draft");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(event) => {
          void takeFile(event.target.files?.[0]);
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={INV_COPY.dropTitle}
        onClick={() => {
          if (!disabled && !busy) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled && !busy) inputRef.current?.click();
          }
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (!disabled && !busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(false);
          void takeFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed bg-surface transition-colors",
          "border-border hover:border-border-hover",
          dragging && "border-accent bg-accent/5",
          disabled && "opacity-60 pointer-events-none",
          compact
            ? "min-h-[140px] px-4 py-5 flex flex-col items-center justify-center text-center"
            : "min-h-[88px] px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
        )}
      >
        <div className={cn("flex items-center gap-3", compact && "flex-col")}>
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin text-text-2" />
          ) : (
            <Upload className="w-4 h-4 text-text-2" />
          )}
          <div className={compact ? "text-center" : "text-left"}>
            <p className="text-sm font-medium text-text-1">
              {busy ? INV_COPY.dropProgress : INV_COPY.dropTitle}
            </p>
            <p className="text-xs text-text-3 mt-0.5">
              {fileName && busy ? fileName : INV_COPY.dropSub}
            </p>
          </div>
        </div>
        <span className="text-sm font-medium text-primary shrink-0">
          {INV_COPY.dropChoose}
        </span>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
