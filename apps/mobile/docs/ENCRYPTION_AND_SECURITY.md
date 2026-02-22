# Encryption & Security (Sprint 1)

## In transit

- All API and Supabase traffic use **HTTPS (TLS)**. No change required.

## At rest (mobile)

- **Tokens & secrets**: Stored in **expo-secure-store** (platform keychain/Keystore). Used for:
  - Supabase session / refresh token (when Supabase Auth is wired)
  - NDPR consent cache key
- **Expense data**: Stored in **SQLite** (expo-sqlite) in app sandbox. No application-level encryption of the SQLite file in this sprint; the app sandbox is OS-protected.
- **Sensitive in SecureStore, expense data in SQLite**: This approach is documented so that future work can add SQLite encryption (e.g. SQLCipher or expo-sqlite with encryption) if required by policy or Play Store without changing the sync or domain logic.

## NDPR

- Consent for scanning and cloud sync is captured in the NDPR consent gate and stored in Supabase `ndpr_consents` and locally in SecureStore so the app does not rely on network to know if the user has consented.
