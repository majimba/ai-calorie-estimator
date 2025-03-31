# AI Calorie Estimator

A modern web application that uses AI to estimate calorie content from food images or text descriptions.

## Features

- Upload food images for calorie estimation
- Provide text descriptions for calorie estimation
- Clean, modern UI built with Next.js and Tailwind CSS
- AI-powered analysis (currently simulated, integration planned with Gemma models)

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (planned)
- **AI**: Gemma models (planned)
- **Food Database**: TBD (USDA FoodData Central, Open Food Facts, etc.)

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-calorie-estimator.git
   cd ai-calorie-estimator
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                  # App router structure
│   ├── api/              # API routes (planned)
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── CalorieEstimator.tsx  # Main component
│   ├── ImageUploader.tsx     # Image upload interface
│   ├── TextInput.tsx         # Text input interface
│   └── CalorieResult.tsx     # Results display
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 