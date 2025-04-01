import axios from 'axios';
import { config } from './config';
import { ApiResponse, CalorieEstimation, CalorieEstimationRequest } from './types';
import { ApiError, handleApiError } from './error';
import { debug } from './debug';

// Safe browser detection utilities
const isBrowser = typeof window !== 'undefined';
const getUserAgent = () => isBrowser ? navigator.userAgent : '';
const isMobileDevice = isBrowser && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(getUserAgent());
const isIOSDevice = isBrowser && /iPad|iPhone|iPod/.test(getUserAgent());

// Get the API base URL
const apiBaseUrl = (() => {
  // In browser environments
  if (isBrowser) {
    // Check if we're in production or development
    const isProduction = window.location.hostname !== 'localhost';
    
    // In production, always use relative URLs
    if (isProduction) {
      console.log('Running in production, using relative API URLs');
      return '/api';
    }
    
    // In development, use configured URL or fallback to relative path
    try {
      const configBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const isAbsoluteUrl = configBaseUrl.startsWith('http');
      
      if (isAbsoluteUrl) {
        return configBaseUrl;
      } else if (configBaseUrl) {
        // If it's a relative URL, use the current origin
        const origin = window.location.origin;
        console.log('Current origin:', origin);
        const baseUrl = `${origin}${configBaseUrl}`;
        console.log('Constructed API base URL:', baseUrl);
        return baseUrl;
      }
    } catch (error) {
      console.error('Error constructing API URL:', error);
    }
    
    // Fallback to a simple relative URL that works in most browsers
    return '/api';
  }
  // In server environments, use the config value
  return process.env.NEXT_PUBLIC_API_URL || '/api';
})();

// Create API client with interceptors for debugging
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    // iOS Safari needs explicitly set Accept header
    'Accept': 'application/json, text/plain, */*',
    // Add iOS specific header to help with identification
    ...(isIOSDevice ? { 'X-iOS-Client': 'true' } : {})
  },
  // Increase timeout for mobile networks - iOS devices may need even longer
  timeout: isIOSDevice ? 120000 : 90000, // 120 seconds for iOS, 90 for others
  // Explicitly handle CORS for iOS
  withCredentials: false,
  // Important for iOS: Don't cache requests
  params: isIOSDevice ? { _: Date.now() } : {}
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    debug.network.request(config.url || '', config.method || 'unknown', config.data);
    // Log full request URL for debugging
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`Making API request to: ${fullUrl}`);
    
    // Add additional URL verification for production debugging
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Check for suspicious URLs that might cause errors
      if (fullUrl.includes('localhost') && hostname !== 'localhost') {
        console.error(`⚠️ WARNING: Making request to localhost (${fullUrl}) from production hostname (${hostname})`);
      }
      if (fullUrl.includes('http:') && window.location.protocol === 'https:') {
        console.error(`⚠️ WARNING: Making insecure request (${fullUrl}) from secure context`);
      }
    }
    
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
    debug.network.response(response.config.url || '', response.status, response.data);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      debug.network.error(
        error.config?.url || 'unknown',
        `${error.response.status}: ${JSON.stringify(error.response.data)}`
      );
    } else {
      debug.network.error(error.config?.url || 'unknown', error);
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
  const MAX_RETRIES = 3;
  let attempt = 0;
  
  // Check for iOS specific browser
  const isIOSChrome = isIOSDevice && /CriOS/.test(getUserAgent());
  const isSafari = isBrowser && /Safari/.test(getUserAgent()) && !/Chrome/.test(getUserAgent());
  
  console.log(`Browser detection: iOS: ${isIOSDevice}, iOS Chrome: ${isIOSChrome}, Safari: ${isSafari}`);
  
  while (attempt <= MAX_RETRIES) {
    try {
      debug.log(`Attempt ${attempt + 1}/${MAX_RETRIES + 1}: Preparing calorie estimation request`);
      debug.log(`Using API base URL: ${apiBaseUrl}`);
      
      // Log if this is likely a mobile device
      console.log(`Request from mobile device: ${isMobileDevice}`);
      
      // Measure image data size in MB for debugging
      const imageSizeMB = (base64Image.length * 0.75) / (1024 * 1024);
      console.log(`Image data size: ${imageSizeMB.toFixed(2)} MB`);
      
      // For iOS devices, try the dedicated iOS endpoint first
      if (isIOSDevice) {
        try {
          console.log("iOS device detected, using dedicated mobile endpoint...");
          // Add a random query parameter to avoid caching issues on iOS
          const iOSCacheBuster = Date.now();
          const response = await api.post<ApiResponse<CalorieEstimation>>(
            `/mobile-estimate?_=${iOSCacheBuster}`,
            { image: base64Image },
            {
              // Explicitly set headers for iOS
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-iOS-Client': 'true',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
              },
              timeout: 180000, // 3 minutes
              withCredentials: false // Explicitly disable for CORS
            }
          );
          
          if (response.data.success && response.data.data) {
            return response.data.data;
          }
          throw new Error("iOS-specific endpoint failed");
        } catch (iosError) {
          console.log("iOS-specific endpoint failed, falling back to direct...", iosError);
        }
      }
      
      // Simplify approach - try both endpoints
      try {
        // First try the new direct endpoint
        console.log("Trying direct estimation endpoint...");
        const response = await api.post<ApiResponse<CalorieEstimation>>(
          '/direct-estimate',
          { image: base64Image }
        );
        
        if (response.data.success && response.data.data) {
          return response.data.data;
        }
        throw new Error("Direct estimation failed");
      } catch (directError) {
        console.log("Direct estimation failed, trying original endpoint...", directError);
        // Fall back to original endpoint
        const requestData: CalorieEstimationRequest = {
          image: base64Image,
        };
        
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
      }
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
        
        // Custom error message for iOS devices
        if (isIOSDevice) {
          if (error.code === 'ECONNABORTED') {
            throw new ApiError(`The request timed out. iOS devices sometimes take longer to process images. Please try with a smaller image or WiFi connection.`, 408);
          } else if (!error.response) {
            throw new ApiError('Could not connect to the server from your iOS device. This may be due to network restrictions or privacy settings. Try using WiFi and check your browser settings.', 0);
          }
        } 
        // Standard error messages for other devices
        else if (error.code === 'ECONNABORTED') {
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

/**
 * Test function for iOS devices that uses a simplified endpoint
 * @param base64Image Base64 encoded image data
 * @returns Mock calorie estimation results
 */
export async function testIosEndpoint(base64Image: string): Promise<CalorieEstimation> {
  console.log('Testing iOS-specific endpoint with direct API call');
  
  try {
    // Add random cache buster to avoid caching issues on iOS
    const cacheBuster = Date.now();
    const response = await api.post<ApiResponse<CalorieEstimation>>(
      `/ios-test?_=${cacheBuster}`,
      { image: base64Image },
      {
        // Explicitly set headers for iOS
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-iOS-Client': 'true',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        timeout: 30000, // 30 seconds should be enough for the test endpoint
        withCredentials: false // Explicitly disable for CORS
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new ApiError(response.data.error || 'iOS test endpoint returned error', response.status);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error in iOS test endpoint:', error);
    
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message || 'Network error in test endpoint';
      throw new ApiError(errorMessage, statusCode);
    }
    
    throw error;
  }
} 