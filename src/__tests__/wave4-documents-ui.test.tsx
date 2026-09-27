/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const emptyQuery = vi.hoisted(() => ({ current: true }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("convex/react", () => ({
  useMutation: () => vi.fn(),
  useQuery: () =>
    emptyQuery.current
      ? []
      : [
          {
            id: "file-1",
            storageId: "storage-1",
            filename: "invoice-scan.jpg",
            contentType: "image/jpeg",
            size: 1_100_000,
            uploadedAt: Date.UTC(2026, 8, 25),
            source: "documents",
            kind: "image",
            linkType: null,
            linkId: null,
            linkLabel: null,
          },
        ],
  useConvex: () => ({ query: vi.fn() }),
}));

import DocumentsPage from "@/app/(dashboard)/documents/page";

describe("IVA-75 Documents hub UI", () => {
  it("renders the empty hero with locked copy and Upload CTA", () => {
    emptyQuery.current = true;
    render(<DocumentsPage />);
    expect(screen.getByRole("heading", { name: "Documents" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Upload" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Drop PDF, image, or CSV" })).toBeTruthy();
    expect(
      screen.getByText("Attach to a transaction, invoice, or expense anytime."),
    ).toBeTruthy();
    expect(screen.getByText("Choose file")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Books" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy();
    expect(
      screen.getByText((_, node) =>
        Boolean(
          node &&
            node.tagName === "P" &&
            node.textContent ===
              "Bank statements? Drop them on Books or Dashboard.",
        ),
      ),
    ).toBeTruthy();
  });

  it("renders the strip, filters, and unattached row actions when files exist", () => {
    emptyQuery.current = false;
    render(<DocumentsPage />);
    expect(screen.getByText("invoice-scan.jpg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unattached" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Preview" })).toBeTruthy();
    expect(screen.getAllByText("Unattached").length).toBeGreaterThan(0);
  });
});

