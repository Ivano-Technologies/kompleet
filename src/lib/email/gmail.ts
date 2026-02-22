/**
 * Gmail OAuth Integration
 * Handles Gmail API authentication and email fetching
 */

import { google } from "googleapis";

// OAuth2 configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REDIRECT_URI =
  process.env.NEXT_PUBLIC_APP_URL + "/api/email/callback/gmail";

// OAuth2 scopes
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels",
];

/**
 * Create OAuth2 client
 */
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    GMAIL_CLIENT_ID,
    GMAIL_CLIENT_SECRET,
    GMAIL_REDIRECT_URI,
  );
}

/**
 * Generate authorization URL for Gmail OAuth
 */
export function getAuthorizationUrl(state: string): string {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    state: state,
    prompt: "consent", // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    access_token: credentials.access_token!,
    expiry_date: credentials.expiry_date!,
  };
}

/**
 * Revoke Gmail access
 */
export async function revokeAccess(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  await oauth2Client.revokeCredentials();
}

/**
 * Fetch emails from Gmail
 */
export async function fetchEmails(
  accessToken: string,
  options: {
    maxResults?: number;
    query?: string;
    pageToken?: string;
  } = {},
) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Default query for receipts and transactions
  const query =
    options.query ||
    "subject:(receipt OR invoice OR payment) OR from:(*@shoprite.* OR *@jumia.* OR *@konga.*)";

  // List messages
  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: options.maxResults || 50,
    q: query,
    pageToken: options.pageToken,
  });

  if (!response.data.messages) {
    return {
      messages: [],
      nextPageToken: null,
    };
  }

  // Fetch full message details
  const messages = await Promise.all(
    response.data.messages.map(async (message) => {
      const fullMessage = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full",
      });

      return fullMessage.data;
    }),
  );

  return {
    messages,
    nextPageToken: response.data.nextPageToken || null,
  };
}

/**
 * Parse email message to extract transaction data
 */
export function parseEmailForTransaction(message: any): {
  merchant?: string;
  amount?: number;
  date?: string;
  description?: string;
} | null {
  try {
    // Get email body
    const payload = message.payload;
    let body = "";

    if (payload.body && payload.body.data) {
      body = Buffer.from(payload.body.data, "base64").toString("utf-8");
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === "text/plain" && part.body && part.body.data) {
          body += Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      }
    }

    // Get subject
    const subject =
      payload.headers.find((h: any) => h.name === "Subject")?.value || "";

    // Get sender
    const from =
      payload.headers.find((h: any) => h.name === "From")?.value || "";

    // Extract merchant from sender or subject
    let merchant = "";

    // Try to extract from sender email
    const senderMatch = from.match(/<(.+?)@(.+?)>/);
    if (senderMatch) {
      merchant = senderMatch[2].split(".")[0];
    } else {
      // Try to extract from subject
      const subjectWords = subject
        .split(" ")
        .filter((w: string) => w.length > 3);
      if (subjectWords.length > 0) {
        merchant = subjectWords[0];
      }
    }

    // Extract amount (Nigerian Naira patterns)
    const amountPatterns = [
      /₦\s*([\d,]+(?:\.\d{2})?)/,
      /NGN\s*([\d,]+(?:\.\d{2})?)/,
      /Naira\s*([\d,]+(?:\.\d{2})?)/,
      /Amount:\s*₦?\s*([\d,]+(?:\.\d{2})?)/i,
      /Total:\s*₦?\s*([\d,]+(?:\.\d{2})?)/i,
      /Paid:\s*₦?\s*([\d,]+(?:\.\d{2})?)/i,
    ];

    let amount: number | undefined;
    const fullText = subject + " " + body;

    for (const pattern of amountPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, "");
        amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          break;
        }
      }
    }

    // Extract date
    const dateHeader = payload.headers.find(
      (h: any) => h.name === "Date",
    )?.value;
    const date = dateHeader
      ? new Date(dateHeader).toISOString()
      : new Date().toISOString();

    // Only return if we found both merchant and amount
    if (merchant && amount) {
      return {
        merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
        amount,
        date,
        description: subject,
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing email:", error);
    return null;
  }
}

/**
 * Get user's email address
 */
export async function getUserEmail(accessToken: string): Promise<string> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const profile = await gmail.users.getProfile({
    userId: "me",
  });

  return profile.data.emailAddress!;
}
