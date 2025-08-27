# Agents for DOPE

A simple, clean agent builder platform that lets you create and manage custom AI agents. Think GPTs, but your own thing!

## Features

- 🤖 **Create Custom Agents**: Build AI agents with custom instructions, models, and settings
- 🎛️ **Model Selection**: Choose from GPT-3.5 Turbo, GPT-4, and GPT-4 Turbo
- 🌡️ **Temperature Control**: Fine-tune agent creativity and randomness
- 🌍 **Public/Private Agents**: Share agents publicly or keep them private
- 🔐 **Authentication**: Secure user accounts with Convex Auth
- 💾 **Real-time Database**: Powered by Convex for instant updates
- 📱 **Responsive Design**: Works great on desktop and mobile

## Getting Started

1. **Install dependencies**:
```bash
npm install
```

2. **Set up Convex**:
```bash
npx convex dev
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Open your browser** and navigate to [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Sign In**: Create an account or sign in to get started
2. **Create an Agent**: Click "Create New Agent" and fill in the details:
   - **Name**: Give your agent a memorable name
   - **Description**: Brief description of what your agent does
   - **Instructions**: Detailed instructions for how the agent should behave
   - **Model**: Choose your preferred AI model
   - **Temperature**: Adjust creativity (0 = focused, 1 = creative)
   - **Public**: Make your agent available to other users
3. **Manage Agents**: View, edit, or delete your agents from the dashboard
4. **Start Conversations**: Click on any agent to begin chatting

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database and functions)
- **Authentication**: Convex Auth
- **Deployment**: Vercel-ready

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── page.tsx        # Main dashboard
│   ├── layout.tsx      # Root layout
│   └── globals.css     # Global styles
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   ├── myFunctions.ts  # Backend functions
│   └── auth.ts         # Authentication config
└── components/         # Reusable components
```

## Contributing

This is a simple agent builder focused on clean, straightforward functionality. Feel free to extend it with additional features like:
- Conversation history
- Agent marketplace
- Advanced model settings
- File uploads
- Custom integrations

## License

MIT License - feel free to use this as a starting point for your own agent platform!