"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  category_type: string;
}

export default function AddFromReceiptPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "form" | "success">("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    transaction_date: "",
    category_id: "",
  });
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (res.ok && data.categories) setCategories(data.categories);
    } catch {
      // ignore
    }
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64 ?? "");
      };
      reader.onerror = reject;
    });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file (e.g. JPG, PNG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image must be under 8MB.");
      return;
    }

    setError(null);
    setLoading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const base64 = await fileToBase64(file);
      const ocrRes = await fetch("/api/expenses/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const ocrData = await ocrRes.json();

      if (!ocrRes.ok) {
        setError(ocrData.error || "Failed to read receipt.");
        setLoading(false);
        return;
      }

      const vendor = ocrData.vendor ?? "Receipt";
      const amount = ocrData.amount ?? 0;
      const date = ocrData.date ?? new Date().toISOString().slice(0, 10);

      await loadCategories();

      const catsRes = await fetch("/api/categories");
      const catsData = await catsRes.json();
      const allCats: Category[] = catsRes.ok ? catsData.categories ?? [] : [];
      setCategories(allCats);

      let categoryName: string | null = null;
      const categorizeRes = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant: vendor,
          amount: Number(amount),
          type: "debit",
        }),
      });
      if (categorizeRes.ok) {
        const catData = await categorizeRes.json();
        categoryName = catData.category ?? null;
      }

      const expenseCats = allCats.filter(
        (c) =>
          c.category_type === "expense" ||
          c.category_type === "debit" ||
          c.category_type === "Expense"
      );
      const listCats = expenseCats.length ? expenseCats : allCats;
      const matchedCategory = categoryName
        ? listCats.find(
            (c) =>
              c.name.toLowerCase() === categoryName!.toLowerCase() ||
              c.name.toLowerCase().includes(categoryName!.toLowerCase())
          ) ?? listCats.find((c) => c.name === "Uncategorized")
        : null;

      setForm({
        description: vendor,
        amount: amount ? String(amount) : "",
        transaction_date: date,
        category_id: matchedCategory?.id ?? "",
      });
      setSuggestedCategory(categoryName ?? null);
      setStep("form");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.transaction_date) {
      setError("Please fill in description, amount, and date.");
      return;
    }
    const amount = parseFloat(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description.trim(),
          amount,
          transaction_type: "debit",
          transaction_date: form.transaction_date,
          category_id: form.category_id || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create transaction.");
        setLoading(false);
        return;
      }
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep("upload");
    setForm({ description: "", amount: "", transaction_date: "", category_id: "" });
    setSuggestedCategory(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const expenseCategories =
    categories.filter(
      (c) =>
        c.category_type === "expense" ||
        c.category_type === "debit" ||
        c.category_type === "Expense"
    ) || categories;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/transactions"
          className="p-2 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          Add transaction from receipt
        </h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-red-600 dark:text-red-400 text-sm flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {step === "upload" && (
        <div className="bg-card border border-border rounded-xl p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex flex-col items-center justify-center gap-4 py-12 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <span className="text-foreground font-medium">
                  Reading receipt…
                </span>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  Upload or take a photo of your receipt
                </span>
                <span className="text-sm text-muted-foreground">
                  JPG, PNG or similar. We&apos;ll extract vendor, date and amount, then suggest a category.
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
          {previewUrl && (
            <div className="mb-4">
              <img
                src={previewUrl}
                alt="Receipt"
                className="max-h-32 rounded-lg border border-border object-contain"
              />
            </div>
          )}
          {suggestedCategory && (
            <p className="text-sm text-muted-foreground">
              Suggested category: <strong className="text-foreground">{suggestedCategory}</strong>
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description (vendor)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              placeholder="e.g. Shop name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Amount (₦)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Date
            </label>
            <input
              type="date"
              value={form.transaction_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, transaction_date: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category
            </label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="">— Select category —</option>
              {(expenseCategories.length ? expenseCategories : categories).map(
                (c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                )
              )}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetFlow}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Add transaction
            </button>
          </div>
        </form>
      )}

      {step === "success" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 dark:text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Transaction added
          </h2>
          <p className="text-muted-foreground mb-6">
            The receipt has been recorded as an expense.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={resetFlow}
              className="px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted/50"
            >
              Add another receipt
            </button>
            <Link
              href="/transactions"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
            >
              Back to transactions
            </Link>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/transactions" className="text-primary hover:underline">
          ← Back to transactions
        </Link>
      </p>
    </div>
  );
}
