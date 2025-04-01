export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    url: process.env.CLOUDINARY_URL || '',
  },
  api: {
    // Safely determine if we're in a browser and not on the server
    baseUrl: typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL 
      : '/api',
  },
}; 