"use client";

import { useEffect, useMemo, useState } from "react";
import { INV_COPY } from "./invoice-copy";

export type InvoiceClient = {
  id: string;
  legal_name: string;
  email?: string;
  phone?: string;
};

export function CustomerCombobox({
  clients,
  value,
  onChange,
  onCreated,
}: {
  clients: InvoiceClient[];
  value: InvoiceClient | null;
  onChange: (client: InvoiceClient | null) => void;
  onCreated: (client: InvoiceClient) => void;
}) {
  const [query, setQuery] = useState(value?.legal_name ?? "");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value) setQuery(value.legal_name);
  }, [value]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 8);
    return clients
      .filter((client) => client.legal_name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [clients, query]);

  const exactMatch = clients.some(
    (client) => client.legal_name.toLowerCase() === query.trim().toLowerCase(),
  );
  const canCreate = query.trim().length > 0 && !exactMatch;

  const saveClient = async () => {
    const name = query.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          legal_name: name,
          email: newEmail,
          phone: newPhone,
        }),
      });
      const body = (await response.json()) as {
        client?: InvoiceClient;
        error?: string;
      };
      if (!response.ok || !body.client) {
        throw new Error(body.error || "Failed to create client");
      }
      const created = {
        ...body.client,
        email: newEmail,
        phone: newPhone,
      };
      onCreated(created);
      onChange(created);
      setCreating(false);
      setOpen(false);
      setNewEmail("");
      setNewPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (value && event.target.value !== value.legal_name) onChange(null);
        }}
        onFocus={() => setOpen(true)}
        placeholder={INV_COPY.clientSearch}
        className="w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={INV_COPY.quickCustomer}
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-border bg-surface shadow-1 overflow-hidden">
          {matches.map((client) => (
            <button
              key={client.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm text-text-1 hover:bg-surface-2"
              onClick={() => {
                onChange(client);
                setQuery(client.legal_name);
                setOpen(false);
                setCreating(false);
              }}
            >
              {client.legal_name}
            </button>
          ))}
          {canCreate && !creating && (
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-surface-2"
              onClick={() => setCreating(true)}
            >
              {INV_COPY.clientCreate(query.trim())}
            </button>
          )}
          {creating && (
            <div className="p-3 space-y-2 border-t border-border">
              <label className="block text-xs text-text-2">
                {INV_COPY.clientName}
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
                />
              </label>
              <label className="block text-xs text-text-2">
                {INV_COPY.clientEmail}
                <input
                  type="email"
                  value={newEmail}
                  onChange={(event) => setNewEmail(event.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
                />
              </label>
              <label className="block text-xs text-text-2">
                {INV_COPY.clientPhone}
                <input
                  value={newPhone}
                  onChange={(event) => setNewPhone(event.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-md border border-border bg-surface text-text-1"
                />
              </label>
              {error && <p className="text-xs text-error">{error}</p>}
              <button
                type="button"
                className="btn-secondary text-sm px-3 py-1.5"
                disabled={saving}
                onClick={() => void saveClient()}
              >
                {saving ? "Saving…" : INV_COPY.clientSave}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
