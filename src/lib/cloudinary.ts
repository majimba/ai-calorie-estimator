import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

// Define the upload response interface
interface UploadApiResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
  url: string;
  [key: string]: any;
}

// Print Cloudinary config for debugging (redacting secrets)
const printConfig = () => {
  const config = cloudinary.config();
  
  // If api_key is missing or api_secret is missing, that indicates a configuration issue
  if (!config.api_key || !config.api_secret || !config.cloud_name) {
    console.error('❌ CLOUDINARY CONFIG ERROR: Missing required configuration.');
    console.error(`Cloud name: ${config.cloud_name ? 'Set ✅' : 'MISSING ❌'}`);
    console.error(`API Key: ${config.api_key ? 'Set ✅' : 'MISSING ❌'}`);
    console.error(`API Secret: ${config.api_secret ? 'Set ✅' : 'MISSING ❌'}`);
    
    // Add warning about cloud_name format which is a common error
    if (config.cloud_name && (config.cloud_name.includes('@') || config.cloud_name.includes(':'))) {
      console.error('❌ CLOUD_NAME FORMAT ERROR: Your cloud_name contains @ or : symbols.');
      console.error('   This likely means the CLOUDINARY_URL format is incorrect.');
      console.error('   It should be: cloudinary://API_KEY:API_SECRET@CLOUD_NAME');
    }
    
    console.error('Environment variables:');
    if (typeof process !== 'undefined') {
      console.error(`CLOUDINARY_URL: ${process.env.CLOUDINARY_URL ? 'Set (value hidden)' : 'MISSING'}`);
    }
  } else {
    console.log('✅ Cloudinary configuration is valid');
    console.log(`   Cloud name: ${config.cloud_name}`);
    console.log(`   API Key: ${config.api_key.substring(0, 4)}...`);
    console.log(`   API Secret: ${config.api_secret.substring(0, 4)}...`);
  }
};

// Setup Cloudinary configuration
// This should use the CLOUDINARY_URL environment variable automatically
cloudinary.config({
  secure: true,
});

// Log configuration
console.log('🌩️ Checking Cloudinary configuration...');
printConfig();

/**
 * Upload an image to Cloudinary
 * @param base64Image Base64 encoded image data
 * @returns URL of the uploaded image
 */
export async function uploadImage(base64Image: string): Promise<string> {
  console.log('🌩️ Cloudinary: Starting image upload process');
  
  // Validate configuration before attempting upload
  const config = cloudinary.config();
  if (!config.api_key || !config.api_secret || !config.cloud_name) {
    throw new Error('Cloudinary is not properly configured. Check CLOUDINARY_URL environment variable.');
  }
  
  // Calculate approximate size
  const dataSize = (base64Image.length * 0.75) / (1024 * 1024);
  console.log(`🌩️ Cloudinary: Uploading image, approximate size: ${dataSize.toFixed(2)}MB`);
  
  try {
    // Set a reasonable timeout for uploading to Cloudinary
    const uploadTimeout = 30000; // 30 seconds
    
    // Create a promise that will reject after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Cloudinary upload timed out after 30 seconds')), uploadTimeout);
    });
    
    // The actual upload function
    const uploadPromise = new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Image, 
        {
          resource_type: 'image',
          // Use eager transformation to create a smaller version for faster analysis
          transformation: [
            { width: 800, crop: 'limit' },
            { quality: 'auto:low' }
          ],
          folder: 'ai-calorie-estimator',
        },
        (error, result) => {
          if (error) {
            console.error('🌩️ Cloudinary: Upload error:', error);
            reject(new Error(`Cloudinary upload error: ${error.message}`));
          } else if (result) {
            console.log('🌩️ Cloudinary: Upload successful:', result.secure_url);
            resolve(result.secure_url);
          } else {
            reject(new Error('Cloudinary upload failed with unknown error'));
          }
        }
      );
    });
    
    // Race between the upload and the timeout
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result as string;
  } catch (error) {
    console.error('🌩️ Cloudinary: Error during upload process:', error);
    
    // Check for network-related errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Network') || errorMessage.includes('timeout') || errorMessage.includes('ENOTFOUND')) {
      throw new Error(`Cloudinary network error: The server had trouble connecting to Cloudinary. This may be due to network connectivity issues.`);
    }
    
    // Check for authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('key') || errorMessage.includes('credentials')) {
      throw new Error(`Cloudinary configuration error: Server authentication failed. Please check the CLOUDINARY_URL environment variable.`);
    }
    
    throw new Error(`Cloudinary error: ${errorMessage}`);
  }
} 