import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorText } from "@/components/ui/error-ref";
import { withRef } from "@/lib/friendly-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("ErrorText", () => {
  it("shows an embedded ref as a muted line", () => {
    render(<ErrorText text={withRef("We couldn't save this.", "ABCD2345")} />);
    expect(screen.getByText("We couldn't save this.")).toBeInTheDocument();
    const ref = screen.getByTestId("error-ref");
    expect(ref.textContent).toBe("Ref: ABCD2345");
    expect(ref.className).toMatch(/text-gray-500/);
  });

  it("issues and logs a ref for plain input errors", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ErrorText text="Enter an amount greater than 0." />);
    const ref = (screen.getByTestId("error-ref").textContent ?? "").slice(5);
    expect(ref).toMatch(/^[A-Z0-9]{8}$/);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`ref=${ref}`),
      "Enter an amount greater than 0.",
    );
    spy.mockRestore();
  });
});
