/**
 * Outlook OAuth Integration
 * Handles Microsoft Graph API authentication and email fetching
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

// OAuth2 configuration
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || '';
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || '';
const OUTLOOK_TENANT_ID = process.env.OUTLOOK_TENANT_ID || 'common';
const OUTLOOK_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + '/api/email/callback/outlook';

// OAuth2 scopes
const SCOPES = [
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/offline_access'
];

/**
 * Generate authorization URL for Outlook OAuth
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: OUTLOOK_REDIRECT_URI,
    response_mode: 'query',
    scope: SCOPES.join(' '),
    state: state
  });
  
  return `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const tokenEndpoint = `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    client_secret: OUTLOOK_CLIENT_SECRET,
    code: code,
    redirect_uri: OUTLOOK_REDIRECT_URI,
    grant_type: 'authorization_code',
    scope: SCOPES.join(' ')
  });
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }
  
  const data = await response.json();
  
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + (data.expires_in * 1000)
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const tokenEndpoint = `https://login.microsoftonline.com/${OUTLOOK_TENANT_ID}/oauth2/v2.0/token`;
  
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    client_secret: OUTLOOK_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: SCOPES.join(' ')
  });
  
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }
  
  const data = await response.json();
  
  return {
    access_token: data.access_token,
    expiry_date: Date.now() + (data.expires_in * 1000)
  };
}

/**
 * Revoke Outlook access
 */
export async function revokeAccess(accessToken: string) {
  // Microsoft doesn't have a revoke endpoint, tokens expire naturally
  // User can revoke access from their Microsoft account settings
  console.log('Outlook token revocation: User should revoke from Microsoft account settings');
}

/**
 * Create Microsoft Graph client
 */
function createGraphClient(accessToken: string) {
  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

/**
 * Fetch emails from Outlook
 */
export async function fetchEmails(
  accessToken: string,
  options: {
    maxResults?: number;
    filter?: string;
    skipToken?: string;
  } = {}
) {
  const client = createGraphClient(accessToken);
  
  // Default filter for receipts and transactions
  const filter = options.filter || 
    "contains(subject, 'receipt') or contains(subject, 'invoice') or contains(subject, 'payment')";
  
  let request = client
    .api('/me/messages')
    .top(options.maxResults || 50)
    .filter(filter)
    .select('id,subject,from,receivedDateTime,body,bodyPreview')
    .orderby('receivedDateTime DESC');
  
  if (options.skipToken) {
    request = request.skipToken(options.skipToken);
  }
  
  const response = await request.get();
  
  return {
    messages: response.value || [],
    nextPageToken: response['@odata.nextLink'] ? 
      new URL(response['@odata.nextLink']).searchParams.get('$skiptoken') : 
      null
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
    const subject = message.subject || '';
    const body = message.bodyPreview || message.body?.content || '';
    const from = message.from?.emailAddress?.address || '';
    
    // Extract merchant from sender or subject
    let merchant = '';
    
    // Try to extract from sender email
    const domain = from.split('@')[1];
    if (domain) {
      merchant = domain.split('.')[0];
    } else {
      // Try to extract from subject
      const subjectWords = subject.split(' ').filter((w: string) => w.length > 3);
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
      /Paid:\s*₦?\s*([\d,]+(?:\.\d{2})?)/i
    ];
    
    let amount: number | undefined;
    const fullText = subject + ' ' + body;
    
    for (const pattern of amountPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const amountStr = match[1].replace(/,/g, '');
        amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          break;
        }
      }
    }
    
    // Extract date
    const date = message.receivedDateTime ? 
      new Date(message.receivedDateTime).toISOString() : 
      new Date().toISOString();
    
    // Only return if we found both merchant and amount
    if (merchant && amount) {
      return {
        merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
        amount,
        date,
        description: subject
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error parsing email:', error);
    return null;
  }
}

/**
 * Get user's email address
 */
export async function getUserEmail(accessToken: string): Promise<string> {
  const client = createGraphClient(accessToken);
  
  const user = await client.api('/me').select('mail,userPrincipalName').get();
  
  return user.mail || user.userPrincipalName;
}
