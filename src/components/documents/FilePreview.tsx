"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { X } from "lucide-react";
import Papa from "papaparse";
import { api } from "@/lib/convex/browser";
import { DOCS_COPY } from "./docs-copy";
import { formatFileSize, formatUploadedDate } from "./docs-format";
import { extensionOf, kindLabel, type LibraryFile } from "./file-kind";

const CSV_PREVIEW_ROWS = 50;

interface FilePreviewProps {
  file: LibraryFile;
  onClose: () => void;
  onAttach: () => void;
  onDelete: () => void;
}

export function FilePreview({
  file,
  onClose,
  onAttach,
  onDelete,
}: FilePreviewProps) {
  const url = useQuery(api.files.getFileUrl, { fileId: file.id });
  const ext = extensionOf(file.filename);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div className="relative z-10 ml-auto h-full w-full lg:max-w-2xl bg-surface border-l border-border shadow-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-1 truncate">
              {file.filename}
            </p>
            <p className="text-xs text-text-3 mt-0.5">
              {kindLabel(file.kind)} · {formatFileSize(file.size)} ·{" "}
              {formatUploadedDate(file.uploadedAt)}
            </p>
            <p className="text-xs text-text-2 mt-1">
              {file.linkLabel
                ? `${file.linkType === "transaction" ? "Transaction" : file.linkType === "invoice" ? "Invoice" : "Expense"} · ${file.linkLabel}`
                : DOCS_COPY.rowUnattached}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-3 hover:text-text-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {url === undefined && (
            <p className="text-sm text-text-3">Loading preview…</p>
          )}
          {url === null && (
            <p className="text-sm text-error">Could not load this file.</p>
          )}
          {url && file.kind === "pdf" && (
            <iframe
              title={file.filename}
              src={url}
              className="w-full h-[min(70vh,640px)] rounded-xl border border-border bg-surface-2"
            />
          )}
          {url && file.kind === "image" && (
            // Convex storage URLs are user-owned blobs, not next/image hosts.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={file.filename}
              className="max-h-[min(70vh,640px)] max-w-full mx-auto rounded-xl"
            />
          )}
          {url && file.kind === "csv" && ext === ".csv" && (
            <CsvTable url={url} />
          )}
          {url && file.kind === "csv" && ext !== ".csv" && (
            <p className="text-sm text-text-2">
              Spreadsheet preview is download-only. Use Download to open the
              file.
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex flex-wrap gap-2 justify-end">
          {url && (
            <a
              href={url}
              download={file.filename}
              className="btn-secondary text-sm px-3 py-2"
            >
              {DOCS_COPY.rowDownload}
            </a>
          )}
          <button
            type="button"
            className="btn-secondary text-sm px-3 py-2"
            onClick={onAttach}
          >
            {file.linkId ? "Change link" : DOCS_COPY.rowAttach}
          </button>
          <button
            type="button"
            className="text-sm px-3 py-2 rounded-md border border-error text-error hover:bg-error/10"
            onClick={onDelete}
          >
            {DOCS_COPY.rowDelete}
          </button>
        </div>
      </div>
    </div>
  );
}

function CsvTable({ url }: { url: string }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load CSV");
        const text = await response.text();
        const parsed = Papa.parse<string[]>(text, {
          skipEmptyLines: true,
        });
        if (cancelled) return;
        const data = (parsed.data ?? []).slice(0, CSV_PREVIEW_ROWS + 1);
        setRows(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load CSV");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) return <p className="text-sm text-error">{error}</p>;
  if (!rows) return <p className="text-sm text-text-3">Loading table…</p>;
  if (rows.length === 0) {
    return <p className="text-sm text-text-3">This CSV is empty.</p>;
  }

  const header = rows[0] ?? [];
  const body = rows.slice(1);

  return (
    <div className="overflow-auto rounded-xl border border-border">
      <table className="min-w-full text-xs">
        <thead className="bg-surface-2">
          <tr>
            {header.map((cell, index) => (
              <th
                key={`h-${index}`}
                className="text-left font-semibold text-text-1 px-2 py-1.5 border-b border-border whitespace-nowrap"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={`r-${rowIndex}`} className="odd:bg-surface even:bg-surface-2/40">
              {header.map((_, colIndex) => (
                <td
                  key={`c-${rowIndex}-${colIndex}`}
                  className="px-2 py-1.5 text-text-2 border-b border-border whitespace-nowrap"
                >
                  {row[colIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
