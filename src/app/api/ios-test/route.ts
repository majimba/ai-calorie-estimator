import { NextResponse } from 'next/server';

// Helper function to add CORS headers
function corsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-iOS-Client');
  
  // Prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return corsHeaders(response);
}

// Simple POST endpoint that doesn't use any external APIs
export async function POST(request: Request) {
  console.log('📱 iOS Test API: Received request');
  console.log('📱 iOS Test API: Request headers:', Object.fromEntries(request.headers.entries()));
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('📱 iOS Test API: Error parsing request JSON:', parseError);
      return corsHeaders(NextResponse.json({
        success: false,
        error: "Invalid JSON body - please check your connection and try again"
      }, { status: 400 }));
    }
    
    // Generate a more varied mock response
    // Pick a random food type to simulate different images
    const foodTypes = [
      {
        name: "Chicken Salad",
        calories: 320,
        items: [
          { name: "Grilled Chicken", calories: 180, portion: "4 oz" },
          { name: "Mixed Greens", calories: 30, portion: "2 cups" },
          { name: "Cherry Tomatoes", calories: 25, portion: "5 pieces" },
          { name: "Balsamic Vinaigrette", calories: 85, portion: "1 tbsp" }
        ]
      },
      {
        name: "Pasta Dish",
        calories: 620,
        items: [
          { name: "Spaghetti Pasta", calories: 200, portion: "1 cup" },
          { name: "Tomato Sauce", calories: 100, portion: "1/2 cup" },
          { name: "Ground Beef", calories: 250, portion: "3 oz" },
          { name: "Parmesan Cheese", calories: 70, portion: "2 tbsp" }
        ]
      },
      {
        name: "Breakfast Plate",
        calories: 550,
        items: [
          { name: "Scrambled Eggs", calories: 140, portion: "2 eggs" },
          { name: "Bacon", calories: 120, portion: "2 strips" },
          { name: "Toast", calories: 80, portion: "1 slice" },
          { name: "Butter", calories: 35, portion: "1 tsp" },
          { name: "Hash Browns", calories: 175, portion: "1/2 cup" }
        ]
      },
      {
        name: "Fruit Smoothie Bowl",
        calories: 380,
        items: [
          { name: "Banana", calories: 105, portion: "1 medium" },
          { name: "Strawberries", calories: 45, portion: "1/2 cup" },
          { name: "Greek Yogurt", calories: 100, portion: "1/2 cup" },
          { name: "Honey", calories: 65, portion: "1 tbsp" },
          { name: "Granola", calories: 65, portion: "2 tbsp" }
        ]
      }
    ];
    
    // Pick a random food type
    const randomFood = foodTypes[Math.floor(Math.random() * foodTypes.length)];
    
    // Create mock result with the chosen food
    const mockResult = {
      calories: randomFood.calories,
      foodItems: randomFood.items,
      confidence: 0.85 + (Math.random() * 0.1), // Random confidence between 0.85 and 0.95
      imageUrl: `https://placehold.co/600x400?text=${encodeURIComponent(randomFood.name)}`
    };
    
    console.log('📱 iOS Test API: Sending mock response for', randomFood.name);
    
    return corsHeaders(NextResponse.json({
      success: true,
      data: mockResult
    }));
  } catch (error) {
    console.error('📱 iOS Test API: Unexpected error:', error);
    return corsHeaders(NextResponse.json({
      success: false,
      error: "iOS test endpoint encountered an error"
    }, { status: 500 }));
  }
} 