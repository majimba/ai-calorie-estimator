import { v2 as cloudinary } from 'cloudinary';
import { config } from './config';

// Configure Cloudinary with URL or individual credentials
if (process.env.CLOUDINARY_URL) {
  // If CLOUDINARY_URL is provided, use that (it contains all credentials)
  const url = process.env.CLOUDINARY_URL;
  // Format is cloudinary://api_key:api_secret@cloud_name
  const matches = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  
  if (matches && matches.length === 4) {
    const [, apiKey, apiSecret, cloudName] = matches;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  } else {
    console.error('Invalid CLOUDINARY_URL format');
    // Fallback to individual credentials
    cloudinary.config({
      cloud_name: config.cloudinary.cloudName,
      api_key: config.cloudinary.apiKey,
      api_secret: config.cloudinary.apiSecret,
    });
  }
} else {
  // Otherwise, use individual credentials
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

/**
 * Upload a base64 image to Cloudinary
 * @param base64Image Base64 encoded image data
 * @returns URL of the uploaded image
 */
export async function uploadImage(base64Image: string): Promise<string> {
  try {
    // Remove the data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    const result = await new Promise<cloudinary.UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload(
        `data:image/jpeg;base64,${base64Data}`,
        {
          folder: 'calorie-estimator',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as cloudinary.UploadApiResponse);
          }
        }
      );
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
} 