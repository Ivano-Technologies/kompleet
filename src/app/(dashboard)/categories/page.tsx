"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tags,
  Pencil,
  X,
  Save,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, type Role } from "@/lib/auth/rbac";
import { apiErrorMessage, toFriendlyMessage } from "@/lib/friendly-error";
import { ErrorText } from "@/components/ui/error-ref";

interface Category {
  id: string;
  name: string;
  category_type: string;
  tax_treatment: string;
  keywords: string[];
  description?: string;
  is_system: boolean;
}

export default function CategoriesPage() {
  const { user } = useAuth();
  const role: Role = (user?.app_metadata?.role as Role | undefined) ?? "user";
  const canEditCategories = hasPermission(role, "admin:manage_rules");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});
  const [newKeyword, setNewKeyword] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (response.ok) {
        setCategories(data.categories || []);
        setError(null);
      } else {
        setError(apiErrorMessage(data, "We couldn't load your categories. Please try again."));
      }
    } catch (error) {
      setError(toFriendlyMessage(error, "We couldn't load your categories. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    if (!canEditCategories) return;
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description,
      keywords: [...category.keywords],
    });
    setNewKeyword("");
  };

  const handleSave = async () => {
    if (!canEditCategories || !editingId) return;
    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        await fetchCategories();
        setEditingId(null);
        setEditForm({});
        setError(null);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(apiErrorMessage(data, "We couldn't save this category. Please try again."));
      }
    } catch (error) {
      setError(toFriendlyMessage(error, "We couldn't save this category. Please try again."));
    }
  };

  const handleAddKeyword = () => {
    if (!canEditCategories || !newKeyword.trim()) return;
    setEditForm({
      ...editForm,
      keywords: [...(editForm.keywords || []), newKeyword.trim()],
    });
    setNewKeyword("");
  };

  const handleRemoveKeyword = (keyword: string) => {
    if (!canEditCategories) return;
    setEditForm({
      ...editForm,
      keywords: (editForm.keywords || []).filter((k) => k !== keyword),
    });
  };

  const filteredCategories = categories.filter(
    (cat) => filter === "all" || cat.category_type === filter,
  );

  const typeColor: Record<string, string> = {
    income:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    expense: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    asset: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    liability:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  const taxColor: Record<string, string> = {
    deductible:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    non_deductible:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    capital_allowance:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    exempt:
      "bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary",
  };

  const inputCls =
    "w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:border-primary-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        <span className="ml-2 text-sm text-light-text-secondary dark:text-dark-text-secondary">
          Loading categories...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg flex justify-between items-center">
          <p className="text-red-600 dark:text-red-400 text-sm"><ErrorText text={error} /></p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      )}
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tags className="w-5 h-5 text-primary-500" />
            <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
              Categories
            </h1>
          </div>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            {canEditCategories
              ? "Manage transaction categories and keywords for auto-categorization"
              : "Transaction categories and keywords used for auto-categorization"}
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-sm font-medium text-primary-500 hover:text-primary-400 flex items-center gap-1"
        >
          View Transactions <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "income", "expense", "asset", "liability"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
              filter === value
                ? "border-primary-500 bg-primary-500/10 text-primary-500"
                : "border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary-500/30 transition-colors"
          >
            {canEditCategories && editingId === category.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Category name
                  </label>
                  <input
                    type="text"
                    value={editForm.name || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    disabled={category.is_system}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description || ""}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={2}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">
                    Keywords
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword();
                        }
                      }}
                      className={inputCls}
                      placeholder="Add keyword"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="px-3 py-2 text-sm rounded-lg bg-primary-500 text-white"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(editForm.keywords || []).map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary-500/10 text-primary-500"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="hover:text-primary-400"
                          aria-label={`Remove ${keyword}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-primary-500 text-white"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditForm({});
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-light-border dark:border-dark-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div>
                    <h2 className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">
                      {category.name}
                      {category.is_system && (
                        <span className="ml-2 text-[10px] font-medium text-light-text-secondary dark:text-dark-text-secondary">
                          System
                        </span>
                      )}
                    </h2>
                    {category.description && (
                      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                  {canEditCategories && (
                    <button
                      type="button"
                      onClick={() => handleEdit(category)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-500 hover:text-primary-400"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      typeColor[category.category_type] ||
                      "bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary"
                    }`}
                  >
                    {category.category_type}
                  </span>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      taxColor[category.tax_treatment] ||
                      "bg-light-background dark:bg-dark-background text-light-text-secondary dark:text-dark-text-secondary"
                    }`}
                  >
                    {category.tax_treatment.replace("_", " ")}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
