import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/with-rate-limit';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

async function handlePOST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.merchant || body.amount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: merchant, amount' },
        { status: 400 }
      );
    }
    
    // Call ML inference service
    const response = await fetch(`${ML_SERVICE_URL}/categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant: body.merchant,
        amount: body.amount,
        channel: body.channel,
        timestamp: body.timestamp || new Date().toISOString(),
        user_id: body.user_id
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
    
    // Log inference for monitoring
    console.log('[ML Categorization]', {
      merchant: body.merchant,
      predicted: result.category,
      confidence: result.confidence,
      inference_id: result.inference_id
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[ML Categorization Error]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Apply rate limiting (30 requests per minute for expensive AI operations)
export const POST = withRateLimit(handlePOST, { limit: 30 });

async function handleGET() {
  try {
    // Health check - ping ML service
    const response = await fetch(`${ML_SERVICE_URL}/health`);
    const health = await response.json();

    return NextResponse.json({
      status: 'operational',
      ml_service: health,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: 'degraded',
        error: 'ML service unavailable',
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}

export const GET = withRateLimit(handleGET, { limit: 120 });
