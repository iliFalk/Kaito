<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Sidekick - Chrome Extension

An AI-powered side panel extension to boost your productivity with integrated search, chat, and customizable quick actions.

## Features

- **AI Chat Interface**: Powered by Google Gemini and OpenAI
- **Text Selection Shortcuts**: Right-click selected text for quick AI actions
- **Screenshot Analysis**: Capture and analyze screenshots with AI
- **Customizable Shortcuts**: Configure your own AI prompts and actions
- **Offline Support**: All dependencies bundled locally

## Development

### Prerequisites

- Node.js (v16 or higher)
- Chrome browser for testing

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kaito
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API Keys**
   
   Create a `.env` file in the root directory:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   For OpenAI support, configure the API settings in the extension options.

4. **Development**
   ```bash
   npm run dev
   ```
   
   This starts the Vite development server.

5. **Build for Production**
   ```bash
   npm run build
   ```
   
   The built extension files will be in the `dist/` directory.

### Loading the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `dist/` folder
4. The extension should now be loaded and ready to use

## Project Structure

```
├── dist/                 # Built extension files
├── public/               # Static extension files
│   ├── manifest.json     # Extension manifest
│   ├── service_worker.js # Background script
│   ├── content/          # Content scripts
│   ├── icons/            # Extension icons
│   └── sidepanel/        # Side panel HTML
├── src/                  # Source code
│   ├── components/       # React components
│   ├── pages/            # Application pages
│   ├── services/         # AI service integrations
│   └── context/          # React context
├── assets/               # Local assets (CDNs moved here)
└── package.json          # Dependencies and scripts
```

## Technologies Used

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Chrome Extension Manifest V3** - Extension framework
- **Google Gemini AI** - Primary AI model
- **OpenAI API** - Alternative AI provider
- **Three.js** - 3D graphics (for animations)
- **Tailwind CSS** - Styling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension locally
5. Submit a pull request

## License

This project is licensed under the MIT License.
