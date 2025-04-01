import { NextResponse } from 'next/server';

// This is a public debug endpoint that doesn't require authentication
export async function GET() {
  // Safely check environment variables without exposing sensitive data
  const envStatus = {
    OPENAI_API_KEY: typeof process.env.OPENAI_API_KEY === 'string' ? 
      `Present (${process.env.OPENAI_API_KEY.substring(0, 3)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 3)})` : 
      'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'Not set',
    SERVER_TIME: new Date().toISOString(),
  };

  return NextResponse.json({
    message: 'Public debug information',
    environment: process.env.NODE_ENV,
    env_status: envStatus,
  });
} 