import OpenAI from 'openai';
import { config } from './config';

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

interface CalorieEstimationResult {
  calories: number;
  foodItems: {
    name: string;
    calories: number;
    portion: string;
  }[];
  confidence: number; // 0-1 scale
}

/**
 * Estimate calories directly from base64 image without using Cloudinary
 * @param base64Image Base64 encoded image data
 * @returns Estimated calories and food items
 */
export async function estimateCaloriesFromBase64(
  base64Image: string
): Promise<CalorieEstimationResult> {
  console.log('🧠 OpenAI: Starting direct image analysis');
  
  try {
    // Make sure the base64 image includes the data URI prefix
    const imageData = base64Image.startsWith('data:image/') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image.replace(/^data:image\/\w+;base64,/, '')}`;
    
    console.log('🧠 OpenAI: Sending image for analysis...');
    
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

    console.log('🧠 OpenAI: Analysis completed successfully');

    // Parse the response JSON
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const result = JSON.parse(content) as CalorieEstimationResult;
    return result;
  } catch (error) {
    console.error('🧠 OpenAI: Error analyzing image:', error);
    
    // Provide more specific error message based on error type
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.');
      } else if (error.message.includes('api key')) {
        throw new Error('OpenAI API key is invalid or missing. Please check your configuration.');
      } else if (error.message.includes('content policy')) {
        throw new Error('The image may not be appropriate for analysis. Please try a different food image.');
      }
    }
    
    throw error;
  }
}

/**
 * Estimate calories in a food image using OpenAI's vision capabilities
 * @param imageUrl URL of the food image
 * @returns Estimated calories and food items
 */
export async function estimateCaloriesFromImage(
  imageUrl: string
): Promise<CalorieEstimationResult> {
  try {
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
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    // Parse the response JSON
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    const result = JSON.parse(content) as CalorieEstimationResult;
    return result;
  } catch (error) {
    console.error('Error estimating calories:', error);
    throw error;
  }
} 