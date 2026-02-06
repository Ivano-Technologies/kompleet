import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.transactions || !Array.isArray(body.transactions)) {
      return NextResponse.json(
        { error: 'Missing or invalid transactions array' },
        { status: 400 }
      );
    }
    
    // Validate each transaction
    for (const txn of body.transactions) {
      if (!txn.merchant || txn.amount === undefined) {
        return NextResponse.json(
          { error: 'Each transaction must have merchant and amount' },
          { status: 400 }
        );
      }
    }
    
    // Call ML inference service
    const response = await fetch(`${ML_SERVICE_URL}/batch-categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions: body.transactions.map((txn: any) => ({
          merchant: txn.merchant,
          amount: txn.amount,
          channel: txn.channel,
          timestamp: txn.timestamp || new Date().toISOString(),
          user_id: txn.user_id
        }))
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'ML service error' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    
    // Log batch inference for monitoring
    console.log('[ML Batch Categorization]', {
      count: result.count,
      model_version: result.model_version,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[ML Batch Categorization Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
