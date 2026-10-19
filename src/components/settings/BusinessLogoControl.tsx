"use client";

/* eslint-disable @next/next/no-img-element -- logo preview comes from a Convex storage URL */

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAction, useMutation } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "@/lib/convex/browser";
import { BIZ_COPY } from "./profile-copy";
import { checkLogoFile, logoFileType, svgToPng } from "@/lib/invoices/logo-upload";
import type { BusinessProfile } from "@/lib/invoices/profiles";

/**
 * IVA-185: upload, preview, replace and remove the business logo.
 * 96px preview box that shows the whole logo (contain).
 */
export function BusinessLogoControl({
  logoUrl,
  onChange,
  onStatus,
}: {
  logoUrl: string | null | undefined;
  onChange: (profile: BusinessProfile) => void;
  onStatus: (kind: "success" | "error", message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const generateUploadUrl = useMutation(api.tenancy.generateBusinessLogoUploadUrl);
  const setLogo = useAction(api.tenancy.setMyBusinessLogo);
  const removeLogo = useMutation(api.tenancy.removeMyBusinessLogo);

  const upload = async (file: File) => {
    const problem = checkLogoFile(file);
    if (problem) {
      onStatus("error", problem === "size" ? BIZ_COPY.logoTooBig : BIZ_COPY.logoBadType);
      return;
    }
    setBusy(true);
    try {
      const type = logoFileType(file);
      const body: Blob = type === "image/svg+xml" ? await svgToPng(file) : file;
      const contentType = type === "image/svg+xml" ? "image/png" : (type ?? file.type);
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body,
      });
      if (!res.ok) throw new Error(BIZ_COPY.logoFailed);
      const { storageId } = (await res.json()) as { storageId: string };
      const profile = await setLogo({ storageId: storageId as Id<"_storage"> });
      onChange(profile as BusinessProfile);
      onStatus("success", BIZ_COPY.logoSaved);
    } catch (err) {
      onStatus("error", err instanceof Error && err.message ? err.message : BIZ_COPY.logoFailed);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const profile = await removeLogo({});
      onChange(profile as BusinessProfile);
      onStatus("success", BIZ_COPY.logoRemoved);
    } catch (err) {
      onStatus("error", err instanceof Error && err.message ? err.message : BIZ_COPY.logoFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2" data-testid="business-logo-control">
      <div>
        <p className="text-[11px] font-bold tracking-wider uppercase text-text-3">
          {BIZ_COPY.logoTitle}
        </p>
        <p className="text-xs text-text-3 mt-0.5">{BIZ_COPY.logoSub}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 shrink-0 rounded-[10px] border border-border bg-white flex items-center justify-center overflow-hidden p-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Business logo"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <span className="text-[11px] text-text-3 text-center">{BIZ_COPY.logoEmpty}</span>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {busy ? BIZ_COPY.logoUploading : logoUrl ? BIZ_COPY.logoReplace : BIZ_COPY.logoUpload}
            </button>
            {logoUrl && (
              <button
                type="button"
                className="text-sm px-3 py-1.5 text-text-2 underline underline-offset-2 disabled:opacity-50"
                disabled={busy}
                onClick={() => void remove()}
              >
                {BIZ_COPY.logoRemove}
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-3">{BIZ_COPY.logoHint}</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,.png,.jpg,.jpeg,.svg"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
    </div>
  );
}
