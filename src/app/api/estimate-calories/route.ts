import { NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadImage } from '@/lib/cloudinary';
import { estimateCaloriesFromImage } from '@/lib/openai';
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
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  return response;
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return corsHeaders(NextResponse.json({}, { status: 200 }));
}

// Create a timeout promise
function timeout(ms: number) {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
}

export async function POST(request: Request) {
  console.log('📝 API: Received request for calorie estimation');
  
  try {
    // Parse request body
    console.log('📝 API: Parsing request body');
    const body = await request.json();
    console.log('📝 API: Request body parsed');
    
    // Validate request body
    console.log('📝 API: Validating request body');
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('📝 API: Validation failed:', validationResult.error.message);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Invalid request: " + validationResult.error.message,
      } as ApiResponse<null>, { status: 400 }));
    }
    
    const { image } = validationResult.data;
    console.log('📝 API: Image data received, length:', image.length);
    
    // Check if image size is within limits
    // Base64 size is roughly 4/3 of binary size
    const estimatedBinarySize = Math.ceil(image.length * 0.75);
    if (estimatedBinarySize > MAX_IMAGE_SIZE) {
      console.error('📝 API: Image too large:', (estimatedBinarySize / (1024 * 1024)).toFixed(2), 'MB');
      return corsHeaders(NextResponse.json({
        success: false,
        error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
      } as ApiResponse<null>, { status: 413 }));
    }
    
    // Process with timeout
    try {
      const result = await Promise.race([
        processImageAndEstimateCalories(image),
        timeout(API_TIMEOUT)
      ]);
      
      return corsHeaders(NextResponse.json(result));
    } catch (timeoutError) {
      console.error('📝 API: Request timed out:', timeoutError);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Request timed out. This may be due to a slow connection or heavy server load.",
      } as ApiResponse<null>, { status: 408 }));
    }
  } catch (error) {
    console.error('📝 API: Error processing request:', error);
    
    return corsHeaders(NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse<null>, { status: 500 }));
  }
}

// Helper function to process the image and estimate calories
async function processImageAndEstimateCalories(imageData: string): Promise<ApiResponse<CalorieEstimation>> {
  console.log('📝 API: Processing image and estimating calories');
  
  try {
    // Upload image to Cloudinary
    console.log('📝 API: Uploading image to Cloudinary');
    const imageUrl = await uploadImage(imageData);
    console.log('📝 API: Image uploaded successfully:', imageUrl);
    
    // Estimate calories using OpenAI
    console.log('📝 API: Estimating calories with OpenAI');
    const estimationResult = await estimateCaloriesFromImage(imageUrl);
    console.log('📝 API: Calories estimated successfully:', estimationResult);
    
    // Prepare response
    return {
      success: true,
      data: {
        ...estimationResult,
        imageUrl,
      },
    };
  } catch (error) {
    console.error('📝 API: Error in processImageAndEstimateCalories:', error);
    
    if (error instanceof Error && error.message.includes('Cloudinary')) {
      throw new Error(`Image upload failed: ${error.message}`);
    } else if (error instanceof Error && error.message.includes('OpenAI')) {
      throw new Error(`AI analysis failed: ${error.message}`);
    }
    
    throw error;
  }
} 