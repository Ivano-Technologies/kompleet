import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TotpChallengeField } from "./TotpChallengeField";

describe("TotpChallengeField", () => {
  it("renders the authenticator input", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TotpChallengeField value="" onChange={onChange} />);
    const input = screen.getByLabelText("Authenticator code");
    expect(screen.getByTestId("totp-challenge")).toBeInTheDocument();
    await user.type(input, "123456");
    expect(onChange).toHaveBeenCalled();
  });
});
