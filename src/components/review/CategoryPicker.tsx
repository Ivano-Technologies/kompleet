"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { TRIAGE_COPY } from "./triage-copy";
import type { TriageCategory } from "@/lib/transactions/triage";

export function CategoryPicker({
  categories,
  onPick,
  onClose,
}: {
  categories: TriageCategory[];
  onPick: (category: TriageCategory) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(needle),
    );
  }, [categories, query]);

  return (
    <div
      ref={rootRef}
      className="absolute right-0 top-full z-20 mt-1.5 w-[280px] overflow-hidden rounded-xl border border-border bg-surface shadow-1"
      role="listbox"
      aria-label={TRIAGE_COPY.pickerSearch}
    >
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={TRIAGE_COPY.pickerSearch}
        className="w-full border-0 border-b border-border bg-surface px-3 py-2.5 text-sm text-text-1 placeholder:text-text-3 outline-none"
      />
      <div className="max-h-64 overflow-auto">
        {filtered.length === 0 ? (
          <p className="px-3 py-2.5 text-xs text-text-3">{TRIAGE_COPY.pickerEmpty}</p>
        ) : (
          filtered.map((category) => (
            <button
              key={category.id}
              type="button"
              role="option"
              className="block w-full border-b border-surface-2 px-3 py-2.5 text-left text-sm text-text-1 last:border-0 hover:bg-accent/10 hover:text-accent"
              onClick={() => onPick(category)}
            >
              {category.name}
            </button>
          ))
        )}
        <Link
          href="/categories"
          className="block px-3 py-2.5 text-xs text-text-3 hover:bg-surface-2"
        >
          {TRIAGE_COPY.pickerManage}
        </Link>
      </div>
    </div>
  );
}
