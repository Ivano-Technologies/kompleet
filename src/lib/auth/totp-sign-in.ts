import {
  TOTP_INVALID,
  TOTP_INVALID_MESSAGE,
  TOTP_REQUIRED_MESSAGE,
  TWO_FACTOR_REQUIRED,
} from "../../../convex/lib/totp";
import { stripErrorWrappers } from "@/lib/friendly-error";

export {
  TOTP_INVALID,
  TOTP_INVALID_MESSAGE,
  TOTP_REQUIRED_MESSAGE,
  TWO_FACTOR_REQUIRED,
};

function errorText(err: unknown): string {
  if (err && typeof err === "object" && "data" in err) {
    const data = (err as { data?: unknown }).data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const rec = data as { code?: unknown; message?: unknown };
      if (typeof rec.code === "string") return rec.code;
      if (typeof rec.message === "string") return rec.message;
    }
  }
  if (err instanceof Error) return stripErrorWrappers(err.message);
  return stripErrorWrappers(String(err ?? ""));
}

export function isTwoFactorRequiredError(err: unknown): boolean {
  const text = errorText(err);
  return (
    text === TWO_FACTOR_REQUIRED ||
    text === TOTP_REQUIRED_MESSAGE ||
    /TWO_FACTOR_REQUIRED/.test(text)
  );
}

export function isTotpInvalidError(err: unknown): boolean {
  const text = errorText(err);
  return (
    text === TOTP_INVALID ||
    text === TOTP_INVALID_MESSAGE ||
    /TOTP_INVALID/.test(text)
  );
}

export function secondFactorArgs(secondFactor: string | undefined): {
  totpCode?: string;
  recoveryCode?: string;
} {
  const extra = secondFactor?.trim() ?? "";
  if (!extra) return {};
  const digits = extra.replace(/\s/g, "");
  if (/^\d{6}$/.test(digits)) {
    return { totpCode: digits };
  }
  return { recoveryCode: extra };
}
