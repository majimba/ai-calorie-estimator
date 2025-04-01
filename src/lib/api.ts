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
  const MAX_RETRIES = 2;
  let attempt = 0;
  
  while (attempt <= MAX_RETRIES) {
    try {
      debug.log(`Attempt ${attempt + 1}/${MAX_RETRIES + 1}: Preparing calorie estimation request`);
      debug.log(`Using API base URL: ${apiBaseUrl}`);
      
      // Log if this is likely a mobile device
      const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log(`Request from mobile device: ${isMobile}`);
      
      // Measure image data size in MB for debugging
      const imageSizeMB = (base64Image.length * 0.75) / (1024 * 1024);
      console.log(`Image data size: ${imageSizeMB.toFixed(2)} MB`);
      
      // Log important network info for debugging
      if (typeof window !== 'undefined') {
        const connection = (navigator as any).connection;
        if (connection) {
          console.log('Network info:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
          });
        }
      }
      
      const requestData: CalorieEstimationRequest = {
        image: base64Image,
      };
      
      debug.log(`Sending estimation request to API (attempt ${attempt + 1})`);
      
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
      debug.error(`Error estimating calories (attempt ${attempt + 1})`, error);
      
      // Only retry network connectivity issues, not server errors
      if (axios.isAxiosError(error) && (!error.response || error.code === 'ECONNABORTED')) {
        if (attempt < MAX_RETRIES) {
          attempt++;
          const delay = attempt * 2000; // Exponential backoff
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.error || error.message || 'Network error';
        
        // More detailed error message based on specific error
        if (error.code === 'ECONNABORTED') {
          throw new ApiError(`The request timed out after ${api.defaults.timeout}ms. This may be due to a slow mobile connection or a large image file.`, 408);
        } else if (!error.response) {
          throw new ApiError('Could not connect to the server. This may be due to a weak mobile signal or network issues. Please try again on WiFi if possible.', 0);
        }
        
        throw new ApiError(errorMessage, statusCode);
      }
      
      throw error;
    }
  }
  
  // This should never be reached due to the error handling above, but TypeScript requires a return
  throw new ApiError('Maximum retry attempts exceeded', 0);
}

/**
 * Wrapped version of estimateCalories with error handling
 * @param base64Image Base64 encoded image data
 */
export function estimateCaloriesWithErrorHandling(base64Image: string) {
  debug.log('Starting calorie estimation with error handling');
  return handleApiError(() => estimateCalories(base64Image));
} 