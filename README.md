# PAYG ChatGPT

A local ChatGPT built with React and Vite that uses the OpenAI API. This application provides a clean, modern interface for chatting with various OpenAI models.

## Features

-   🤖 **Multiple Model Support**: Choose from GPT-5, GPT-4o, GPT-4o-mini, GPT-4-turbo, GPT-4, and GPT-3.5-turbo
-   💬 **Real-time Chat**: Send messages and receive streaming responses from OpenAI models
-   📚 **Multiple Conversations**: Create, manage, and switch between multiple saved conversations
-   🏷️ **Conversation Management**: Rename, delete, and organize your chat history
-   🎨 **Liquid Glass UI**: Beautiful glassmorphism design with frosted glass effects and smooth animations
-   ⚙️ **Settings Panel**: Easy API key management and conversation controls
-   📱 **Responsive Design**: Works on desktop and mobile devices with mobile-optimized sidebar
-   🔒 **Secure**: API key and conversations stored locally in browser storage
-   💾 **Persistent State**: All conversations and preferences are saved automatically

## Getting Started

### Prerequisites

-   Node.js (version 16 or higher)
-   An OpenAI API key

### Installation

1. Clone this repository:

```bash
git clone <your-repo-url>
cd chatgpt
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Set up your OpenAI API key:

    - Copy `env.example` to `.env`
    - Add your OpenAI API key to the `.env` file:

    ```
    VITE_OPENAI_API_KEY=your_openai_api_key_here
    ```

    - Or add it directly in the app's settings panel

4. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Add API Key**: Click the settings button (⚙️) in the header and enter your OpenAI API key
2. **Select Model**: Use the dropdown in the header to choose your preferred OpenAI model
3. **Create New Chat**: Click the "New Chat" button in the sidebar to start a fresh conversation
4. **Start Chatting**: Type your message in the input box and press Enter or click Send
5. **Manage Conversations**:
    - Click on any conversation in the sidebar to switch between chats
    - Hover over a conversation to see rename and delete options
    - Click the edit icon to rename a conversation
    - Click the trash icon to delete a conversation
6. **Clear Current Chat**: Use the "Clear Chat" button in settings to clear the current conversation
7. **Toggle Sidebar**: Click the chat icon in the header to show/hide the conversation sidebar

## Available Models

-   **GPT-5**: Next-generation model (when available)
-   **GPT-4o**: Latest and most capable model
-   **GPT-4o-mini**: Faster and more cost-effective version of GPT-4o
-   **GPT-4-turbo**: High-performance model with extended context
-   **GPT-4**: Standard GPT-4 model
-   **GPT-3.5-turbo**: Fast and efficient model for most tasks

## Security Note

⚠️ **Important**: This application runs entirely in the browser and sends your API key directly to OpenAI. For production use, consider implementing a backend proxy to keep your API key secure.

## Building for Production

```bash
npm run build
# or
pnpm build
```

The built files will be in the `dist` directory.

## Technologies Used

-   **React 19**: Modern React with hooks
-   **Vite**: Fast build tool and development server
-   **OpenAI SDK**: Official OpenAI JavaScript SDK
-   **Lucide React**: Beautiful icons
-   **CSS3**: Modern styling with glassmorphism effects, flexbox, and animations

## UI Design Features

-   **Glassmorphism**: Frosted glass effects with backdrop blur
-   **Animated Gradient**: Dynamic background with smooth color transitions
-   **Liquid Glass Elements**: Transparent containers with subtle borders and shadows
-   **Smooth Animations**: Hover effects and transitions for enhanced user experience
-   **Responsive Design**: Optimized for both desktop and mobile devices

## License

This project is open source and available under the MIT License.
