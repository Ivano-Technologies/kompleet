/**
 * API endpoint for bank statement ingestion
 * POST /api/ingest
 *
 * Accepts:
 * - file: FormData file (PDF, Excel, CSV, ZIP)
 * - password: Optional password for encrypted files
 * - bankCode: Optional bank code for bank-specific parsing
 *
 * Returns:
 * - success: boolean
 * - transactionCount: number
 * - errors: array of parse errors
 * - message: string
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ingestStatement } from '@/lib/ingestion/ingestionWorker';
import { IngestionRequest } from '@/lib/ingestion/types';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string | null;
    const bankCode = formData.get('bankCode') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. Validate file size (100 MB max)
    const maxFileSize = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds 100 MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        },
        { status: 400 }
      );
    }

    // 4. Create source file record
    const sourceFileId = crypto.randomUUID();

    // 5. Run ingestion
    const ingestionRequest: IngestionRequest = {
      file,
      password: password || undefined,
      bankCode: bankCode || undefined,
    };

    const response = await ingestStatement(ingestionRequest, user.id, sourceFileId);

    // 6. Handle password requirement
    if (response.message === 'PASSWORD_REQUIRED') {
      return NextResponse.json(
        {
          success: false,
          message: 'This file is password-protected. Please provide the password.',
          requiresPassword: true,
        },
        { status: 400 }
      );
    }

    // 7. Return response
    return NextResponse.json(response);
  } catch (error) {
    console.error('Ingestion error:', error);

    return NextResponse.json(
      {
        success: false,
        message: `Ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [
          {
            rowNumber: 0,
            errorType: 'SERVER_ERROR',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
