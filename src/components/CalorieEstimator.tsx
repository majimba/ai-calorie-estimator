'use client';

import { useState, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { ResultsDisplay } from './ResultsDisplay';
import { estimateCalories } from '@/lib/api';
import { CalorieEstimation } from '@/lib/types';
import { formatErrorMessage } from '@/lib/error';
import { debug } from '@/lib/debug';
import { AlertTriangleIcon, LoaderIcon } from '@/components/icons';
import { ApiError } from '@/lib/error';
import { ResultDisplay } from './ResultDisplay';

export function CalorieEstimator() {
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CalorieEstimation | null>(null);
  const [networkInfo, setNetworkInfo] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  // Check if this is a mobile device
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Collect network info on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkInfo(`Network: ${connection.effectiveType || 'unknown'}, RTT: ${connection.rtt || 'unknown'}ms`);
      } else {
        setNetworkInfo('Network info not available');
      }
    }
  }, []);

  const handleImageCapture = async (imageData: string) => {
    try {
      console.log('Image capture handler triggered');
      setBase64Image(imageData);
      setLoading(true);
      setError(null);
      setResults(null);
      
      // Log the image size for debugging
      const sizeMB = (imageData.length * 0.75) / (1024 * 1024);
      console.log(`Processing image, approx size: ${sizeMB.toFixed(2)} MB`);
      
      console.log('Starting estimation...');
      const results = await estimateCalories(imageData);
      console.log('Estimation complete:', results);
      
      setResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error in handleImageCapture:', error);
      
      if (error instanceof ApiError) {
        // For network errors on mobile, provide specific guidance
        if (isMobile && (error.message.includes('connect') || error.message.includes('network') || error.message.includes('timeout'))) {
          setError(`Mobile connectivity issue: ${error.message}. Try using WiFi or a better connection.`);
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (base64Image) {
      setRetryCount(prev => prev + 1);
      setError(null);
      handleImageCapture(base64Image);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-6">AI Calorie Estimator</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 mb-6 rounded-md flex items-start">
          <AlertTriangleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
          <div>
            <div className="font-semibold">{error}</div>
            {isMobile && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Tip: Mobile networks can be unreliable. Try using WiFi if available.</p>
                <div className="text-xs mt-1">{networkInfo}</div>
                <button 
                  onClick={handleRetry} 
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded mt-2 text-sm"
                >
                  Retry Analysis ({retryCount})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!results && (
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm mb-6">
          <ImageUploader onImageCapture={handleImageCapture} />
        </div>
      )}
      
      {loading && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 mb-6 rounded-md flex items-center">
          <LoaderIcon className="h-5 w-5 text-blue-500 mr-2 animate-spin" />
          <div>
            <p className="font-medium">Analyzing your food...</p>
            <p className="text-sm mt-1">
              {isMobile ? 
                'This may take up to 40 seconds on mobile connections.' : 
                'This should only take a few seconds.'}
            </p>
          </div>
        </div>
      )}
      
      {results && (
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow mb-6">
          <ResultDisplay 
            results={results} 
            onReset={() => {
              setBase64Image(null);
              setResults(null);
              setRetryCount(0);
            }} 
          />
        </div>
      )}
      
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>This app uses AI to estimate calories in food images.</p>
        <p>Results are approximate.</p>
        
        {isMobile && (
          <p className="mt-2 text-xs text-gray-400">
            For best results on mobile, use WiFi and ensure good lighting when taking photos.
          </p>
        )}
      </div>
    </div>
  );
} 