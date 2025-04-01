import { NextResponse } from 'next/server';
import { z } from 'zod';
import { estimateCaloriesFromBase64 } from '@/lib/openai';
import { ApiResponse, CalorieEstimation } from '@/lib/types';

// Maximum image size in bytes (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// API request timeout (90 seconds)
const API_TIMEOUT = 90000;

// Validate request body
const requestSchema = z.object({
  image: z.string().min(1, "Image is required"),
});

// Helper function to add CORS headers
function corsHeaders(response: NextResponse) {
  // iOS browsers are particularly sensitive to CORS headers
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', '*');
  response.headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 }); // Use 204 No Content
  return corsHeaders(response);
}

// Create a timeout promise
function timeout(ms: number) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
}

export async function POST(request: Request) {
  console.log('📝 Direct API: Received direct estimation request');
  console.log('📝 Direct API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Parse request body
    console.log('📝 Direct API: Parsing request body');
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('📝 Direct API: Error parsing JSON request body:', parseError);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Invalid JSON in request body. Make sure the Content-Type is application/json.",
      } as ApiResponse<null>, { status: 400 }));
    }
    console.log('📝 Direct API: Request body parsed');
    
    // Validate request body
    console.log('📝 Direct API: Validating request body');
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('📝 Direct API: Validation failed:', validationResult.error.message);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Invalid request: " + validationResult.error.message,
      } as ApiResponse<null>, { status: 400 }));
    }
    
    const { image } = validationResult.data;
    console.log('📝 Direct API: Image data received, length:', image.length);
    
    // Check if image size is within limits
    // Base64 size is roughly 4/3 of binary size
    const estimatedBinarySize = Math.ceil(image.length * 0.75);
    if (estimatedBinarySize > MAX_IMAGE_SIZE) {
      console.error('📝 Direct API: Image too large:', (estimatedBinarySize / (1024 * 1024)).toFixed(2), 'MB');
      return corsHeaders(NextResponse.json({
        success: false,
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
      } as ApiResponse<null>, { status: 413 }));
    }
    
    // Process with timeout
    try {
      console.log('📝 Direct API: Sending image directly to OpenAI');
      
      // iOS/Safari needs reliable timeouts so use a longer one
      const isIOSRequest = request.headers.get('user-agent')?.includes('iPhone') || 
                          request.headers.get('user-agent')?.includes('iPad');
      const timeoutMs = isIOSRequest ? 150000 : API_TIMEOUT; // 2.5 minutes for iOS
      
      console.log(`📝 Direct API: Using timeout of ${timeoutMs}ms`);
      
      // Race between processing and timeout
      const result = await Promise.race([
        processDirectEstimation(image),
        timeout(timeoutMs)
      ]);
      
      console.log('📝 Direct API: Processing completed successfully');
      return corsHeaders(NextResponse.json(result));
    } catch (timeoutError) {
      console.error('📝 Direct API: Request timed out:', timeoutError);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Request timed out. This may be due to a slow connection or heavy server load. Try with smaller images or WiFi.",
      } as ApiResponse<null>, { status: 408 }));
    }
  } catch (error) {
    console.error('📝 Direct API: Error processing request:', error);
    
    return corsHeaders(NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse<null>, { status: 500 }));
  }
}

// Helper function to estimate calories directly from the image data
async function processDirectEstimation(imageData: string): Promise<ApiResponse<CalorieEstimation>> {
  console.log('📝 Direct API: Starting direct estimation');
  
  try {
    // Send directly to OpenAI
    console.log('📝 Direct API: Analyzing image with OpenAI');
    const estimationResult = await estimateCaloriesFromBase64(imageData);
    console.log('📝 Direct API: Calories estimated successfully:', estimationResult);
    
    // Use a placeholder URL for the response since we didn't upload to Cloudinary
    const placeholderImageUrl = "https://placehold.co/600x400?text=Image+Analyzed+Directly";
    
    // Prepare response
    return {
      success: true,
      data: {
        ...estimationResult,
        imageUrl: placeholderImageUrl,
      },
    };
  } catch (error) {
    console.error('📝 Direct API: Error in direct estimation:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI')) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
    
    throw error;
  }
} 