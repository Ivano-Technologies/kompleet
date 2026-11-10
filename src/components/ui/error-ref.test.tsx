import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorText } from "@/components/ui/error-ref";
import { FRIENDLY_FALLBACK, FRIENDLY_MESSAGES, withRef } from "@/lib/friendly-error";

vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

describe("ErrorText", () => {
  it("shows an embedded ref as a muted line", () => {
    render(<ErrorText text={withRef("We couldn't save this.", "ABCD2345")} />);
    expect(screen.getByText("We couldn't save this.")).toBeInTheDocument();
    const ref = screen.getByTestId("error-ref");
    expect(ref.textContent).toBe("Ref: ABCD2345");
    expect(ref.className).toMatch(/text-gray-500/);
  });

  it("does not issue a Ref for plain expected messages", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ErrorText text="Enter an amount greater than 0." />);
    expect(screen.getByText("Enter an amount greater than 0.")).toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("issues a Ref for unexpected UI-set fallback copy", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ErrorText text={FRIENDLY_FALLBACK} />);
    expect(screen.getByText(FRIENDLY_FALLBACK)).toBeInTheDocument();
    const ref = (screen.getByTestId("error-ref").textContent ?? "").slice(5);
    expect(ref).toMatch(/^[A-Z0-9]{8}$/);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`ref=${ref}`),
      FRIENDLY_FALLBACK,
    );
    spy.mockRestore();
  });

  it("issues a Ref for unexpected retry copy without an embedded Ref", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ErrorText text="We couldn't save this. Please try again." />);
    expect(
      screen.getByText("We couldn't save this. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("error-ref").textContent).toMatch(/^Ref: [A-Z0-9]{8}$/);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not issue a Ref for known auth, 404, or validation copy", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const expected = [
      FRIENDLY_MESSAGES.invalidCredentials,
      FRIENDLY_MESSAGES.unauthorized,
      "Page not found",
      "Sign in to see this page.",
      "No access",
      "Email is required.",
      "We couldn't find this transaction. It may have been deleted.",
      "We couldn't sign you in. Please try again.",
    ];
    for (const text of expected) {
      const { unmount } = render(<ErrorText text={text} />);
      expect(screen.getByText(text)).toBeInTheDocument();
      expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
      unmount();
    }
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("does not mint a Ref when issueGeneratedRef is false", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<ErrorText text={FRIENDLY_FALLBACK} issueGeneratedRef={false} />);
    expect(screen.getByText(FRIENDLY_FALLBACK)).toBeInTheDocument();
    expect(screen.queryByTestId("error-ref")).not.toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
