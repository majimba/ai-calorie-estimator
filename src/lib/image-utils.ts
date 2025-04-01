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
      
      // For iOS devices specifically, use a more aggressive compression approach
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isIOS) {
        console.log('iOS device detected, applying iOS-specific compression settings');
        maxWidth = Math.min(maxWidth, 500); // Smaller for iOS
        quality = Math.min(quality, 0.6); // Lower quality for iOS
      } else if (isMobile) {
        console.log('Mobile device detected, applying mobile-specific compression settings');
        maxWidth = Math.min(maxWidth, 600); // Smaller for mobile
        quality = Math.min(quality, 0.7); // Lower quality for mobile
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        try {
          console.log('File read successful, creating image object');
          const img = new Image();
          
          img.onerror = () => {
            console.error('Error loading image');
            // On iOS, if image loading fails, try a direct conversion without compression
            fileToBase64(file).then(resolve).catch(reject);
          };
          
          img.onload = () => {
            try {
              console.log(`Original image dimensions: ${img.width}x${img.height}`);
              
              // For very small images, don't compress
              if (img.width <= maxWidth && file.size < 300000 && !isMobile) {
                console.log('Image is already small enough, skipping compression');
                resolve(event.target?.result as string);
                return;
              }
              
              // For mobile images always compress, regardless of size
              if (isMobile && file.size < 300000) {
                console.log('Small mobile image, using light compression');
                quality = Math.min(quality + 0.1, 0.9); // Use slightly better quality for small mobile images
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
              
              try {
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  throw new Error('Could not get canvas context');
                }
                
                // Use crisp edges rendering for sharper images on iOS
                if (isIOS) {
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'medium';
                } else if (isMobile) {
                  ctx.imageSmoothingEnabled = true;
                  ctx.imageSmoothingQuality = 'high';
                }
                
                ctx.fillStyle = '#FFFFFF'; // Use white background
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to JPG for most consistent results across browsers
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                console.log('Compression complete, new data URL length:', dataUrl.length);
                
                resolve(dataUrl);
              } catch (canvasError) {
                console.error('Canvas error:', canvasError);
                // If canvas operations fail (which can happen on some iOS versions)
                // fall back to the original file
                console.log('Canvas operation failed, falling back to original image');
                resolve(event.target?.result as string);
              }
            } catch (error) {
              console.error('Error in image onload handler:', error);
              reject(error);
            }
          };
          
          // Set source to load the image
          img.src = event.target?.result as string;
          
          // For iOS, add a timeout to prevent hanging
          if (isIOS) {
            setTimeout(() => {
              if (!img.complete) {
                console.error('Image loading timed out on iOS');
                resolve(event.target?.result as string);
              }
            }, 3000);
          }
        } catch (error) {
          console.error('Error processing image after file read:', error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
    } catch (error) {
      console.error('Unexpected error in compressImage:', error);
      reject(error);
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