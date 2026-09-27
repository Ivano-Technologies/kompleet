/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  QuietLoadWarn,
  QUIET_500_COPY,
} from "@/components/feedback/QuietLoadWarn";

describe("IVA-86 quiet 500 warn strip", () => {
  it("shows the locked duplicates copy and retries without replacing the page", async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();
    render(
      <div>
        <h1>Resolve Duplicates</h1>
        <QuietLoadWarn
          message={QUIET_500_COPY.duplicatesStrip}
          onRetry={onRetry}
        />
      </div>,
    );

    expect(screen.getByRole("heading", { name: "Resolve Duplicates" })).toBeTruthy();
    expect(screen.getByText(QUIET_500_COPY.duplicatesStrip)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
