"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { FileSpreadsheet, FileText, Image as ImageIcon, X } from "lucide-react";
import { api } from "@/lib/convex/browser";
import { cn } from "@/lib/utils";
import { DOCS_COPY } from "./docs-copy";
import { formatFileSize, formatNaira, formatRecordDate } from "./docs-format";
import { FileDropZone } from "./FileDropZone";
import {
  kindLabel,
  linkSurfaceLabel,
  type LibraryFile,
  type LinkTarget,
  type LinkType,
} from "./file-kind";
import { useLibraryUpload } from "./use-library-upload";

export interface LockedLink {
  type: LinkType;
  id: string;
  label: string;
}

interface AttachFileSheetProps {
  open: boolean;
  onClose: () => void;
  file?: LibraryFile | null;
  lockedLink?: LockedLink;
  onAttached?: (label: string) => void;
}

const LINK_TYPES: { type: LinkType; label: string }[] = [
  { type: "transaction", label: DOCS_COPY.attachTxn },
  { type: "invoice", label: DOCS_COPY.attachInvoice },
  { type: "expense", label: DOCS_COPY.attachExpense },
];

function FileGlyph({ kind }: { kind: LibraryFile["kind"] }) {
  const Icon =
    kind === "image" ? ImageIcon : kind === "csv" ? FileSpreadsheet : FileText;
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-text-2 shrink-0">
      <Icon className="w-4 h-4" />
    </span>
  );
}

export function AttachFileSheet({
  open,
  onClose,
  file,
  lockedLink,
  onAttached,
}: AttachFileSheetProps) {
  const attachFile = useMutation(api.files.attachFile);
  const { upload, uploading, progress, fileName } = useLibraryUpload();
  const [linkType, setLinkType] = useState<LinkType>(
    lockedLink?.type ?? "transaction",
  );
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<LibraryFile | null>(
    file ?? null,
  );
  const [selectedTarget, setSelectedTarget] = useState<LinkTarget | null>(
    lockedLink
      ? {
          id: lockedLink.id,
          label: lockedLink.label,
          amount: null,
          date: null,
          href: "",
        }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLinkType(lockedLink?.type ?? "transaction");
    setSearch("");
    setSelectedFile(file ?? null);
    setSelectedTarget(
      lockedLink
        ? {
            id: lockedLink.id,
            label: lockedLink.label,
            amount: null,
            date: null,
            href: "",
          }
        : null,
    );
    setError(null);
  }, [open, file, lockedLink]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const targets = useQuery(
    api.files.searchLinkTargets,
    open && !lockedLink
      ? { linkType, search: search.trim() || undefined, limit: 5 }
      : "skip",
  );
  const recent = useQuery(
    api.files.listRecentFiles,
    open && lockedLink ? { limit: 10 } : "skip",
  );

  if (!open) return null;

  const canAttach = Boolean(
    selectedFile && (lockedLink || selectedTarget),
  );

  const confirm = async () => {
    if (!selectedFile) return;
    const targetId = lockedLink?.id ?? selectedTarget?.id;
    const targetType = lockedLink?.type ?? linkType;
    const targetLabel = lockedLink?.label ?? selectedTarget?.label;
    if (!targetId || !targetLabel) return;
    setBusy(true);
    setError(null);
    try {
      await attachFile({
        fileId: selectedFile.id,
        linkType: targetType,
        linkId: targetId,
      });
      onAttached?.(targetLabel);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not attach file");
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = async (next: File) => {
    setError(null);
    const source =
      lockedLink?.type === "expense"
        ? "expense_attach"
        : lockedLink?.type === "transaction"
          ? "transaction_attach"
          : lockedLink?.type === "invoice"
            ? "invoice_drop"
            : "documents";
    const saved = await upload(next, {
      source,
      linkType: lockedLink?.type,
      linkId: lockedLink?.id,
    });
    setSelectedFile(saved);
    if (lockedLink) {
      onAttached?.(lockedLink.label);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-1">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl text-text-1">
            {DOCS_COPY.attachTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-text-3 hover:text-text-1"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {selectedFile && (
          <div className="mt-5 rounded-xl border border-border bg-surface-2/60 px-3 py-3 flex items-center gap-3">
            <FileGlyph kind={selectedFile.kind} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-1 truncate">
                {selectedFile.filename}
              </p>
              <p className="text-xs text-text-3">
                {kindLabel(selectedFile.kind)} · {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-3 mb-2">
            {DOCS_COPY.attachLinkTo}
          </p>
          <div className="flex flex-wrap gap-2">
            {LINK_TYPES.map((item) => {
              const active = linkType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  disabled={Boolean(lockedLink)}
                  onClick={() => {
                    setLinkType(item.type);
                    setSelectedTarget(null);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                    active
                      ? "border-primary text-primary bg-surface"
                      : "border-border text-text-2 hover:border-border-hover",
                    lockedLink && "opacity-70",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {!lockedLink && (
          <div className="mt-5">
            <label className="block text-xs font-bold uppercase tracking-widest text-text-3 mb-2">
              Search
            </label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={DOCS_COPY.attachSearch}
              className="w-full px-3 py-2.5 text-sm rounded-md border border-border bg-surface text-text-1 placeholder-text-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <div className="mt-2 rounded-xl border border-border overflow-hidden">
              {(targets ?? []).map((target) => {
                const active = selectedTarget?.id === target.id;
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => setSelectedTarget(target)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-border last:border-b-0",
                      active
                        ? "bg-surface-2 border-l-2 border-l-primary"
                        : "hover:bg-surface-2/70",
                    )}
                  >
                    <p className="text-sm font-medium text-text-1">{target.label}</p>
                    <p className="text-xs text-text-3">
                      {[
                        formatNaira(target.amount),
                        formatRecordDate(target.date),
                        linkSurfaceLabel(linkType),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </button>
                );
              })}
              {targets && targets.length === 0 && (
                <p className="px-3 py-3 text-sm text-text-3">No matches.</p>
              )}
            </div>
          </div>
        )}

        {lockedLink && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-widest text-text-3 mb-2">
              {DOCS_COPY.attachRecent}
            </p>
            <div className="rounded-xl border border-border overflow-hidden mb-3">
              {(recent ?? []).map((item) => {
                const active = selectedFile?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedFile(item)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 flex items-center gap-3",
                      active ? "bg-surface-2" : "hover:bg-surface-2/70",
                    )}
                  >
                    <FileGlyph kind={item.kind} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-1 truncate">
                        {item.filename}
                      </p>
                      <p className="text-xs text-text-3">
                        {kindLabel(item.kind)} · {formatFileSize(item.size)}
                      </p>
                    </div>
                  </button>
                );
              })}
              {recent && recent.length === 0 && (
                <p className="px-3 py-3 text-sm text-text-3">
                  No recent uploads yet.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-widest text-text-3 mb-2">
            Or drop another file
          </p>
          <FileDropZone
            variant="compact"
            title={DOCS_COPY.attachDrop}
            chooseLabel={DOCS_COPY.attachChoose}
            onFile={handleDrop}
            uploading={uploading}
            progress={progress}
            fileName={fileName}
          />
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary text-sm px-3 py-2"
            onClick={onClose}
          >
            {DOCS_COPY.attachCancel}
          </button>
          <button
            type="button"
            className="btn-primary text-sm px-3 py-2 disabled:opacity-50"
            disabled={!canAttach || busy}
            onClick={() => void confirm()}
          >
            {DOCS_COPY.attachConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
