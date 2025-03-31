'use client';

import CalorieEstimator from '@/components/CalorieEstimator';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">AI Calorie Estimator</h1>
        <p className="text-gray-600">
          Quickly estimate the calories in your meal using AI - simply upload a photo or describe your food
        </p>
      </div>
      
      <CalorieEstimator />
    </main>
  );
} 