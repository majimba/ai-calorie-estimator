'use client';

import { useState, useRef } from 'react';
import { compressImage, fileToBase64 } from '@/lib/image-utils';

interface ImageUploaderProps {
  onImageCapture: (base64Image: string) => void;
  isLoading?: boolean;
}

export function ImageUploader({ onImageCapture, isLoading = false }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (file: File) => {
    try {
      // Log file information for debugging
      console.log('File selected:', file.name, file.type, file.size);
      
      // Check if this is likely a mobile device
      const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // For mobile devices, use stronger compression to reduce network load
      let quality = 0.8;
      let maxWidth = 800;
      
      if (isMobile) {
        console.log('Mobile device detected, using stronger compression');
        maxWidth = 600; // Smaller image for mobile
        quality = file.size > 3000000 ? 0.6 : // Very large image
                 file.size > 1000000 ? 0.7 : // Large image
                 file.size > 500000 ? 0.8 : 0.85; // Medium/small image
      } else {
        // For desktop, use better quality
        quality = file.size < 500000 ? 0.9 : 0.8;
      }
      
      // Compress image before uploading
      console.log(`Compressing image with quality ${quality} and max width ${maxWidth}...`);
      const compressedImage = await compressImage(file, maxWidth, quality);
      console.log('Image compressed successfully');
      
      // Estimate compressed size
      const sizeEstimate = (compressedImage.length * 0.75) / (1024 * 1024);
      console.log(`Estimated compressed size: ${sizeEstimate.toFixed(2)} MB`);
      
      // If still too large for mobile, compress again with lower quality
      if (isMobile && sizeEstimate > 1) {
        console.log('Image still large for mobile, compressing further');
        const imgElement = new Image();
        imgElement.src = compressedImage;
        
        await new Promise(resolve => {
          imgElement.onload = resolve;
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(imgElement.width, 500);
        canvas.height = Math.round((imgElement.height * canvas.width) / imgElement.width);
        
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
        
        const secondPassImage = canvas.toDataURL('image/jpeg', 0.6);
        console.log('Second pass compression complete');
        setPreviewUrl(secondPassImage);
        onImageCapture(secondPassImage);
      } else {
        setPreviewUrl(compressedImage);
        onImageCapture(compressedImage);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again with a different image or camera. If on a mobile device, try using WiFi.');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageSelect(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await handleImageSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-500 cursor-pointer'
        }`}
        onClick={isLoading ? undefined : handleCameraCapture}
        onDrop={isLoading ? undefined : handleDrop}
        onDragOver={handleDragOver}
      >
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Food preview" 
              className="w-full h-64 object-contain mx-auto rounded-md"
            />
            {!isLoading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        ) : (
          <div className="py-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {isLoading ? 'Processing...' : 'Take a photo or drop an image here'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports JPG, PNG, GIF
            </p>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={isLoading}
      />

      {!previewUrl && (
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={handleCameraCapture}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Take Photo
          </button>
        </div>
      )}
    </div>
  );
} 