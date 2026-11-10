"use client";

import { useEffect, useRef } from "react";
import { setPendingTurnstileToken } from "@/lib/turnstile-fetch";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      action?: string;
      callback?: (token: string) => void;
      "error-callback"?: () => void;
      "expired-callback"?: () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

function siteKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  return key && key.length > 0 ? key : undefined;
}

export function turnstileEnabledOnClient(): boolean {
  return Boolean(siteKey());
}

export function TurnstileField({
  action,
  onToken,
}: {
  action: string;
  onToken?: (token: string | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const key = siteKey();

  useEffect(() => {
    if (!key || !hostRef.current) {
      return;
    }

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !hostRef.current || !window.turnstile) {
        return;
      }
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = window.turnstile.render(hostRef.current, {
        sitekey: key,
        action,
        callback: (token) => {
          setPendingTurnstileToken(token);
          onToken?.(token);
        },
        "error-callback": () => {
          setPendingTurnstileToken(null);
          onToken?.(null);
        },
        "expired-callback": () => {
          setPendingTurnstileToken(null);
          onToken?.(null);
        },
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (window.turnstile) {
      renderWidget();
    } else if (existing) {
      existing.addEventListener("load", renderWidget);
    } else {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
      setPendingTurnstileToken(null);
    };
  }, [action, key, onToken]);

  if (!key) {
    return null;
  }

  return (
    <div
      className="flex justify-center py-1"
      data-testid="turnstile-field"
      data-turnstile-action={action}
    >
      <div ref={hostRef} className="min-h-[65px]" />
    </div>
  );
}
