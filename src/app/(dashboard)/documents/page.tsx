"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useConvex, useMutation, useQuery } from "convex/react";
import {
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
} from "lucide-react";
import { api } from "@/lib/convex/browser";
import { AttachFileSheet } from "@/components/documents/AttachFileSheet";
import { DeleteFileDialog } from "@/components/documents/DeleteFileDialog";
import { DOCS_COPY } from "@/components/documents/docs-copy";
import { DocsToast } from "@/components/documents/DocsToast";
import { formatFileSize, formatUploadedDate } from "@/components/documents/docs-format";
import {
  FileDropZone,
  triggerFilePicker,
} from "@/components/documents/FileDropZone";
import { FilePreview } from "@/components/documents/FilePreview";
import {
  kindLabel,
  linkHref,
  looksLikeBankStatement,
  type DocsFilter,
  type LibraryFile,
} from "@/components/documents/file-kind";
import { useLibraryUpload } from "@/components/documents/use-library-upload";
import { cn } from "@/lib/utils";

const FILTERS: { id: DocsFilter; label: string }[] = [
  { id: "all", label: DOCS_COPY.filterAll },
  { id: "pdf", label: DOCS_COPY.filterPdf },
  { id: "images", label: DOCS_COPY.filterImages },
  { id: "csv", label: DOCS_COPY.filterCsv },
  { id: "attached", label: DOCS_COPY.filterAttached },
  { id: "unattached", label: DOCS_COPY.filterUnattached },
];

const HUB_INPUT_ID = "documents-hub-input";

export default function DocumentsPage() {
  const [filter, setFilter] = useState<DocsFilter>("all");
  const files = useQuery(api.files.listFiles, { filter });
  const convex = useConvex();
  const deleteFile = useMutation(api.files.deleteFile);
  const { upload, uploading, progress, fileName } = useLibraryUpload();

  const [attachFile, setAttachFile] = useState<LibraryFile | null>(null);
  const [previewFile, setPreviewFile] = useState<LibraryFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryFile | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    actionLabel?: string;
    onAction?: () => void;
    actionHref?: string;
    secondaryLabel?: string;
    onSecondary?: () => void;
    tone?: "success" | "nudge";
    placement?: "top" | "bottom";
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const allFiles = useQuery(api.files.listFiles, { filter: "all" });
  const isEmpty = allFiles !== undefined && allFiles.length === 0;

  const handleUpload = async (file: File) => {
    const saved = await upload(file, { source: "documents" });
    if (looksLikeBankStatement(saved.filename, { contentType: saved.contentType })) {
      setToast({
        title: DOCS_COPY.toastStatement,
        actionLabel: DOCS_COPY.toastStatementCta,
        actionHref: "/transactions?import=1",
        secondaryLabel: DOCS_COPY.toastStatementKeep,
        onSecondary: () => setToast(null),
        tone: "nudge",
        placement: "bottom",
      });
      return;
    }
    setToast({
      title: DOCS_COPY.toastUploaded(saved.filename),
      actionLabel: DOCS_COPY.toastAttachCta,
      onAction: () => setAttachFile(saved),
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFile({ fileId: deleteTarget.id });
      setToast({ title: DOCS_COPY.toastDeleted(deleteTarget.filename) });
      setDeleteTarget(null);
      setPreviewFile(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="font-display text-2xl text-text-1">{DOCS_COPY.title}</h1>
        <button
          type="button"
          className="btn-primary text-sm px-3 py-2 w-full sm:w-auto"
          onClick={() => triggerFilePicker(HUB_INPUT_ID)}
        >
          {DOCS_COPY.ctaUpload}
        </button>
      </div>

      {allFiles === undefined || isEmpty ? (
        <FileDropZone
          variant="hero"
          inputId={HUB_INPUT_ID}
          onFile={handleUpload}
          uploading={uploading}
          progress={progress}
          fileName={fileName}
        />
      ) : (
        <>
          <FileDropZone
            variant="strip"
            inputId={HUB_INPUT_ID}
            title={DOCS_COPY.stripTitle}
            chooseLabel={DOCS_COPY.stripChoose}
            onFile={handleUpload}
            uploading={uploading}
            progress={progress}
            fileName={fileName}
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors",
                  filter === item.id
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-2 border-border hover:border-border-hover",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          <FileList
            files={files ?? []}
            menuId={menuId}
            onMenu={setMenuId}
            onPreview={setPreviewFile}
            onAttach={setAttachFile}
            onDelete={setDeleteTarget}
            onDownload={async (file) => {
              const url = await convex.query(api.files.getFileUrl, {
                fileId: file.id,
              });
              if (url) window.open(url, "_blank", "noopener,noreferrer");
            }}
          />
        </>
      )}

      {toast && (
        <DocsToast
          title={toast.title}
          actionLabel={toast.actionLabel}
          onAction={toast.onAction}
          actionHref={toast.actionHref}
          secondaryLabel={toast.secondaryLabel}
          onSecondary={toast.onSecondary}
          tone={toast.tone}
          placement={toast.placement}
          onDismiss={() => setToast(null)}
        />
      )}

      <AttachFileSheet
        open={Boolean(attachFile)}
        file={attachFile}
        onClose={() => setAttachFile(null)}
        onAttached={(label) =>
          setToast({ title: DOCS_COPY.toastAttached(label) })
        }
      />

      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onAttach={() => {
            setAttachFile(previewFile);
          }}
          onDelete={() => setDeleteTarget(previewFile)}
        />
      )}

      {deleteTarget && (
        <DeleteFileDialog
          filename={deleteTarget.filename}
          busy={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}

function FileList({
  files,
  menuId,
  onMenu,
  onPreview,
  onAttach,
  onDelete,
  onDownload,
}: {
  files: LibraryFile[];
  menuId: string | null;
  onMenu: (id: string | null) => void;
  onPreview: (file: LibraryFile) => void;
  onAttach: (file: LibraryFile) => void;
  onDelete: (file: LibraryFile) => void;
  onDownload: (file: LibraryFile) => void;
}) {
  const rows = useMemo(() => files, [files]);

  if (rows.length === 0) {
    return <p className="text-sm text-text-3">No files match this filter.</p>;
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {rows.map((file) => (
        <div
          key={file.id}
          className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3"
        >
          <button
            type="button"
            className="flex items-start gap-3 min-w-0 flex-1 text-left"
            onClick={() => onPreview(file)}
          >
            <KindGlyph kind={file.kind} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-1 truncate">
                {file.filename}
              </p>
              <p className="text-xs text-text-3">
                {kindLabel(file.kind)} · {formatFileSize(file.size)} ·{" "}
                {formatUploadedDate(file.uploadedAt)}
              </p>
              {file.linkType && file.linkId && file.linkLabel ? (
                <Link
                  href={linkHref(file.linkType, file.linkId)}
                  onClick={(event) => event.stopPropagation()}
                  className="mt-1 inline-flex text-xs font-medium text-primary"
                >
                  {file.linkType === "transaction"
                    ? "Transaction"
                    : file.linkType === "invoice"
                      ? "Invoice"
                      : "Expense"}{" "}
                  · {file.linkLabel}
                </Link>
              ) : (
                <p className="mt-1 text-xs text-text-3">
                  {DOCS_COPY.rowUnattached}
                </p>
              )}
            </div>
          </button>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {!file.linkId && (
              <button
                type="button"
                className="btn-primary text-sm px-3 py-1.5"
                onClick={() => onAttach(file)}
              >
                {DOCS_COPY.rowAttach}
              </button>
            )}
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-1.5"
              onClick={() => onPreview(file)}
            >
              {DOCS_COPY.rowPreview}
            </button>
            <div className="relative">
              <button
                type="button"
                className="p-1.5 rounded-md text-text-3 hover:text-text-1 hover:bg-surface-2"
                aria-label="More actions"
                onClick={() => onMenu(menuId === file.id ? null : file.id)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuId === file.id && (
                <div className="absolute right-0 mt-1 w-36 rounded-lg border border-border bg-surface shadow-1 z-20 py-1">
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-1.5 text-sm text-text-1 hover:bg-surface-2"
                    onClick={() => {
                      onAttach(file);
                      onMenu(null);
                    }}
                  >
                    {DOCS_COPY.rowAttach}
                  </button>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-1.5 text-sm text-text-1 hover:bg-surface-2"
                    onClick={() => {
                      onPreview(file);
                      onMenu(null);
                    }}
                  >
                    {DOCS_COPY.rowPreview}
                  </button>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-1.5 text-sm text-text-1 hover:bg-surface-2"
                    onClick={() => {
                      onDownload(file);
                      onMenu(null);
                    }}
                  >
                    {DOCS_COPY.rowDownload}
                  </button>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-1.5 text-sm text-error hover:bg-error/10"
                    onClick={() => {
                      onDelete(file);
                      onMenu(null);
                    }}
                  >
                    {DOCS_COPY.rowDelete}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KindGlyph({ kind }: { kind: LibraryFile["kind"] }) {
  const Icon =
    kind === "image" ? ImageIcon : kind === "csv" ? FileSpreadsheet : FileText;
  return (
    <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-text-2 shrink-0">
      <Icon className="w-4 h-4" />
    </span>
  );
}
