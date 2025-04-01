import { CalorieEstimation } from '@/lib/types';
import { RefreshIcon } from './icons';

interface ResultDisplayProps {
  results: CalorieEstimation;
  onReset: () => void;
}

export function ResultDisplay({ results, onReset }: ResultDisplayProps) {
  const { calories, foodItems, confidence, imageUrl } = results;
  
  // Format confidence as percentage
  const confidencePercent = Math.round(confidence * 100);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="aspect-square relative rounded-lg overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Analyzed food" 
              className="object-cover w-full h-full"
            />
          </div>
        </div>
        
        <div className="md:w-2/3">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-800">
              {calories} calories
            </h3>
            <p className="text-gray-500 text-sm">
              Analysis confidence: {confidencePercent}%
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">Food items detected:</h4>
            <ul className="divide-y">
              {foodItems.map((item, index) => (
                <li key={index} className="py-2 flex justify-between">
                  <span>
                    <span className="font-medium">{item.name}</span>
                    <span className="text-gray-500 text-sm ml-2">({item.portion})</span>
                  </span>
                  <span className="font-medium">{item.calories} cal</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded transition-colors"
        >
          <RefreshIcon className="h-4 w-4" />
          Analyze Another Image
        </button>
      </div>
      
      <div className="text-sm text-gray-500 mt-4 p-2 bg-gray-50 rounded">
        <p>Note: These calorie estimations are approximate and may vary based on exact preparation methods, portion sizes, and ingredients.</p>
      </div>
    </div>
  );
} 