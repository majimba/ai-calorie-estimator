import { NextResponse } from 'next/server';

// Helper function to add CORS headers
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-iOS-Client');
  
  // Prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return corsHeaders(response);
}

// Simple POST endpoint that doesn't use any external APIs
export async function POST(request: Request) {
  console.log('📱 iOS Test API: Received request');
  console.log('📱 iOS Test API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('📱 iOS Test API: Error parsing request JSON:', parseError);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Invalid JSON body - please check your connection and try again"
      }, { status: 400 }));
    }
    
    // Mock response data instead of calling OpenAI
    const mockResult = {
      calories: 450,
      foodItems: [
        {
          name: "Test Food Item",
          calories: 450,
          portion: "1 serving"
        }
      ],
      confidence: 0.8,
      imageUrl: "https://placehold.co/600x400?text=iOS+Test+Successful"
    };
    
    console.log('📱 iOS Test API: Sending mock response');
    
    return corsHeaders(NextResponse.json({
      success: true,
      data: mockResult
    }));
  } catch (error) {
    console.error('📱 iOS Test API: Unexpected error:', error);
    return corsHeaders(NextResponse.json({
      success: false,
      error: "iOS test endpoint encountered an error"
    }, { status: 500 }));
  }
} 