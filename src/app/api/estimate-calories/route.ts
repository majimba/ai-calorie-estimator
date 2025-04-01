import { NextResponse } from 'next/server';
import { z } from 'zod';
import { uploadImage } from '@/lib/cloudinary';
import { estimateCaloriesFromImage } from '@/lib/openai';
import { ApiResponse, CalorieEstimation } from '@/lib/types';

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
    
    // Upload image to Cloudinary
    console.log('📝 API: Uploading image to Cloudinary');
    try {
      const imageUrl = await uploadImage(image);
      console.log('📝 API: Image uploaded successfully:', imageUrl);
      
      // Estimate calories using OpenAI
      console.log('📝 API: Estimating calories with OpenAI');
      try {
        const estimationResult = await estimateCaloriesFromImage(imageUrl);
        console.log('📝 API: Calories estimated successfully:', estimationResult);
        
        // Prepare response
        const response: ApiResponse<CalorieEstimation> = {
          success: true,
          data: {
            ...estimationResult,
            imageUrl,
          },
        };
        
        return corsHeaders(NextResponse.json(response));
      } catch (openaiError) {
        console.error('📝 API: OpenAI error:', openaiError);
        throw new Error(`OpenAI error: ${openaiError instanceof Error ? openaiError.message : String(openaiError)}`);
      }
    } catch (cloudinaryError) {
      console.error('📝 API: Cloudinary error:', cloudinaryError);
      throw new Error(`Cloudinary error: ${cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)}`);
    }
  } catch (error) {
    console.error('📝 API: Error processing request:', error);
    
    return corsHeaders(NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ApiResponse<null>, { status: 500 }));
  }
} 