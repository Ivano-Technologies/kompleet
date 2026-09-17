import { createServerClient as createClient } from "@/lib/supabase/server";
import QRCode from "qrcode";

// ============================================
// QR Code Service (NRS-Compliant)
// ============================================

export interface QRCodePayload {
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  vat_amount: number;
  customer_name: string;
  signature_hash: string;
  verification_url: string;
}

/**
 * Generate NRS-compliant QR code payload
 */
export function generateQRPayload(invoice: any): string {
  const payload: QRCodePayload = {
    invoice_number: invoice.invoice_number,
    invoice_date: invoice.invoice_date,
    total_amount: invoice.total_amount,
    vat_amount: invoice.vat_amount,
    customer_name: invoice.customer_info.name,
    signature_hash: invoice.signature_hash || "",
    verification_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/verify`,
  };

  // Encode as JSON string for QR code
  return JSON.stringify(payload);
}

/**
 * Generate QR code image as Data URL
 */
export async function generateQRCodeImage(payload: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(payload, {
      width: 200,
      margin: 2,
      color: {
        dark: "#0A6847", // Nigerian green
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H", // High error correction for reliability
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify QR code payload
 */
export function verifyQRPayload(qrString: string): QRCodePayload | null {
  try {
    const payload = JSON.parse(qrString) as QRCodePayload;

    // Validate required fields
    if (
      !payload.invoice_number ||
      !payload.invoice_date ||
      payload.total_amount === undefined ||
      !payload.customer_name
    ) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Invalid QR payload:", error);
    return null;
  }
}

// ============================================
// Digital Signature Service (Web Crypto API)
// ============================================

/**
 * Generate RSA key pair for digital signatures
 * Keys are generated per user/organization
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  try {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["sign", "verify"],
    );

    // Export keys
    const publicKeyBuffer = await crypto.subtle.exportKey(
      "spki",
      keyPair.publicKey,
    );
    const privateKeyBuffer = await crypto.subtle.exportKey(
      "pkcs8",
      keyPair.privateKey,
    );

    // Convert to base64
    const publicKey = Buffer.from(publicKeyBuffer).toString("base64");
    const privateKey = Buffer.from(privateKeyBuffer).toString("base64");

    return { publicKey, privateKey };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw new Error("Failed to generate cryptographic keys");
  }
}

/**
 * Create invoice data hash for signing
 */
export function createInvoiceHash(invoice: any): string {
  // Create canonical string of invoice data
  const canonicalData = [
    invoice.invoice_number,
    invoice.invoice_date,
    invoice.customer_info.name,
    invoice.subtotal.toFixed(2),
    invoice.vat_amount.toFixed(2),
    invoice.total_amount.toFixed(2),
    JSON.stringify(invoice.line_items),
  ].join("|");

  // Create SHA-256 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalData);

  return Buffer.from(data).toString("base64");
}

/**
 * Sign invoice data with private key
 */
export async function signInvoice(
  invoiceData: any,
  privateKeyBase64: string,
): Promise<string> {
  try {
    // Import private key
    const privateKeyBuffer = Buffer.from(privateKeyBase64, "base64");
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyBuffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

    // Create invoice hash
    const invoiceHash = createInvoiceHash(invoiceData);
    const encoder = new TextEncoder();
    const data = encoder.encode(invoiceHash);

    // Sign the hash
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      privateKey,
      data,
    );

    // Convert to hex string
    const signatureHex = Buffer.from(signature).toString("hex");
    return signatureHex;
  } catch (error) {
    console.error("Error signing invoice:", error);
    throw new Error("Failed to sign invoice");
  }
}

/**
 * Verify invoice signature with public key
 */
export async function verifyInvoiceSignature(
  invoiceData: any,
  signatureHex: string,
  publicKeyBase64: string,
): Promise<boolean> {
  try {
    // Import public key
    const publicKeyBuffer = Buffer.from(publicKeyBase64, "base64");
    const publicKey = await crypto.subtle.importKey(
      "spki",
      publicKeyBuffer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["verify"],
    );

    // Create invoice hash
    const invoiceHash = createInvoiceHash(invoiceData);
    const encoder = new TextEncoder();
    const data = encoder.encode(invoiceHash);

    // Convert signature from hex to ArrayBuffer
    const signatureBuffer = Buffer.from(signatureHex, "hex");

    // Verify signature
    const isValid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signatureBuffer,
      data,
    );

    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

// ============================================
// Key Management Service
// ============================================

/**
 * Store a client's cryptographic keys via SECURITY DEFINER RPC.
 * Private keys are encrypted before storage. Direct table access is revoked.
 */
export async function storeClientKeys(
  clientId: string,
  publicKey: string,
  privateKey: string,
): Promise<void> {
  const supabase = await createClient();

  const encryptedPrivateKey = await encryptPrivateKey(privateKey);

  const { error } = await supabase.rpc("upsert_client_signing_keys", {
    p_client_id: clientId,
    p_public_key: publicKey,
    p_private_key_encrypted: encryptedPrivateKey,
    p_key_type: "RSA-2048",
  });

  if (error) {
    console.error("Error storing client keys:", error);
    throw new Error("Failed to store cryptographic keys");
  }
}

/**
 * Retrieve a client's keys via SECURITY DEFINER RPC.
 */
export async function getClientKeys(clientId: string): Promise<{
  publicKey: string;
  privateKey: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_client_signing_keys", {
    p_client_id: clientId,
  });

  if (error) {
    console.error("Error fetching client signing keys:", error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.private_key_encrypted) {
    return null;
  }

  const privateKey = await decryptPrivateKey(row.private_key_encrypted);

  return {
    publicKey: row.public_key,
    privateKey,
  };
}

/**
 * Encrypt private key using AES-256-GCM
 */
async function encryptPrivateKey(privateKey: string): Promise<string> {
  // Get master encryption key from environment
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error("Master encryption key not configured");
  }

  // Import master key
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive encryption key
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  // Encrypt private key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    encryptionKey,
    encoder.encode(privateKey),
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return Buffer.from(combined).toString("base64");
}

/**
 * Decrypt private key
 */
async function decryptPrivateKey(encryptedPrivateKey: string): Promise<string> {
  // Get master encryption key from environment
  const masterKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error("Master encryption key not configured");
  }

  // Decode encrypted data
  const combined = Buffer.from(encryptedPrivateKey, "base64");
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  // Import master key
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterKey),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  // Derive decryption key
  const decryptionKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    decryptionKey,
    encrypted,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================
// Invoice Signing Workflow
// ============================================

/**
 * Complete workflow to sign an invoice
 */
export async function signAndIssueInvoice(
  invoiceId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (fetchError || !invoice) {
    throw new Error("Invoice not found");
  }

  let keys = await getClientKeys(invoice.client_id);
  if (!keys) {
    keys = await generateKeyPair();
    await storeClientKeys(invoice.client_id, keys.publicKey, keys.privateKey);
  }

  const signatureHash = await signInvoice(invoice, keys.privateKey);

  const qrPayload = generateQRPayload({
    ...invoice,
    signature_hash: signatureHash,
  });

  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      signature_hash: signatureHash,
      qr_payload: qrPayload,
      status: "issued",
      issued_at: new Date().toISOString(),
      is_immutable: true,
    })
    .eq("id", invoiceId);

  if (updateError) {
    throw new Error("Failed to update invoice with signature");
  }

  await supabase.from("invoice_audit_logs").insert({
    invoice_id: invoiceId,
    client_id: invoice.client_id,
    user_id: userId,
    action: "signed_and_issued",
    metadata: {
      signature_algorithm: "RSASSA-PKCS1-v1_5",
      hash_algorithm: "SHA-256",
    },
  });
}

/**
 * Verify an invoice's digital signature
 */
export async function verifyInvoice(invoiceId: string): Promise<{
  isValid: boolean;
  invoice: any;
}> {
  const supabase = await createClient();

  // Fetch invoice
  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .single();

  if (error || !invoice) {
    throw new Error("Invoice not found");
  }

  if (!invoice.signature_hash) {
    return { isValid: false, invoice };
  }

  const keys = await getClientKeys(invoice.client_id);
  if (!keys) {
    return { isValid: false, invoice };
  }

  const isValid = await verifyInvoiceSignature(
    invoice,
    invoice.signature_hash,
    keys.publicKey,
  );

  await supabase.from("invoice_audit_logs").insert({
    invoice_id: invoiceId,
    client_id: invoice.client_id,
    user_id: invoice.user_id,
    action: "signature_verified",
    metadata: { result: isValid ? "valid" : "invalid" },
  });

  return { isValid, invoice };
}
