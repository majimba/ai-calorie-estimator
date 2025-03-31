import axios from 'axios';
import { config } from './config';
import { ApiResponse, CalorieEstimation, CalorieEstimationRequest } from './types';
import { ApiError, handleApiError } from './error';
import { debug } from './debug';

// Create API client with interceptors for debugging
const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    debug.network.request(config.url || '', config.method || 'unknown', config.data);
    return config;
  },
  (error) => {
    debug.network.error(error.config?.url || 'unknown', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    debug.network.response(
      response.config.url || '',
      response.status,
      response.data
    );
    return response;
  },
  (error) => {
    debug.network.error(error.config?.url || 'unknown', error);
    return Promise.reject(error);
  }
);

/**
 * Send an image for calorie estimation
 * @param base64Image Base64 encoded image data
 * @returns Calorie estimation results
 */
export async function estimateCalories(base64Image: string): Promise<CalorieEstimation> {
  try {
    debug.log('Preparing calorie estimation request');
    
    const requestData: CalorieEstimationRequest = {
      image: base64Image,
    };
    
    debug.log('Sending estimation request to API');
    
    const response = await api.post<ApiResponse<CalorieEstimation>>(
      '/estimate-calories',
      requestData
    );
    
    debug.log('Received estimation response');
    
    if (!response.data.success || !response.data.data) {
      debug.error('API reported error', response.data.error);
      throw new ApiError(response.data.error || 'Failed to estimate calories', response.status);
    }
    
    debug.log('Successfully estimated calories', {
      calories: response.data.data.calories,
      foodItems: response.data.data.foodItems.length
    });
    
    return response.data.data;
  } catch (error) {
    debug.error('Error estimating calories', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message || 'Network error';
      throw new ApiError(errorMessage, statusCode);
    }
    throw error;
  }
}

/**
 * Wrapped version of estimateCalories with error handling
 * @param base64Image Base64 encoded image data
 */
export function estimateCaloriesWithErrorHandling(base64Image: string) {
  debug.log('Starting calorie estimation with error handling');
  return handleApiError(() => estimateCalories(base64Image));
} 