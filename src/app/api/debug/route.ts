import { NextResponse } from 'next/server';

export async function GET() {
  // Never expose full API keys in response, just check if they exist
  const envStatus = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 
      `Set - length: ${process.env.OPENAI_API_KEY.length}, starts with: ${process.env.OPENAI_API_KEY.substring(0, 4)}...` : 
      'Not set',
    CLOUDINARY_URL: process.env.CLOUDINARY_URL ? 
      `Set - length: ${process.env.CLOUDINARY_URL.length}, contains cloudinary: ${process.env.CLOUDINARY_URL.includes('cloudinary')}` : 
      'Not set',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    REQUEST_TIME: new Date().toISOString(),
  };

  return NextResponse.json({
    message: 'Environment debug information',
    environment: process.env.NODE_ENV,
    info: envStatus,
  });
} 