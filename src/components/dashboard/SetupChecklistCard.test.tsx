/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupChecklistCard } from "./SetupChecklistCard";
import { SETUP_COPY } from "./setup-copy";
import type { ChecklistItem } from "@/lib/invoices/setup-checklist";

const midProgress: ChecklistItem[] = [
  { id: "legalName", done: true, optional: false },
  { id: "address", done: false, optional: false },
  { id: "contact", done: false, optional: false },
  { id: "tax", done: false, optional: true },
];

const completeSkippedTax: ChecklistItem[] = [
  { id: "legalName", done: true, optional: false },
  { id: "address", done: true, optional: false },
  { id: "contact", done: true, optional: false },
  { id: "tax", done: false, optional: true },
];

describe("SetupChecklistCard", () => {
  it("renders mid-progress 1 of 4 with Add links and no logo row", async () => {
    const onSetup = vi.fn();
    const onSoftDismiss = vi.fn();
    render(
      <SetupChecklistCard
        items={midProgress}
        doneCount={1}
        variant="progress"
        onSetup={onSetup}
        onSoftDismiss={onSoftDismiss}
        onCompleteAck={() => undefined}
      />,
    );

    expect(screen.getByText(SETUP_COPY.progress(1))).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.itemLegalName)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.itemAddress)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.itemContact)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.itemTax)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.itemTaxHint)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.logoDeferred)).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByText(/logo upload coming later/i)?.closest("li")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: SETUP_COPY.ctaPrimary }));
    const later = screen.getAllByRole("button", { name: SETUP_COPY.ctaLater });
    expect(later.length).toBeGreaterThanOrEqual(2);
    await userEvent.click(later[0]!);
    expect(onSetup).toHaveBeenCalled();
    expect(onSoftDismiss).toHaveBeenCalled();
  });

  it("renders the complete moment with tax skipped and a Done CTA", async () => {
    const onCompleteAck = vi.fn();
    render(
      <SetupChecklistCard
        items={completeSkippedTax}
        doneCount={3}
        variant="complete"
        onSetup={() => undefined}
        onSoftDismiss={() => undefined}
        onCompleteAck={onCompleteAck}
      />,
    );

    expect(screen.getByText(SETUP_COPY.progress(3))).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.subComplete)).toBeTruthy();
    expect(screen.getByText(SETUP_COPY.itemSkipped)).toBeTruthy();
    expect(screen.queryByRole("button", { name: SETUP_COPY.ctaLater })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: SETUP_COPY.ctaDone }));
    expect(onCompleteAck).toHaveBeenCalled();
  });
});
