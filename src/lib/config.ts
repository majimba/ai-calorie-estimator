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
    // In production environments, always use a relative URL
    baseUrl: typeof window !== 'undefined' && window.location.hostname !== 'localhost'
      ? '/api'
      : process.env.NEXT_PUBLIC_API_URL || '/api',
  },
}; 