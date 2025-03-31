'use client';

interface CalorieResultProps {
  calories: number;
  description: string;
  source: 'image' | 'text';
  onReset: () => void;
}

export default function CalorieResult({
  calories,
  description,
  source,
  onReset,
}: CalorieResultProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6">
        <div className="text-gray-500 mb-1">Estimated Calories</div>
        <div className="text-4xl font-bold">{calories}</div>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg w-full mb-6">
        <div className="text-sm text-gray-500 mb-1">Based on {source === 'image' ? 'your photo' : 'your description'}</div>
        <div className="font-medium">{description}</div>
      </div>
      
      <button
        onClick={onReset}
        className="py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Start Over
      </button>
      
      <div className="mt-6 text-xs text-gray-400">
        This is an AI estimate based on visual analysis{source === 'image' ? ' of your photo' : ''}.
        Actual calories may vary.
      </div>
    </div>
  );
} 