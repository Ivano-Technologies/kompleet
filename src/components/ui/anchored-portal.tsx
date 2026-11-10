"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Align = "start" | "end";

function place(
  anchor: DOMRect,
  menu: { width: number; height: number },
  align: Align,
): { top: number; left: number } {
  const gap = 4;
  const viewportPad = 8;
  const preferBelow = anchor.bottom + gap + menu.height <= window.innerHeight - viewportPad;
  const top = preferBelow
    ? anchor.bottom + gap
    : Math.max(viewportPad, anchor.top - gap - menu.height);
  const left =
    align === "end"
      ? Math.min(
          window.innerWidth - menu.width - viewportPad,
          Math.max(viewportPad, anchor.right - menu.width),
        )
      : Math.min(
          window.innerWidth - menu.width - viewportPad,
          Math.max(viewportPad, anchor.left),
        );
  return { top, left };
}

export function AnchoredPortal({
  open,
  anchor,
  onClose,
  align = "end",
  children,
  role,
  labelledBy,
  className,
}: {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  align?: Align;
  children: ReactNode;
  role?: "menu" | "listbox" | "dialog";
  labelledBy?: string;
  className?: string;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setCoords(null);
      return;
    }
    const update = () => {
      const menu = menuRef.current;
      const rect = anchor.getBoundingClientRect();
      const size = menu
        ? { width: menu.offsetWidth, height: menu.offsetHeight }
        : { width: 160, height: 120 };
      setCoords(place(rect, size, align));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchor, align, children]);

  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const first = menu?.querySelector<HTMLElement>(
      '[role="menuitem"], [role="option"], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    first?.focus();
  }, [open, coords]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (anchor?.contains(target)) return;
      onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose, anchor]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      role={role}
      aria-labelledby={labelledBy}
      className={cn(
        "fixed z-[70] rounded-lg border border-border bg-surface shadow-1 py-1",
        className,
      )}
      style={
        coords
          ? { top: coords.top, left: coords.left }
          : { top: 0, left: 0, visibility: "hidden" }
      }
    >
      {children}
    </div>,
    document.body,
  );
}
