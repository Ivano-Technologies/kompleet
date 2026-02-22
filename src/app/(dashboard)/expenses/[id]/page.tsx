"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

interface Expense {
  id: string;
  date: string;
  amount: number;
  currency: string;
  category_id: string | null;
  vendor: string | null;
  vat_amount: number;
  receipt_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: "",
    amount: "",
    currency: "NGN",
    category_id: "",
    vendor: "",
    vat_amount: "",
    notes: "",
  });

  const fetchExpense = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/expenses/${id}`);
    const data = await res.json();
    if (res.ok) {
      setExpense(data);
      setForm({
        date: data.date?.slice(0, 10) ?? "",
        amount: String(data.amount ?? ""),
        currency: data.currency ?? "NGN",
        category_id: data.category_id ?? "",
        vendor: data.vendor ?? "",
        vat_amount: String(data.vat_amount ?? ""),
        notes: data.notes ?? "",
      });
    } else {
      setExpense(null);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense().finally(() => setLoading(false));
  }, [fetchExpense]);

  useEffect(() => {
    fetch("/api/expenses/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  const onSave = async () => {
    if (!id) return;
    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount < 0) {
      alert("Enter a valid amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date || undefined,
          amount,
          currency: form.currency,
          category_id: form.category_id || null,
          vendor: form.vendor || undefined,
          vat_amount: form.vat_amount ? parseFloat(form.vat_amount) : 0,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setExpense(data);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Update failed");
      }
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id || !confirm("Delete this expense?")) return;
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/expenses");
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error ?? "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading…</div>
    );
  }

  if (!expense) {
    return (
      <div className="p-8">
        <p className="text-destructive">Expense not found.</p>
        <Link
          href="/expenses"
          className="text-primary hover:underline mt-2 inline-block"
        >
          ← Back to expenses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/expenses"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-foreground">Edit expense</h1>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Vendor
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={form.vendor}
            onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
            placeholder="Store or vendor"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Date
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Amount (₦)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            VAT (₦)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={form.vat_amount}
            onChange={(e) =>
              setForm((f) => ({ ...f, vat_amount: e.target.value }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            value={form.category_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, category_id: e.target.value }))
            }
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Notes
          </label>
          <textarea
            className="w-full rounded-lg border border-border bg-background px-3 py-2 min-h-[80px]"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes"
          />
        </div>
        {expense.receipt_url && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Receipt
            </label>
            <a
              href={expense.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm"
            >
              View receipt
            </a>
          </div>
        )}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white font-medium hover:bg-primary/90 disabled:opacity-70"
          >
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-destructive font-medium hover:bg-muted"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
