# 🎨 Dope Postcard Project

An AI-powered postcard generator that creates stunning marketing postcards with custom content, visuals, and campaign strategies.

## ✨ Features

- **AI Content Generation**: Automatically generates headlines, body text, and call-to-actions
- **Smart Color Palettes**: Creates harmonious color schemes for your postcards
- **Image Generation**: Uses Flux AI to create beautiful postcard visuals
- **Campaign Strategy**: Generates comprehensive marketing strategies for your postcards
- **Customizable**: Fine-tune your postcards with specific prompts and preferences (Kind of -- coming soon)

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Convex
- **AI Services**: Replicate API (Meta Llama 3, Flux)
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js (v18 or higher)
- npm or yarn
- A Replicate API key - (I will provide)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```


### 4. Configure Environment Variables
Create a `.env.local` file in the frontend directory:
```env
CONVEX_DEPLOYMENT=your-convex-deployment-url
NEXT_PUBLIC_CONVEX_URL=your-convex-url
REPLICATE_API_TOKEN=your-replicate-api-key
```

### 5. Run the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application!

## 🎯 How to Use

1. **Generate a Postcard**: 
   - Click generate!
   - Wait for maybe 20 seconds

2. **View Results**:
   - **Image**: AI-generated postcard visual
   - **Colors**: Custom color palette
   - **Strategy**: Comprehensive marketing campaign strategy

3. **Customize** (Coming Soon):
   - Use the slide-out modal to refine your postcard
   - Adjust colors, content, or strategy based on feedback

```

## 🤖 AI Generation Process

The app follows a 5-step generation process:

1. **Content Generation**: Creates headline, body text, CTA, and colors
2. **Strategy Generation**: Develops comprehensive marketing strategy
3. **Image Prompt Creation**: Crafts detailed prompts for image generation
4. **Image Generation**: Uses Flux AI to create the postcard visual
5. **Results Assembly**: Combines all elements into final postcard

---

Hope you like :D. I wanted to get a lot more done but I wanted to respect the cutoff window
