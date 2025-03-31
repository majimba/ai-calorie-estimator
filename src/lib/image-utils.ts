/**
 * Convert a File object to a base64 string
 * @param file The file to convert
 * @returns Promise resolving to the base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Compress an image to reduce its size before uploading
 * @param file The image file to compress
 * @param maxWidth Maximum width of the image
 * @param quality Compression quality (0-1)
 * @returns Promise resolving to a compressed base64 string
 */
export function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
    };
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
  });
}

/**
 * Capture an image from the device camera
 * @returns Promise resolving to the captured image as a File
 */
export async function captureImage(): Promise<File> {
  return new Promise((resolve, reject) => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        resolve(file);
      } else {
        reject(new Error('No image selected'));
      }
    };
    
    // Trigger file selection
    input.click();
  });
} 