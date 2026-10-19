"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ErrorText } from "@/components/ui/error-ref";

const EVENT = "kompleet:error-toast";

/**
 * Show a friendly error in a toast instead of a browser alert, so it gets
 * the muted ref line. Pass the output of `toFriendlyMessage` or plain copy
 * (a ref is issued and logged for plain copy).
 */
export function notifyError(text: string, context = "toast"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { text, context } }));
}

type ToastState = { id: number; text: string; context: string };

/** Mounted once in the root layout. */
export function ErrorToaster() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ text: string; context: string }>).detail;
      if (!detail?.text) return;
      setToast({ id: Date.now(), text: detail.text, context: detail.context });
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 10_000);
    };
    window.addEventListener(EVENT, onEvent);
    return () => {
      window.removeEventListener(EVENT, onEvent);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!toast) return null;
  return (
    <div
      role="alert"
      data-testid="error-toast"
      className="fixed inset-x-4 bottom-4 z-[100] mx-auto flex max-w-md items-start gap-3 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-lg dark:border-red-900 dark:bg-gray-900 dark:text-red-300"
    >
      <p className="flex-1">
        <ErrorText key={toast.id} text={toast.text} context={toast.context} />
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setToast(null)}
        className="shrink-0 rounded p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
