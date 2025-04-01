import axios from 'axios';
import { config } from './config';
import { ApiResponse, CalorieEstimation, CalorieEstimationRequest } from './types';
import { ApiError, handleApiError } from './error';
import { debug } from './debug';

// Get the API base URL
const apiBaseUrl = (() => {
  // In browser environments
  if (typeof window !== 'undefined') {
    const isAbsoluteUrl = config.api.baseUrl.startsWith('http');
    if (isAbsoluteUrl) {
      return config.api.baseUrl;
    } else {
      // If it's a relative URL, use the current origin
      const origin = window.location.origin;
      console.log('Current origin:', origin);
      const baseUrl = `${origin}${config.api.baseUrl}`;
      console.log('Constructed API base URL:', baseUrl);
      return baseUrl;
    }
  }
  // In server environments, use the config value
  return config.api.baseUrl;
})();

// Create API client with interceptors for debugging
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  // Increase timeout for mobile networks
  timeout: 60000, // 60 seconds
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    debug.network.request(config.url || '', config.method || 'unknown', config.data);
    // Log full request URL for debugging
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`Making request to: ${fullUrl}`);
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
    // Log more details for mobile debugging
    if (axios.isAxiosError(error)) {
      console.error('Request failed:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data,
      });
    }
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
    debug.log(`Using API base URL: ${apiBaseUrl}`);
    
    // Trim the base64 image if it's very large to log it safely
    const logLength = Math.min(base64Image.length, 100);
    console.log(`Image data length: ${base64Image.length}, preview: ${base64Image.substring(0, logLength)}...`);
    
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
      
      // Provide more helpful error message for common issues
      if (error.code === 'ECONNABORTED') {
        throw new ApiError('The request timed out. Please check your internet connection and try again.', 408);
      } else if (!error.response) {
        throw new ApiError('Could not connect to the server. Please check your internet connection and try again.', 0);
      }
      
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