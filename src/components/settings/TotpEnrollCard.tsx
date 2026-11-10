"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import QRCode from "qrcode";
import { Loader2, Shield } from "lucide-react";
import { api } from "@/lib/convex/browser";
import {
  TOTP_INVALID_MESSAGE,
  isTotpInvalidError,
} from "@/lib/auth/totp-sign-in";
import { toFriendlyError } from "@/lib/friendly-error";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-lg border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary placeholder-light-text-tertiary dark:placeholder-dark-text-tertiary focus:outline-none focus:border-primary-500 transition-colors";

type EnrollPayload = {
  otpauthUri: string;
  secret: string;
  recoveryCodes: string[];
};

export function TotpEnrollCard() {
  const status = useQuery(api.totp.getMine);
  const startEnrollment = useMutation(api.totp.startEnrollment);
  const confirmEnrollment = useMutation(api.totp.confirmEnrollment);
  const disableMine = useMutation(api.totp.disableMine);

  const [enroll, setEnroll] = useState<EnrollPayload | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!enroll) {
      setQr(null);
      return;
    }
    let cancelled = false;
    void QRCode.toDataURL(enroll.otpauthUri, {
      width: 192,
      margin: 1,
      errorCorrectionLevel: "M",
    }).then((url) => {
      if (!cancelled) setQr(url);
    });
    return () => {
      cancelled = true;
    };
  }, [enroll]);

  if (status === undefined || status.available === false) {
    return null;
  }

  const handleStart = async () => {
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const payload = await startEnrollment({});
      setEnroll(payload);
      setCode("");
    } catch (err) {
      const { message } = toFriendlyError(err, "Couldn't start authenticator setup.");
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setError("");
    setBusy(true);
    try {
      await confirmEnrollment({ code: code.trim() });
      setEnroll(null);
      setCode("");
      setSuccess("Two-factor authentication is on.");
    } catch (err) {
      setError(
        isTotpInvalidError(err)
          ? TOTP_INVALID_MESSAGE
          : toFriendlyError(err, TOTP_INVALID_MESSAGE).message,
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setError("");
    setBusy(true);
    try {
      await disableMine({
        totpCode: /^\d{6}$/.test(code.trim()) ? code.trim() : undefined,
        recoveryCode: /^\d{6}$/.test(code.trim()) ? undefined : code.trim() || undefined,
      });
      setCode("");
      setSuccess("Two-factor authentication is off.");
    } catch (err) {
      setError(
        isTotpInvalidError(err)
          ? TOTP_INVALID_MESSAGE
          : toFriendlyError(err, TOTP_INVALID_MESSAGE).message,
      );
    } finally {
      setBusy(false);
    }
  };

  const downloadCodes = () => {
    if (!enroll) return;
    const blob = new Blob([enroll.recoveryCodes.join("\n") + "\n"], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kompleet-recovery-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-testid="totp-enroll-card"
      className="p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-background dark:bg-dark-background"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 text-accent shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
              Authenticator app
            </h3>
            <p className="text-xs text-light-text-tertiary dark:text-dark-text-tertiary">
              {status.enabled
                ? "A second step is required when you sign in."
                : "Optional. Scan a QR code with an authenticator app."}
            </p>
          </div>
        </div>
        {!status.enabled && !enroll ? (
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={busy}
            className="btn-secondary text-xs px-3 py-1.5 shrink-0 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enable"}
          </button>
        ) : null}
      </div>

      {success ? (
        <p className="text-xs text-accent mt-3">{success}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400 mt-3">{error}</p>
      ) : null}

      {enroll ? (
        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border space-y-3">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="Authenticator QR code"
              width={192}
              height={192}
              className="mx-auto rounded-md bg-white p-2"
              data-testid="totp-qr"
            />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
          <p className="text-xs text-center font-mono break-all text-light-text-secondary dark:text-dark-text-secondary">
            {enroll.secret}
          </p>
          <div>
            <p className="text-xs font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
              Recovery codes (save these now)
            </p>
            <ul
              data-testid="totp-recovery-codes"
              className="grid grid-cols-2 gap-1 font-mono text-xs text-light-text-secondary dark:text-dark-text-secondary"
            >
              {enroll.recoveryCodes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={downloadCodes}
              className="mt-2 text-xs font-medium text-primary-600 dark:text-teal-400 underline"
            >
              Download codes
            </button>
          </div>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            className={inputCls}
            aria-label="Authenticator code"
          />
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || code.trim().length < 6}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Confirm and turn on
          </button>
        </div>
      ) : null}

      {status.enabled ? (
        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border space-y-3">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Authenticator or recovery code"
            className={inputCls}
            aria-label="Code to turn off two-factor authentication"
          />
          <button
            type="button"
            onClick={() => void handleDisable()}
            disabled={busy || !code.trim()}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : null}{" "}
            Turn off
          </button>
        </div>
      ) : null}
    </div>
  );
}
