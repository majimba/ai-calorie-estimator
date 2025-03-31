import { CalorieEstimation, FoodItem } from '@/lib/types';

interface ResultsDisplayProps {
  result: CalorieEstimation;
}

export function ResultsDisplay({ result }: ResultsDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <img 
            src={result.imageUrl} 
            alt="Food image" 
            className="w-full h-auto rounded-md object-cover"
          />
        </div>
        
        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Calorie Estimate</h2>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Confidence:</span>
              <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full" 
                  style={{ width: `${result.confidence * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm font-medium">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total Calories:</span>
              <span className="text-2xl font-bold text-blue-600">{result.calories}</span>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Food Items</h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Food Item
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Portion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Calories
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {result.foodItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{item.portion}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {item.calories}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>
              Note: These are estimated values based on AI analysis. Actual calories may vary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 