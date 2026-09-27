import Link from "next/link";
import { DOCS_COPY } from "./docs-copy";

export function DocsEmptyHint() {
  return (
    <div className="flex flex-col items-center">
      <p className="text-center text-sm text-text-2 max-w-md leading-relaxed">
        Bank statements? Drop them on{" "}
        <Link
          href="/transactions"
          className="font-semibold text-primary underline underline-offset-2"
        >
          {DOCS_COPY.emptyHintBooks}
        </Link>{" "}
        or{" "}
        <Link
          href="/dashboard"
          className="font-semibold text-primary underline underline-offset-2"
        >
          {DOCS_COPY.emptyHintDashboard}
        </Link>
        .
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        <div className="rounded-xl border border-border bg-bg px-3.5 py-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-3 mb-1">
            {DOCS_COPY.emptyStatementsK}
          </p>
          <p className="text-xs text-text-1 leading-snug">
            {DOCS_COPY.emptyStatementsV}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-bg px-3.5 py-3 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-3 mb-1">
            {DOCS_COPY.emptyOtherK}
          </p>
          <p className="text-xs text-text-1 leading-snug">
            {DOCS_COPY.emptyOtherV}
          </p>
        </div>
      </div>
    </div>
  );
}
