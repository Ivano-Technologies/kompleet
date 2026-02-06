import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const htmlContent = fs.readFileSync(
    path.join(process.cwd(), 'public', 'kompleet.html'),
    'utf-8'
  );
  
  return new NextResponse(htmlContent, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
