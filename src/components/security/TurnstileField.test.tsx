import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TurnstileField } from "./TurnstileField";

describe("TurnstileField", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const { container } = render(<TurnstileField action="signin" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("turnstile-field")).toBeNull();
  });

  it("shows the captcha host when the site key is set", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    render(<TurnstileField action="contact" />);
    const field = screen.getByTestId("turnstile-field");
    expect(field).toBeInTheDocument();
    expect(field).toHaveAttribute("data-turnstile-action", "contact");
  });
});
