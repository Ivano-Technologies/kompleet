"use client";

import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { DOCS_ACCEPT, DOCS_COPY } from "./docs-copy";
import { rejectDocsFile } from "./file-kind";

export type FileDropVariant = "hero" | "strip" | "compact";

interface FileDropZoneProps {
  variant: FileDropVariant;
  onFile: (file: File) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  inputId?: string;
  title?: string;
  subtitle?: string;
  chooseLabel?: string;
  hint?: string;
  uploading?: boolean;
  progress?: number;
  fileName?: string | null;
}

export function triggerFilePicker(inputId: string): void {
  const input = document.getElementById(inputId);
  if (input instanceof HTMLInputElement) {
    input.click();
  }
}

export function FileDropZone({
  variant,
  onFile,
  disabled = false,
  className,
  inputId,
  title,
  subtitle,
  chooseLabel,
  hint,
  uploading = false,
  progress,
  fileName,
}: FileDropZoneProps) {
  const reactId = useId();
  const resolvedInputId = inputId ?? `file-drop-${reactId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const takeFile = (file: File | undefined) => {
    if (!file || disabled || uploading) return;
    const problem = rejectDocsFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    void Promise.resolve(onFile(file)).finally(resetInput);
  };

  const openPicker = () => {
    if (!disabled && !uploading) inputRef.current?.click();
  };

  const isHero = variant === "hero";
  const resolvedTitle =
    title ?? (isHero ? DOCS_COPY.emptyTitle : DOCS_COPY.stripTitle);
  const resolvedSub = subtitle ?? (isHero ? DOCS_COPY.emptySub : undefined);
  const resolvedChoose =
    chooseLabel ?? (isHero ? DOCS_COPY.emptyChoose : DOCS_COPY.stripChoose);
  const resolvedHint = hint ?? (isHero ? DOCS_COPY.emptyHint : undefined);

  return (
    <div className={cn("w-full", className)}>
      <input
        id={resolvedInputId}
        ref={inputRef}
        type="file"
        accept={DOCS_ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
        }}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={resolvedTitle}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          if (!disabled && !uploading) setDragging(true);
        }}
        onDragLeave={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
        }}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.stopPropagation();
          setDragging(false);
          takeFile(event.dataTransfer.files[0]);
        }}
        className={cn(
          "rounded-xl border-2 border-dashed bg-surface transition-colors",
          "border-border hover:border-border-hover",
          dragging && "border-accent bg-accent/5",
          disabled && "opacity-60 pointer-events-none",
          isHero &&
            "min-h-[240px] lg:min-h-[320px] px-6 py-10 flex flex-col items-center justify-center text-center",
          variant === "strip" &&
            "min-h-[56px] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
          variant === "compact" &&
            "min-h-[52px] px-3 py-2.5 flex items-center justify-between gap-3",
        )}
      >
        {isHero && (
          <HeroChrome
            title={uploading ? DOCS_COPY.progress : resolvedTitle}
            subtitle={resolvedSub}
            choose={resolvedChoose}
            uploading={uploading}
            progress={progress}
            fileName={fileName}
          />
        )}
        {(variant === "strip" || variant === "compact") && (
          <>
            <div className="flex items-center gap-3 text-left min-w-0">
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-text-2 shrink-0" />
              ) : (
                <Upload className="w-4 h-4 text-text-2 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-1">
                  {uploading ? DOCS_COPY.progress : resolvedTitle}
                </p>
                {resolvedSub && !uploading && (
                  <p className="text-xs text-text-3">{resolvedSub}</p>
                )}
                {fileName && uploading && (
                  <p className="text-xs text-text-3 truncate max-w-[240px]">
                    {fileName}
                    {typeof progress === "number" ? ` · ${progress}%` : ""}
                  </p>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-primary shrink-0">
              {resolvedChoose}
            </span>
          </>
        )}
      </div>
      {isHero && resolvedHint && (
        <p className="mt-3 text-center text-xs text-text-3">{resolvedHint}</p>
      )}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}

function HeroChrome({
  title,
  subtitle,
  choose,
  uploading,
  progress,
  fileName,
}: {
  title: string;
  subtitle?: string;
  choose: string;
  uploading: boolean;
  progress?: number;
  fileName?: string | null;
}): ReactNode {
  return (
    <>
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-primary"
        aria-hidden
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <Upload className="w-6 h-6" />
        )}
      </div>
      <h2 className="mt-5 text-base font-semibold text-text-1">{title}</h2>
      {subtitle && (
        <p className="mt-2 text-sm text-text-3 max-w-md">{subtitle}</p>
      )}
      {fileName && uploading && (
        <p className="mt-2 text-xs text-text-3">
          {fileName}
          {typeof progress === "number" ? ` · ${progress}%` : ""}
        </p>
      )}
      <div className="mt-5">
        <span className="text-sm font-medium text-primary underline-offset-2 hover:underline">
          {choose}
        </span>
      </div>
    </>
  );
}
