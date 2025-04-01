import { NextResponse } from 'next/server';
import { estimateCaloriesFromBase64 } from '@/lib/openai';
import OpenAI from 'openai';
import { config } from '@/lib/config';

// Enhanced CORS headers for better iOS compatibility
function corsHeaders(response: NextResponse) {
  // More permissive CORS settings for iOS devices
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-iOS-Client');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  // Additional headers to prevent caching issues on iOS
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return corsHeaders(response);
}

export async function POST(request: Request) {
  console.log('📱 Mobile API: Received iOS estimation request');
  console.log('📱 Mobile API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  // Add CORS headers to all responses including errors
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('📱 Mobile API: Error parsing request JSON:', error);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Invalid JSON body - please check your connection and try again"
      }, { status: 400 }));
    }
    
    if (!body.image || typeof body.image !== 'string') {
      console.error('📱 Mobile API: Missing or invalid image data');
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Missing or invalid image data - the image may be corrupted"
      }, { status: 400 }));
    }
    
    console.log('📱 Mobile API: Processing image, size:', Math.round(body.image.length * 0.75 / 1024), 'KB');
    
    // Create a new OpenAI client for this specific request
    const openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    
    // Use a simple try-catch approach with no timeout dependencies
    try {
      // Ensure image is properly formatted
      let imageData = body.image;
      if (!imageData.startsWith('data:image/')) {
        imageData = `data:image/jpeg;base64,${imageData.replace(/^data:image\/\w+;base64,/, '')}`;
      }
      
      console.log('📱 Mobile API: Sending to OpenAI...');
      
      // Direct OpenAI API call without any middlewares/helpers
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nutritionist specialized in estimating calories in food from images. Provide accurate estimations of total calories and identify individual food items with their approximate calories."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this food image and estimate the calories. Return the data as JSON with the following structure: { calories: number, foodItems: [{ name: string, calories: number, portion: string }], confidence: number (0-1 scale) }" },
              { type: "image_url", image_url: { url: imageData } }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });
      
      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No content returned from OpenAI');
      }
      
      const result = JSON.parse(content);
      
      console.log('📱 Mobile API: Analysis successful');
      
      return corsHeaders(NextResponse.json({
        success: true,
        data: {
          ...result,
          imageUrl: "https://placehold.co/600x400?text=Mobile+Analysis+Complete",
        }
      }));
    } catch (error) {
      console.error('📱 Mobile API: Error in OpenAI processing:', error);
      return corsHeaders(NextResponse.json({
        success: false,
        error: error instanceof Error ? 
          `Image analysis failed: ${error.message}. Please try using WiFi or try again later.` : 
          "Unknown error during image analysis"
      }, { status: 500 }));
    }
  } catch (error) {
    console.error('📱 Mobile API: Unexpected error:', error);
    return corsHeaders(NextResponse.json({
      success: false,
      error: "Network connectivity issue. Please try switching to WiFi and ensure your browser allows camera access."
    }, { status: 500 }));
  }
} 