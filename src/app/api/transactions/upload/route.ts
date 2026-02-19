import { NextRequest, NextResponse } from 'next/server';
import { createServerClient as createClient } from '@/lib/supabase/server';
import { parseCSV, parseExcel, detectBankType, removeDuplicates, type ParsedTransaction } from '@/lib/parsers/bank-statement-parser';
import { categorizeTransaction, type Category } from '@/lib/services/categorization-service';
import { withRateLimit } from '@/lib/with-rate-limit';
import * as XLSX from 'xlsx';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for large files

interface UploadResponse {
  success: boolean;
  message: string;
  imported: number;
  duplicates: number;
  errors: number;
  transactions?: any[];
}

async function handlePOST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', imported: 0, duplicates: 0, errors: 0 },
        { status: 401 }
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bankType = (formData.get('bankType') as string) || 'generic';
    
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided', imported: 0, duplicates: 0, errors: 0 },
        { status: 400 }
      );
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File too large (max 10MB)', imported: 0, duplicates: 0, errors: 0 },
        { status: 400 }
      );
    }
    
    // Validate file type
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isPDF = fileName.endsWith('.pdf');
    
    if (!isCSV && !isExcel && !isPDF) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only CSV, Excel, and PDF files are supported', imported: 0, duplicates: 0, errors: 0 },
        { status: 400 }
      );
    }
    
    // Parse transactions based on file type
    let parsedTransactions: ParsedTransaction[];
    
    if (isCSV) {
      // Read CSV as text
      const fileContent = await file.text();
      const detectedBank = bankType === 'auto' ? detectBankType(fileContent) : bankType;
      parsedTransactions = parseCSV(fileContent, detectedBank as any);
    } else if (isExcel) {
      // Read Excel as binary
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const csvContent = XLSX.utils.sheet_to_csv(firstSheet);
      
      const detectedBank = bankType === 'auto' ? detectBankType(csvContent) : bankType;
      parsedTransactions = parseCSV(csvContent, detectedBank as any);
    } else if (isPDF) {
      // Read PDF as binary
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      const pdfText = pdfData.text;
      await parser.destroy();
      
      // Try to detect bank from PDF content
      const detectedBank = bankType === 'auto' ? detectBankType(pdfText) : bankType;
      
      // Convert PDF text to CSV-like format (this is a simple approach)
      // For better results, you may need bank-specific PDF parsers
      parsedTransactions = parseCSV(pdfText, detectedBank as any);
    } else {
      return NextResponse.json(
        { success: false, message: 'Unsupported file type', imported: 0, duplicates: 0, errors: 0 },
        { status: 400 }
      );
    }
    
    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid transactions found in file', imported: 0, duplicates: 0, errors: 0 },
        { status: 400 }
      );
    }
    
    // Remove duplicates within uploaded file
    const uniqueTransactions = removeDuplicates(parsedTransactions);
    const duplicatesInFile = parsedTransactions.length - uniqueTransactions.length;
    
    // Fetch categories for auto-categorization
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*');
    
    if (catError) {
      console.error('Error fetching categories:', catError);
    }
    
    const categoriesList: Category[] = categories || [];
    
    // Check for existing transactions to avoid duplicates
    const { data: existingTransactions } = await supabase
      .from('transactions')
      .select('transaction_date, description, amount, transaction_type')
      .eq('user_id', user.id);
    
    const existingSet = new Set(
      (existingTransactions || []).map(t => 
        `${t.transaction_date}-${t.description}-${t.amount}-${t.transaction_type}`
      )
    );
    
    // Filter out existing transactions
    const newTransactions = uniqueTransactions.filter(t => {
      const key = `${t.date.toISOString().split('T')[0]}-${t.description}-${t.amount}-${t.type}`;
      return !existingSet.has(key);
    });
    
    const duplicatesInDB = uniqueTransactions.length - newTransactions.length;
    
    if (newTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All transactions already exist in database',
        imported: 0,
        duplicates: duplicatesInFile + duplicatesInDB,
        errors: 0,
      });
    }
    
    // Prepare transactions for insertion with auto-categorization
    const transactionsToInsert = newTransactions.map(t => {
      const categorization = categorizeTransaction(t.description, categoriesList);
      
      return {
        user_id: user.id,
        transaction_date: t.date.toISOString().split('T')[0],
        description: t.description,
        amount: t.amount,
        transaction_type: t.type,
        balance: t.balance,
        reference: t.reference,
        category_id: categorization.categoryId,
        confidence_score: categorization.confidenceScore,
        source: `${bankType}_csv`,
        is_reconciled: false,
      };
    });
    
    // Insert transactions in batches (Supabase limit is 1000 per request)
    const batchSize = 1000;
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
      const batch = transactionsToInsert.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('transactions')
        .insert(batch)
        .select();
      
      if (error) {
        console.error('Error inserting batch:', error);
        errors += batch.length;
      } else {
        imported += data?.length || 0;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully imported ${imported} transactions`,
      imported,
      duplicates: duplicatesInFile + duplicatesInDB,
      errors,
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
        imported: 0,
        duplicates: 0,
        errors: 0,
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting (15 requests per minute for file upload operations)
export const POST = withRateLimit(handlePOST, { limit: 15 });
