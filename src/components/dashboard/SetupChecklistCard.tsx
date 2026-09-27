"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHECKLIST_ITEM_COUNT,
  type ChecklistItem,
  type ChecklistItemId,
} from "@/lib/invoices/setup-checklist";
import { SETUP_COPY } from "./setup-copy";

const ITEM_LABEL: Record<ChecklistItemId, string> = {
  legalName: SETUP_COPY.itemLegalName,
  address: SETUP_COPY.itemAddress,
  contact: SETUP_COPY.itemContact,
  tax: SETUP_COPY.itemTax,
};

export function SetupChecklistCard({
  items,
  doneCount,
  variant,
  onSetup,
  onSoftDismiss,
  onCompleteAck,
}: {
  items: ChecklistItem[];
  doneCount: number;
  variant: "progress" | "complete";
  onSetup: () => void;
  onSoftDismiss: () => void;
  onCompleteAck: () => void;
}) {
  const complete = variant === "complete";

  return (
    <section
      aria-label={complete ? `${SETUP_COPY.title} — complete` : SETUP_COPY.title}
      className={cn(
        "bg-surface border rounded-lg px-[22px] py-5 shadow-[0_2px_8px_rgba(13,27,42,0.04)]",
        complete ? "border-success" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-[17px] font-bold tracking-[-0.02em] text-text-1">
            {SETUP_COPY.title}
          </h2>
          <span
            className={cn(
              "text-[11px] font-semibold rounded-full px-2.5 py-1",
              complete
                ? "text-success bg-success/12"
                : "text-text-2 bg-surface-2",
            )}
          >
            {SETUP_COPY.progress(doneCount)}
          </span>
        </div>
        {!complete && (
          <button
            type="button"
            onClick={onSoftDismiss}
            className="w-7 h-7 shrink-0 rounded-[8px] border border-border bg-surface text-text-3 flex items-center justify-center hover:bg-surface-2"
            title={SETUP_COPY.ctaLater}
            aria-label={SETUP_COPY.ctaLater}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-[13px] text-text-3 mb-4">
        {complete ? SETUP_COPY.subComplete : SETUP_COPY.sub}
      </p>

      <ul className="flex flex-col gap-0.5 mb-3.5">
        {items.map((item) => {
          const skipped = complete && item.optional && !item.done;
          const status = item.done
            ? SETUP_COPY.itemDone
            : skipped
              ? SETUP_COPY.itemSkipped
              : SETUP_COPY.itemAdd;
          return (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-2 py-2.5 rounded-[10px]",
                item.done && "bg-success/6",
                skipped && "bg-transparent",
              )}
            >
              <span
                className={cn(
                  "w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center text-xs font-bold",
                  item.done
                    ? "bg-success text-white"
                    : "bg-surface border-[1.5px] border-border",
                )}
                aria-hidden
              >
                {item.done ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
              </span>
              <div className="flex-1 min-w-0 text-[13px] font-medium text-text-1">
                <span className={cn(item.done && "text-text-2")}>
                  {ITEM_LABEL[item.id]}
                </span>
                {item.optional && (
                  <span className="ml-1 text-xs font-normal text-text-3">
                    {SETUP_COPY.itemTaxHint}
                  </span>
                )}
              </div>
              {item.done || skipped ? (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    skipped ? "text-text-3 font-medium" : "text-success",
                  )}
                >
                  {status}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onSetup}
                  className="text-xs font-semibold text-primary underline underline-offset-2"
                >
                  {SETUP_COPY.itemAdd}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2.5 items-start px-3 py-2.5 rounded-[10px] bg-surface-2 text-xs text-text-2 mb-4">
        <span
          className="w-[18px] h-[18px] rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center shrink-0"
          aria-hidden
        >
          i
        </span>
        <p>
          <strong className="text-primary">{SETUP_COPY.logoDeferred}</strong>
          {" \u2014 "}
          {complete
            ? SETUP_COPY.logoDeferredComplete
            : SETUP_COPY.logoDeferredSub}
        </p>
      </div>

      <div className="flex justify-end gap-2.5 items-center">
        {complete ? (
          <button
            type="button"
            onClick={onCompleteAck}
            className="bg-success hover:bg-success/90 text-white rounded-md px-[18px] py-2.5 text-[13px] font-semibold"
          >
            {SETUP_COPY.ctaDone}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onSoftDismiss}
              className="bg-transparent text-text-2 border border-border rounded-md px-[18px] py-2.5 text-[13px] font-medium hover:bg-surface-2"
            >
              {SETUP_COPY.ctaLater}
            </button>
            <button
              type="button"
              onClick={onSetup}
              className="btn-primary text-[13px] px-[18px] py-2.5"
            >
              {SETUP_COPY.ctaPrimary}
            </button>
          </>
        )}
      </div>
      <p className="sr-only">
        {SETUP_COPY.progress(doneCount)} · {CHECKLIST_ITEM_COUNT} items
      </p>
    </section>
  );
}
