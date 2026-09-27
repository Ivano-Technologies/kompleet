"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex/browser";
import { AttachFileSheet, type LockedLink } from "./AttachFileSheet";
import { DOCS_COPY } from "./docs-copy";
import { DocsToast } from "./DocsToast";

export function AttachFileButton({
  link,
  className,
}: {
  link: LockedLink;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const files = useQuery(api.files.listFilesForLink, {
    linkType: link.type,
    linkId: link.id,
  });

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={className ?? "btn-secondary text-sm px-3 py-2"}
        onClick={() => setOpen(true)}
      >
        {DOCS_COPY.detailCta}
      </button>
      {(files ?? []).length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files?.map((file) => (
            <li key={file.id}>
              <Link
                href="/documents"
                className="inline-flex max-w-[200px] truncate rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-primary"
              >
                {file.filename}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <AttachFileSheet
        open={open}
        lockedLink={link}
        onClose={() => setOpen(false)}
        onAttached={(label) => setToast(DOCS_COPY.toastAttached(label))}
      />
      {toast && <DocsToast title={toast} onDismiss={() => setToast(null)} />}
    </div>
  );
}
