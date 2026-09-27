"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { CLIENTS_COPY } from "./profile-copy";
import { DEFAULT_COUNTRY, type ClientProfile } from "@/lib/invoices/profiles";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-surface text-text-1 placeholder-text-3 focus:outline-none focus:border-primary";

const emptyClient = (): Omit<ClientProfile, "id" | "used_on_issued" | "archived"> => ({
  legal_name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  country: DEFAULT_COUNTRY,
});

export function ClientsSection({
  onStatus,
}: {
  onStatus: (kind: "success" | "error", message: string) => void;
}) {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ClientProfile | null>(null);
  const [form, setForm] = useState(emptyClient());
  const [saving, setSaving] = useState(false);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const load = async () => {
    const res = await fetch("/api/clients", { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load clients");
    const body = (await res.json()) as { clients?: ClientProfile[] };
    setClients(body.clients ?? []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } catch (err) {
        if (!cancelled) {
          onStatusRef.current(
            "error",
            err instanceof Error ? err.message : "Failed to load clients",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.legal_name, client.email, client.city].some((field) =>
        field.toLowerCase().includes(q),
      ),
    );
  }, [clients, query]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyClient());
  };

  const openEdit = (client: ClientProfile) => {
    setEditing(client);
    setForm({
      legal_name: client.legal_name,
      email: client.email,
      phone: client.phone,
      addressLine1: client.addressLine1,
      addressLine2: client.addressLine2,
      city: client.city,
      state: client.state,
      country: client.country || DEFAULT_COUNTRY,
    });
  };

  const save = async () => {
    if (!form.legal_name.trim()) {
      onStatus("error", "Client name is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        legal_name: form.legal_name,
        email: form.email,
        phone: form.phone,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        country: form.country,
      };
      const res = await fetch(editing ? `/api/clients/${editing.id}` : "/api/clients", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { client?: ClientProfile; error?: string };
      if (!res.ok || !body.client) throw new Error(body.error || "Failed to save client");
      await load();
      setEditing(null);
      setForm(emptyClient());
      onStatus("success", "Client saved");
    } catch (err) {
      onStatus("error", err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const hide = async (client: ClientProfile) => {
    if (!confirm(CLIENTS_COPY.hideConfirm)) return;
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || CLIENTS_COPY.deleteBlocked);
      }
      await load();
      if (editing?.id === client.id) {
        setEditing(null);
        setForm(emptyClient());
      }
      onStatus("success", "Client hidden");
    } catch (err) {
      onStatus("error", err instanceof Error ? err.message : CLIENTS_COPY.deleteBlocked);
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

  const showForm = editing !== null || form.legal_name.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold text-text-1">{CLIENTS_COPY.title}</h2>
        <button
          type="button"
          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1"
          onClick={openNew}
        >
          <Plus className="w-3 h-3" />
          {CLIENTS_COPY.new}
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={CLIENTS_COPY.search}
        className={inputCls}
        aria-label={CLIENTS_COPY.search}
      />

      {filtered.length === 0 && !showForm ? (
        <p className="text-sm text-text-3">{CLIENTS_COPY.empty}</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_7rem] gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-text-3 bg-surface-2">
            <span>{CLIENTS_COPY.name}</span>
            <span>{CLIENTS_COPY.email}</span>
            <span>{CLIENTS_COPY.city}</span>
          </div>
          {filtered.map((client) => (
            <button
              key={client.id}
              type="button"
              onClick={() => openEdit(client)}
              className="w-full grid grid-cols-[1fr_1fr_7rem] gap-2 px-3 py-2.5 text-left text-sm border-t border-border hover:bg-surface-2"
            >
              <span className="truncate text-text-1 font-medium">{client.legal_name}</span>
              <span className="truncate text-text-2">{client.email || "—"}</span>
              <span className="truncate text-text-2">{client.city || "—"}</span>
            </button>
          ))}
        </div>
      )}

      <div className="p-4 rounded-xl border border-border space-y-3">
        <p className="text-sm font-semibold text-text-1">
          {editing ? "Edit client" : CLIENTS_COPY.new}
        </p>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {CLIENTS_COPY.name} <span className="text-error">*</span>
          </label>
          <input
            value={form.legal_name}
            onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">
              {CLIENTS_COPY.email}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">
              {CLIENTS_COPY.phone}
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {CLIENTS_COPY.address1}
          </label>
          <input
            value={form.addressLine1}
            onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-text-2 mb-1.5">
            {CLIENTS_COPY.address2}
          </label>
          <input
            value={form.addressLine2}
            onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">
              {CLIENTS_COPY.city}
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">
              {CLIENTS_COPY.state}
            </label>
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-2 mb-1.5">
              {CLIENTS_COPY.country}
            </label>
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex justify-between gap-2">
          {editing ? (
            <button
              type="button"
              className="text-xs font-medium text-error"
              title={editing.used_on_issued ? CLIENTS_COPY.usedOnInvoices : CLIENTS_COPY.hide}
              onClick={() => void hide(editing)}
            >
              {editing.used_on_issued ? `${CLIENTS_COPY.hide} · ${CLIENTS_COPY.usedOnInvoices}` : CLIENTS_COPY.hide}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary text-sm px-3 py-2"
              onClick={() => {
                setEditing(null);
                setForm(emptyClient());
              }}
            >
              {CLIENTS_COPY.cancel}
            </button>
            <button
              type="button"
              className="btn-primary text-sm px-3 py-2 disabled:opacity-50"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {CLIENTS_COPY.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
