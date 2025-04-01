'use client';

import { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { ResultsDisplay } from './ResultsDisplay';
import { estimateCaloriesWithErrorHandling } from '@/lib/api';
import { CalorieEstimation } from '@/lib/types';
import { formatErrorMessage } from '@/lib/error';
import { debug } from '@/lib/debug';

export function CalorieEstimator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalorieEstimation | null>(null);

  const handleImageCapture = async (base64Image: string) => {
    debug.log('Image captured in CalorieEstimator', { imageSize: base64Image.length });
    setIsLoading(true);
    setError(null);
    
    try {
      debug.log('Calling estimateCaloriesWithErrorHandling');
      const { data, error } = await estimateCaloriesWithErrorHandling(base64Image);
      
      if (error) {
        debug.error('Error from estimateCaloriesWithErrorHandling', error);
        
        // Provide more helpful error messages for mobile users
        if (error.includes('timeout') || error.includes('Network Error')) {
          setError('Connection problem detected. Please check your internet connection and try again. Mobile connections may be slower.');
        } else if (error.includes('connect to the server')) {
          setError('Could not connect to the server. This may be due to a weak mobile signal. Try again when you have a better connection.');
        } else {
          setError(error);
        }
      } else if (data) {
        debug.log('Received calorie estimation result', { 
          calories: data.calories,
          confidence: data.confidence,
          foodItems: data.foodItems.length
        });
        setResult(data);
      } else {
        debug.error('No data or error returned', null);
        setError('An unexpected error occurred. Please try again.');
      }
    } catch (err) {
      debug.error('Uncaught error in handleImageCapture', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    debug.log('Resetting CalorieEstimator state');
    setResult(null);
    setError(null);
  };

  // Check if we're on a mobile device
  const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">AI Calorie Estimator</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p>{error}</p>
              {isMobile && error.includes('connection') && (
                <p className="mt-2 text-sm">
                  Tip: Mobile networks can be unreliable. Try using WiFi if available.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {!result ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-center text-gray-600 mb-6">
            Take a photo of your food or upload an image to estimate its calorie content
          </p>
          <ImageUploader onImageCapture={handleImageCapture} isLoading={isLoading} />
          
          {isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">
                {isMobile ? 
                  'Analyzing your food... this may take longer on mobile connections' : 
                  'Analyzing your food...'
                }
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <ResultsDisplay result={result} />
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleReset}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg"
            >
              Analyze Another Photo
            </button>
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-gray-500 text-sm">
        <p>
          This app uses AI to estimate calories in food images. Results are approximate.
        </p>
        {isMobile && (
          <p className="mt-2">
            For best results on mobile, use WiFi and ensure good lighting when taking photos.
          </p>
        )}
      </div>
    </div>
  );
} 