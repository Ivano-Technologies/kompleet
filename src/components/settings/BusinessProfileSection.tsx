"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BIZ_COPY } from "./profile-copy";
import {
  emptyBusinessProfile,
  hasLegalName,
  isBusinessProfileComplete,
  isValidEmail,
  type BusinessProfile,
} from "@/lib/invoices/profiles";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-surface text-text-1 placeholder-text-3 focus:outline-none focus:border-primary";

export function BusinessProfileSection({
  onStatus,
}: {
  onStatus: (kind: "success" | "error", message: string) => void;
}) {
  const [form, setForm] = useState<BusinessProfile>(emptyBusinessProfile());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/business-profile", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { profile?: BusinessProfile };
        if (!cancelled && body.profile) setForm({ ...emptyBusinessProfile(), ...body.profile });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key: keyof BusinessProfile, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    const email = form.email.trim();
    if (email && !isValidEmail(email)) {
      onStatus("error", "Invalid email address");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/business-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const body = (await res.json()) as { profile?: BusinessProfile; error?: string };
      if (!res.ok || !body.profile) {
        throw new Error(body.error || "Failed to save");
      }
      setForm({ ...emptyBusinessProfile(), ...body.profile });
      if (!isBusinessProfileComplete(body.profile) && hasLegalName(body.profile)) {
        onStatus("success", BIZ_COPY.toastSavedIncomplete);
      } else if (!hasLegalName(body.profile)) {
        onStatus("success", BIZ_COPY.toastSaved);
      } else if (!isBusinessProfileComplete(body.profile)) {
        onStatus("success", BIZ_COPY.toastSavedIncomplete);
      } else {
        onStatus("success", BIZ_COPY.toastSaved);
      }
    } catch (err) {
      onStatus("error", err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-text-3">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-text-1">{BIZ_COPY.title}</h2>
        <p className="text-xs text-text-3 mt-0.5">{BIZ_COPY.sub}</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-2 mb-1.5">
          {BIZ_COPY.legalName} <span className="text-error">*</span>
        </label>
        <input
          value={form.legalName}
          onChange={(e) => set("legalName", e.target.value)}
          className={inputCls}
        />
      </div>

      <p className="text-[11px] font-bold tracking-wider uppercase text-text-3 pt-1">
        {BIZ_COPY.address}
      </p>
      <div>
        <label className="block text-xs font-semibold text-text-2 mb-1.5">
          {BIZ_COPY.address1}
        </label>
        <input
          value={form.addressLine1}
          onChange={(e) => set("addressLine1", e.target.value)}
          className={inputCls}
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-text-2 mb-1.5">
          {BIZ_COPY.address2}
        </label>
        <input
          value={form.addressLine2}
          onChange={(e) => set("addressLine2", e.target.value)}
          placeholder="Suite, landmark…"
          className={inputCls}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px] gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.city}
          </label>
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.state}
          </label>
          <input
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.country}
          </label>
          <input
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <p className="text-[11px] font-bold tracking-wider uppercase text-text-3 pt-1">
        {BIZ_COPY.contact}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.email}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.phone}
          </label>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <p className="text-[11px] font-bold tracking-wider uppercase text-text-3 pt-1">
        {BIZ_COPY.taxIds}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.tin}
          </label>
          <input
            value={form.tin}
            onChange={(e) => set("tin", e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {BIZ_COPY.vat}
          </label>
          <input
            value={form.vatNumber}
            onChange={(e) => set("vatNumber", e.target.value)}
            placeholder="Optional"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex gap-2.5 items-start px-3 py-2.5 rounded-[10px] bg-surface-2 text-xs text-text-2">
        <span>ℹ</span>
        <p>{BIZ_COPY.logoDeferred}</p>
      </div>

      <div className="flex justify-end gap-2.5 pt-2">
        <button
          type="button"
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          {BIZ_COPY.save}
        </button>
      </div>
    </div>
  );
}
