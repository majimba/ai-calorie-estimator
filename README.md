# AI Calorie Estimator App

A modern web application that uses AI to estimate calories in food from images.

## Features

- Capture or upload images of food
- AI-powered calorie estimation using OpenAI's vision capabilities
- Detailed breakdown of food items and their estimated calories
- User-friendly interface built with Next.js and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: OpenAI GPT-4 Vision
- **Image Storage**: Cloudinary
- **Form Validation**: Zod, React Hook Form

## Setup

### Prerequisites

- Node.js 16.x or later
- npm or yarn
- OpenAI API key
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-calorie-estimator-app.git
cd ai-calorie-estimator-app
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file in the root directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

4. Start the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### `POST /api/estimate-calories`

Estimates calories in food from an image.

**Request Body:**
```json
{
  "image": "base64_encoded_image_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "calories": 650,
    "foodItems": [
      {
        "name": "Hamburger",
        "calories": 350,
        "portion": "1 burger (150g)"
      },
      {
        "name": "French Fries",
        "calories": 300,
        "portion": "Medium serving (100g)"
      }
    ],
    "confidence": 0.85,
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

## License

ISC

## Author

Your Name 