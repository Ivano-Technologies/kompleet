import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const useQuery = vi.fn();
const startEnrollment = vi.fn();
const confirmEnrollment = vi.fn();
const disableMine = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => useQuery(...args),
  useMutation: () => {
    const fn = vi.fn();
    return fn;
  },
}));

vi.mock("@/lib/convex/browser", () => ({
  api: {
    totp: {
      getMine: "totp.getMine",
      startEnrollment: "totp.startEnrollment",
      confirmEnrollment: "totp.confirmEnrollment",
      disableMine: "totp.disableMine",
    },
  },
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,qq") },
}));

import { TotpEnrollCard } from "./TotpEnrollCard";

describe("TotpEnrollCard", () => {
  afterEach(() => {
    cleanup();
    useQuery.mockReset();
    startEnrollment.mockReset();
    confirmEnrollment.mockReset();
    disableMine.mockReset();
  });

  it("renders nothing when the encryption key is not configured", () => {
    useQuery.mockReturnValue({
      available: false,
      enabled: false,
      pending: false,
    });
    const { container } = render(<TotpEnrollCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows enable when 2FA is available and off", () => {
    useQuery.mockReturnValue({
      available: true,
      enabled: false,
      pending: false,
    });
    render(<TotpEnrollCard />);
    expect(screen.getByTestId("totp-enroll-card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable" })).toBeInTheDocument();
  });
});
