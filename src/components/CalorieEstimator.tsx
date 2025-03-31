'use client';

import { useState } from 'react';
import ImageUploader from './ImageUploader';
import TextInput from './TextInput';
import CalorieResult from './CalorieResult';

type InputMethod = 'image' | 'text';
type EstimationState = 'idle' | 'loading' | 'success' | 'error';

export default function CalorieEstimator() {
  const [activeMethod, setActiveMethod] = useState<InputMethod>('image');
  const [estimationState, setEstimationState] = useState<EstimationState>('idle');
  const [calorieEstimate, setCalorieEstimate] = useState<number | null>(null);
  const [inputDescription, setInputDescription] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleImageSubmit = async (file: File) => {
    try {
      setEstimationState('loading');
      // In a real application, you would upload the file to your backend API
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate a response
      const mockCalories = Math.floor(Math.random() * 500) + 200;
      setCalorieEstimate(mockCalories);
      setInputDescription(`Image of food`);
      setEstimationState('success');
    } catch (error) {
      setEstimationState('error');
      setErrorMessage('Failed to process image. Please try again.');
    }
  };

  const handleTextSubmit = async (text: string) => {
    try {
      if (!text.trim()) {
        setErrorMessage('Please enter a food description');
        setEstimationState('error');
        return;
      }
      
      setEstimationState('loading');
      // In a real application, you would send the text to your backend API
      // For now, we'll simulate the API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate a response
      const mockCalories = Math.floor(Math.random() * 500) + 200;
      setCalorieEstimate(mockCalories);
      setInputDescription(text);
      setEstimationState('success');
    } catch (error) {
      setEstimationState('error');
      setErrorMessage('Failed to process text. Please try again.');
    }
  };

  const handleReset = () => {
    setEstimationState('idle');
    setCalorieEstimate(null);
    setInputDescription('');
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Estimate Meal Calories</h2>
        <p className="text-gray-600 mb-6">Upload a photo of your meal or describe it in text to get an AI-powered calorie estimate</p>
        
        {/* Input Method Selection */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveMethod('image')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg ${
              activeMethod === 'image'
                ? 'bg-gray-100 border-2 border-gray-200'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">📷</span>
            <span className="font-medium">Image Upload</span>
          </button>
          <button
            onClick={() => setActiveMethod('text')}
            className={`flex-1 flex items-center justify-center py-3 px-4 rounded-lg ${
              activeMethod === 'text'
                ? 'bg-gray-100 border-2 border-gray-200'
                : 'bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">📝</span>
            <span className="font-medium">Text Description</span>
          </button>
        </div>

        {/* Input Methods */}
        {estimationState === 'idle' || estimationState === 'error' ? (
          <>
            {activeMethod === 'image' ? (
              <ImageUploader onSubmit={handleImageSubmit} />
            ) : (
              <TextInput onSubmit={handleTextSubmit} />
            )}
            
            {errorMessage && (
              <div className="mt-4 p-2 bg-red-100 text-red-700 rounded text-sm">
                {errorMessage}
              </div>
            )}
            
            <p className="text-gray-500 text-sm text-center mt-6">
              For best results, ensure your meal is clearly visible and well-lit
            </p>
          </>
        ) : estimationState === 'loading' ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Analyzing your {activeMethod === 'image' ? 'image' : 'description'}...</p>
          </div>
        ) : (
          <CalorieResult
            calories={calorieEstimate || 0}
            description={inputDescription}
            source={activeMethod}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
} 