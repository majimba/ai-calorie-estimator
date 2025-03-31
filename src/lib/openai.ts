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