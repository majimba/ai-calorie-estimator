/**
 * Convert a File object to a base64 string
 * @param file The file to convert
 * @returns Promise resolving to the base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log('Converting file to base64, size:', file.size);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      console.log('File converted to base64 successfully');
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      console.error('Error converting file to base64:', error);
      reject(error);
    };
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
    try {
      console.log('Starting image compression, file size:', file.size);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        try {
          console.log('File read successful, creating image object');
          const img = new Image();
          
          img.onload = () => {
            try {
              console.log(`Original image dimensions: ${img.width}x${img.height}`);
              
              // For very small images, don't compress
              if (img.width <= maxWidth && file.size < 300000) {
                console.log('Image is already small enough, skipping compression');
                resolve(event.target?.result as string);
                return;
              }
              
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              
              // Calculate new dimensions while maintaining aspect ratio
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
              
              console.log(`Resizing to: ${width}x${height}, quality: ${quality}`);
              
              canvas.width = width;
              canvas.height = height;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                console.error('Could not get canvas context');
                reject(new Error('Could not get canvas context'));
                return;
              }
              
              // Draw the image on the canvas
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convert to data URL
              const dataUrl = canvas.toDataURL('image/jpeg', quality);
              console.log('Compression complete, new data URL length:', dataUrl.length);
              
              resolve(dataUrl);
            } catch (err) {
              console.error('Error during canvas operations:', err);
              reject(err);
            }
          };
          
          img.onerror = (err) => {
            console.error('Error loading image:', err);
            reject(new Error('Error loading image'));
          };
          
          img.src = event.target?.result as string;
        } catch (err) {
          console.error('Error in image onload handler:', err);
          reject(err);
        }
      };
      
      reader.onerror = (err) => {
        console.error('Error reading file:', err);
        reject(new Error('Error reading file'));
      };
    } catch (err) {
      console.error('Unexpected error in compressImage:', err);
      reject(err);
    }
  });
}

/**
 * Capture an image from the device camera
 * @returns Promise resolving to the captured image as a File
 */
export async function captureImage(): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          console.log('Captured image:', file.name, file.type, file.size);
          resolve(file);
        } else {
          reject(new Error('No image selected'));
        }
      };
      
      // Trigger file selection
      input.click();
    } catch (err) {
      console.error('Error capturing image:', err);
      reject(err);
    }
  });
} 