"use client";

import { AUTH_INPUT, AUTH_LABEL } from "@/components/layout/auth-density";

export function TotpChallengeField({
  value,
  onChange,
  autoFocus,
  id = "totp-challenge",
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  id?: string;
}) {
  return (
    <div data-testid="totp-challenge">
      <label htmlFor={id} className={AUTH_LABEL}>
        Authenticator code
      </label>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="6-digit code or recovery code"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={AUTH_INPUT}
        autoFocus={autoFocus}
      />
    </div>
  );
}
