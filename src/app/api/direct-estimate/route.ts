import { NextResponse } from 'next/server';
import { z } from 'zod';
import { estimateCaloriesFromBase64 } from '@/lib/openai';
import { ApiResponse, CalorieEstimation } from '@/lib/types';

// Maximum image size in bytes (5MB)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// API request timeout (90 seconds)
const API_TIMEOUT = 90000;

// Extended timeout for mobile devices (3 minutes)
const MOBILE_TIMEOUT = 180000;

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
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-iOS-Client');
  response.headers.set('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  // Prevent caching issues on iOS
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 }); // Use 200 instead of 204 for iOS
  return corsHeaders(response);
}

// Create a timeout promise
function timeout(ms: number) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
}

export async function POST(request: Request) {
  console.log('📱 Direct API: Received direct estimation request');
  console.log('📱 Direct API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  const isIOSRequest = request.headers.get('user-agent')?.includes('iPhone') || 
                       request.headers.get('user-agent')?.includes('iPad');
                     
  if (isIOSRequest) {
    console.log('📱 Direct API: iOS device detected');
  }
  
  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('📱 Direct API: OPENAI_API_KEY environment variable is not set');
    return corsHeaders(NextResponse.json({
      success: false,
      error: "OpenAI API key not configured on the server"
    }, { status: 500 }));
  }
  
  console.log('📱 Direct API: OPENAI_API_KEY is set, length:', process.env.OPENAI_API_KEY.length);
  
  try {
    // Parse request body
    console.log('📱 Direct API: Parsing request body');
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('📱 Direct API: Error parsing JSON request body:', parseError);
      
      // Special handling for iOS parse errors (often caused by connectivity issues)
      if (isIOSRequest) {
        return corsHeaders(NextResponse.json({
          success: false,
          error: "Unable to read image data from your iOS device. Try using WiFi, check your browser privacy settings, or try a different browser like Safari.",
        } as ApiResponse<null>, { status: 400 }));
      }
      
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
      const isMobileRequest = isIOSRequest || 
                          request.headers.get('user-agent')?.includes('Android');
      const timeoutMs = isIOSRequest ? 150000 : 
                        isMobileRequest ? MOBILE_TIMEOUT : API_TIMEOUT;
      
      console.log(`📝 Direct API: Using timeout of ${timeoutMs}ms for ${isIOSRequest ? 'iOS' : isMobileRequest ? 'mobile' : 'desktop'} request`);
      
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
        error: "Request timed out. This may be due to a slow connection or heavy server load. Try with smaller images or WiFi. For mobile devices, try taking a picture with better lighting or using an existing image from your gallery.",
      } as ApiResponse<null>, { status: 408 }));
    }
  } catch (error) {
    console.error('📱 Direct API: Error processing request:', error);
    
    // Better iOS-specific error message
    if (isIOSRequest) {
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Network connectivity issue from your iOS device. Please try switching to WiFi, disabling any content blockers, or using Safari if you're currently using another browser.",
      } as ApiResponse<null>, { status: 500 }));
    }
    
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