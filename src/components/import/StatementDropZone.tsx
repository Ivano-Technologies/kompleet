"use client";

import { useCallback, useId, useRef, useState, type DragEvent } from "react";
import { Loader2, Lock, Upload } from "lucide-react";
import { SUPPORTED_BANKS } from "@/lib/transaction-import/bank-configs";
import {
  classifyClientException,
  classifyImportFailure,
  formatFileSizeLabel,
  viewModelForImportError,
  type ClassifiedImportError,
  type ImportErrorAction,
  type ImportErrorViewModel,
} from "@/lib/transaction-import/import-errors";
import { cn } from "@/lib/utils";
import { ImportErrorCard } from "./ImportErrorCard";
import { ImportErrorToast } from "./ImportErrorToast";
import {
  DEFAULT_BANK_CODE,
  DROP_COPY,
  FALLBACK_BANK_CODE,
} from "./statement-copy";

export type StatementDropVariant = "hero" | "strip" | "compact";

export interface StatementUploadResult {
  imported: number;
  duplicates: number;
  pendingReview: number;
  sessionId?: string;
}

interface StatementDropZoneProps {
  variant: StatementDropVariant;
  onSuccess?: (result: StatementUploadResult) => void;
  disabled?: boolean;
  className?: string;
  inputId?: string;
  title?: string;
  subtitle?: string;
  chooseLabel?: string;
  showWhy?: boolean;
  showBankSelect?: boolean;
}

const ACCEPT = ".csv,.xlsx,.xls,.pdf";
const MAX_BYTES = 10 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 50_000;

type UploadResponseBody = {
  success?: boolean;
  imported?: number;
  duplicates?: number;
  pendingReview?: number;
  sessionId?: string;
  error?: string;
  message?: string;
  errorCode?: string;
  requiresPassword?: boolean;
  bankCode?: string;
  detectedBankCode?: string | null;
  parseErrorType?: string;
};

async function readUploadResponse(response: Response): Promise<UploadResponseBody> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw) as UploadResponseBody;
  } catch {
    return {
      error: raw.slice(0, 180),
      message: `HTTP ${response.status}`,
    };
  }
}

const OVERRIDE_BANKS = SUPPORTED_BANKS.filter((bank) => bank.code !== "AUTO");

function isSupportedStatementFile(candidate: File): boolean {
  const name = candidate.name.toLowerCase();
  return (
    name.endsWith(".csv") ||
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".pdf")
  );
}

export function triggerStatementPicker(inputId: string): void {
  const input = document.getElementById(inputId);
  if (input instanceof HTMLInputElement) {
    input.click();
  }
}

export function StatementDropZone({
  variant,
  onSuccess,
  disabled = false,
  className,
  inputId,
  title,
  subtitle,
  chooseLabel,
  showWhy = true,
  showBankSelect = false,
}: StatementDropZoneProps) {
  const reactId = useId();
  const resolvedInputId = inputId ?? `statement-drop-${reactId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorView, setErrorView] = useState<ImportErrorViewModel | null>(null);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(showBankSelect);
  const [bankOverride, setBankOverride] = useState(
    showBankSelect ? DEFAULT_BANK_CODE : FALLBACK_BANK_CODE,
  );
  const [heldFile, setHeldFile] = useState<File | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const bankSelectRef = useRef<HTMLSelectElement>(null);

  const resetInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const applyClassifiedError = (
    classified: ClassifiedImportError,
    file: File | null,
  ) => {
    const view = viewModelForImportError(classified, {
      fileName: file?.name ?? fileName,
    });
    setErrorView(view);
    setShowErrorToast(view.showToast);
    setPasswordRequired(view.showPasswordField);
    if (view.revealBankPicker || showBankSelect) {
      setShowAdvanced(true);
    }
    if (view.revealBankPicker) {
      window.setTimeout(() => bankSelectRef.current?.focus(), 0);
    }
  };

  const clearImportError = () => {
    setErrorView(null);
    setShowErrorToast(false);
    setPasswordRequired(false);
    if (!showBankSelect) setShowAdvanced(false);
  };

  const uploadFile = useCallback(
    async (
      file: File,
      options?: { password?: string; bankCode?: string },
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      let timedOut = false;
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, UPLOAD_TIMEOUT_MS);

      setUploading(true);
      setErrorView(null);
      setShowErrorToast(false);
      setFileName(file.name);
      setHeldFile(file);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("bankCode", options?.bankCode ?? DEFAULT_BANK_CODE);
      const pwd = options?.password?.trim();
      if (pwd) formData.append("password", pwd);

      try {
        const response = await fetch("/api/transactions/upload-v2", {
          method: "POST",
          body: formData,
          credentials: "include",
          signal: controller.signal,
        });
        const data = await readUploadResponse(response);

        if (response.ok && data.success) {
          setPasswordRequired(false);
          setPassword("");
          setHeldFile(null);
          setFileName(null);
          clearImportError();
          if (!showBankSelect) setShowAdvanced(false);
          resetInput();
          onSuccess?.({
            imported: data.imported ?? 0,
            duplicates: data.duplicates ?? 0,
            pendingReview: data.pendingReview ?? 0,
            sessionId: data.sessionId,
          });
          return;
        }

        applyClassifiedError(
          classifyImportFailure({
            errorCode: data.errorCode,
            status: response.status,
            error: data.error,
            message: data.message,
            requiresPassword: data.requiresPassword,
            requestedBankCode: options?.bankCode ?? DEFAULT_BANK_CODE,
            detectedBankCode: data.detectedBankCode,
            bankCode: data.bankCode,
            fileName: file.name,
            parseErrorType: data.parseErrorType,
            clientKind:
              response.status === 504 || response.status === 502
                ? "network"
                : undefined,
          }),
          file,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          if (!timedOut) return;
          applyClassifiedError(
            classifyImportFailure({
              clientKind: "network",
              status: 504,
              requestedBankCode: options?.bankCode ?? DEFAULT_BANK_CODE,
              fileName: file.name,
            }),
            file,
          );
          return;
        }
        applyClassifiedError(
          classifyImportFailure({
            clientKind: classifyClientException(err) ?? "network",
            requestedBankCode: options?.bankCode ?? DEFAULT_BANK_CODE,
            fileName: file.name,
          }),
          file,
        );
      } finally {
        window.clearTimeout(timeoutId);
        setUploading(false);
      }
    },
    [onSuccess, showBankSelect],
  );

  const takeFile = (file: File | undefined) => {
    if (!file || disabled || uploading) return;
    setHeldFile(file);
    setFileName(file.name);
    if (!isSupportedStatementFile(file)) {
      applyClassifiedError(
        classifyImportFailure({
          clientKind: "unsupported",
          fileName: file.name,
        }),
        file,
      );
      return;
    }
    if (file.size > MAX_BYTES) {
      applyClassifiedError(
        classifyImportFailure({
          clientKind: "size",
          fileName: file.name,
        }),
        file,
      );
      return;
    }
    setPasswordRequired(false);
    setPassword("");
    void uploadFile(file, {
      bankCode: showBankSelect ? bankOverride : DEFAULT_BANK_CODE,
    });
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled && !uploading) setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    takeFile(event.dataTransfer.files[0]);
  };

  const retryHeldFile = (bankCode?: string) => {
    if (!heldFile) return;
    void uploadFile(heldFile, {
      password,
      bankCode:
        bankCode ??
        (showAdvanced || showBankSelect
          ? bankOverride || FALLBACK_BANK_CODE
          : DEFAULT_BANK_CODE),
    });
  };

  const openPicker = () => {
    resetInput();
    inputRef.current?.click();
  };

  const handleErrorAction = (action: ImportErrorAction) => {
    if (action === "retry" || action === "retry-upload") {
      retryHeldFile();
      return;
    }
    if (action === "choose-file" || action === "try-csv") {
      clearImportError();
      openPicker();
      return;
    }
    if (action === "select-bank" || action === "advanced") {
      setShowAdvanced(true);
      window.setTimeout(() => bankSelectRef.current?.focus(), 0);
      return;
    }
    if (action === "unlock") {
      retryHeldFile();
    }
  };

  const retryWithPassword = () => {
    retryHeldFile();
  };

  const retryAdvanced = () => {
    retryHeldFile(bankOverride || FALLBACK_BANK_CODE);
  };

  const isHero = variant === "hero";
  const isStrip = variant === "strip" || variant === "compact";
  const resolvedTitle = title ?? (isHero ? DROP_COPY.heroTitle : DROP_COPY.stripTitle);
  const resolvedSub = subtitle ?? (isHero ? DROP_COPY.heroSub : DROP_COPY.stripSub);
  const resolvedChoose = chooseLabel ?? (isHero ? DROP_COPY.heroChoose : DROP_COPY.stripChoose);
  const bankChoices = showBankSelect
    ? SUPPORTED_BANKS
    : OVERRIDE_BANKS;

  return (
    <div className={cn("w-full", className)}>
      <input
        id={resolvedInputId}
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => {
          takeFile(event.target.files?.[0]);
          resetInput();
        }}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={resolvedTitle}
        onClick={() => {
          if (!disabled && !uploading && !passwordRequired) {
            inputRef.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled && !uploading && !passwordRequired) {
              inputRef.current?.click();
            }
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border-2 border-dashed bg-surface transition-colors",
          "border-border hover:border-border-hover",
          dragging && "border-accent bg-accent/5",
          disabled && "opacity-60 pointer-events-none",
          isHero && "min-h-[240px] lg:min-h-[320px] px-6 py-10 flex flex-col items-center justify-center text-center",
          variant === "strip" && "min-h-[56px] px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
          variant === "compact" && "min-h-[52px] px-3 py-2.5 flex items-center justify-between gap-3",
        )}
      >
        {isHero && (
          <>
            <StackedDocsMark />
            <h2 className="mt-5 text-base font-semibold text-text-1">
              {resolvedTitle}
            </h2>
            <p className="mt-2 text-sm text-text-3 max-w-md">
              {resolvedSub}
            </p>
            <div className="mt-5 flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-primary underline-offset-2 hover:underline">
                {uploading ? DROP_COPY.progress : resolvedChoose}
              </span>
              {showWhy && (
                <button
                  type="button"
                  className="text-xs text-text-3 hover:text-text-2"
                  onClick={(event) => {
                    event.stopPropagation();
                    setWhyOpen(true);
                  }}
                >
                  {DROP_COPY.heroWhy}
                </button>
              )}
            </div>
          </>
        )}

        {isStrip && (
          <>
            <div className="flex items-center gap-3 text-left">
              <Upload className="w-4 h-4 text-text-2 shrink-0" />
              <div>
                <p className="text-sm font-medium text-text-1">
                  {uploading ? DROP_COPY.progress : resolvedTitle}
                </p>
                {resolvedSub && !uploading && (
                  <p className="text-xs text-text-3">{resolvedSub}</p>
                )}
                {fileName && uploading && (
                  <p className="text-xs text-text-3 truncate max-w-[220px]">
                    {fileName}
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

      {(uploading || errorView || passwordRequired || showAdvanced) && (
        <div className="mt-3 space-y-3">
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-text-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {DROP_COPY.progress}
                {fileName ? ` · ${fileName}` : ""}
              </span>
              <button
                type="button"
                className="text-xs text-text-3 hover:text-text-1 ml-auto"
                onClick={() => abortRef.current?.abort()}
              >
                Cancel
              </button>
            </div>
          )}

          {passwordRequired && (
            <div className="rounded-lg border border-error/35 bg-error/[0.08] border-l-4 border-l-error p-3.5 space-y-2">
              <p className="text-sm font-semibold text-text-1 flex items-center gap-2">
                <Lock className="w-5 h-5 text-error" />
                {errorView?.title ?? DROP_COPY.password}
              </p>
              <p className="text-[13px] text-text-2">
                {errorView?.body ?? DROP_COPY.passwordHint}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={DROP_COPY.passwordHint}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={(event) => event.stopPropagation()}
                />
                <button
                  type="button"
                  className="btn-primary text-[13px] px-3.5 py-2"
                  onClick={retryWithPassword}
                  disabled={uploading || !password.trim()}
                >
                  {errorView?.primary.label ?? "Unlock"}
                </button>
                <button
                  type="button"
                  className="btn-secondary text-[13px] px-3.5 py-2"
                  onClick={() => {
                    clearImportError();
                    openPicker();
                  }}
                >
                  Choose different file
                </button>
              </div>
            </div>
          )}

          {errorView && !passwordRequired && !uploading && (
            <ImportErrorCard
              view={errorView}
              fileLabel={
                fileName
                  ? [fileName, formatFileSizeLabel(heldFile?.size)]
                      .filter(Boolean)
                      .join(" · ")
                  : undefined
              }
              onAction={handleErrorAction}
              onDismiss={clearImportError}
            />
          )}

          {showAdvanced && !uploading && (
            <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
              <p className="text-sm font-medium text-text-1">{DROP_COPY.advanced}</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  ref={bankSelectRef}
                  value={bankOverride}
                  onChange={(event) => setBankOverride(event.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  onClick={(event) => event.stopPropagation()}
                >
                  {bankChoices.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-secondary text-sm px-3 py-2"
                  onClick={retryAdvanced}
                  disabled={!heldFile}
                >
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showErrorToast && errorView && (
        <ImportErrorToast
          view={errorView}
          onRetry={() => handleErrorAction("retry-upload")}
          onDismiss={() => setShowErrorToast(false)}
        />
      )}

      {whyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setWhyOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-1">
            <h3 className="font-display text-lg text-text-1">{DROP_COPY.heroWhy}</h3>
            <p className="mt-2 text-sm text-text-2 leading-relaxed">
              {DROP_COPY.whyBody}
            </p>
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-2 mt-4"
              onClick={() => setWhyOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StackedDocsMark() {
  return (
    <div className="relative w-16 h-16" aria-hidden>
      <span className="absolute left-3 top-2 h-12 w-9 rounded-sm border border-border bg-surface-2" />
      <span className="absolute left-5 top-1 h-12 w-9 rounded-sm border border-border bg-surface" />
      <span className="absolute left-7 top-0 h-12 w-9 rounded-sm border border-border bg-white dark:bg-dark-surface" />
      <span className="absolute -right-1 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
        ₦
      </span>
    </div>
  );
}
