'use client';

import { useState, useRef } from 'react';
import { compressImage, fileToBase64 } from '@/lib/image-utils';
import { CameraIcon, XIcon, UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageCapture: (base64Image: string) => void;
}

export function ImageUploader({ onImageCapture }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (file: File) => {
    try {
      setIsProcessing(true);
      
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
    } finally {
      setIsProcessing(false);
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

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center ${
          isProcessing ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-blue-500 cursor-pointer'
        }`}
        onClick={isProcessing ? undefined : handleCameraCapture}
        onDrop={isProcessing ? undefined : handleDrop}
        onDragOver={handleDragOver}
      >
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Food preview" 
              className="w-full h-64 object-contain mx-auto rounded-md"
            />
            {!isProcessing && (
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                aria-label="Remove image"
              >
                <XIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        ) :
          <div className="py-8">
            <CameraIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isProcessing ? 'Processing...' : 'Take a photo of your food or upload an image to estimate its calorie content'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Supports JPG, PNG, GIF
            </p>
          </div>
        }
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={isProcessing}
      />

      {!previewUrl && (
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={handleCameraCapture}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center"
            disabled={isProcessing}
          >
            <CameraIcon className="h-5 w-5 mr-2" />
            Take Photo
          </button>
        </div>
      )}
    </div>
  );
} 