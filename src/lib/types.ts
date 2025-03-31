export interface FoodItem {
  name: string;
  calories: number;
  portion: string;
}

export interface CalorieEstimation {
  calories: number;
  foodItems: FoodItem[];
  confidence: number; // 0-1 scale
  imageUrl: string;
}

export interface CalorieEstimationRequest {
  image: string; // Base64 encoded image
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 