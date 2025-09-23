<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Sidekick - Chrome Extension

An AI-powered side panel extension to boost productivity with integrated search, chat, screenshot analysis, and customizable quick actions.

## Features

- AI Chat with Google Gemini and OpenAI (streaming responses)
- Screenshot/snipping tool with area selection and OCR
- Direct clipboard paste of screenshots (Ctrl/Cmd+V)
- Text selection context actions via right-click menu
- Customizable quick action shortcuts
- Local/offline-friendly dependencies (no external CDNs at runtime)
- Chat history management
- Appearance controls (film grain overlay: amount, size, roughness)

See the full guide for screenshots and tips: SCREENSHOT_FEATURE.md

## Getting Started

### Prerequisites

- Node.js 18+ (16 works, but 18+ recommended)
- Google Chrome for testing

### Setup

1) Clone
```bash
git clone <repository-url>
cd kaito
```

2) Install
```bash
npm install
```

3) Configure API keys

- Gemini: create a `.env` file in the project root:
```ini
GEMINI_API_KEY=your_gemini_api_key_here
```
- OpenAI: configure inside the extension UI (Side Panel → Models). No `.env` required.

## Development Workflows

You can iterate on the side panel UI with Vite, and build the MV3 extension for Chrome.

### Option A: Side panel UI preview (no extension APIs)
```bash
npm run dev
```
This serves the app with HMR. Open http://localhost:5173/sidepanel/ to preview the UI. Extension-only features (e.g., Chrome APIs, content scripts) won't be available in this mode.

### Option B: Build the extension
```bash
npm run build
```
The packaged extension will be emitted to `dist/`.

#### Load the extension in Chrome
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `dist/` directory
4. Click the extension's toolbar icon to open the side panel

Tip: While iterating on extension functionality, rebuild after changes with `npm run build` and click the reload icon for the extension in `chrome://extensions/`.

## Configuration

- Gemini API key is injected by Vite from `.env` via `define` in `vite.config.ts`
- OpenAI settings (base URL, API key, model) are stored/configured in the Models page in the side panel
- All third‑party libraries used at runtime are bundled or provided via `public/assets/lib` to work offline

## Screenshot and OCR

- Start capture from the camera icon in the conversation input
- Choose Preview Mode (no permission prompt) or Full Screen Capture
- Paste screenshots directly into the input with Ctrl/Cmd+V
- For limitations and troubleshooting, see `SCREENSHOT_FEATURE.md`

## Project Structure

```
├── sidepanel/
│   ├── index.html                 # Vite entry for the side panel
│   └── src/                       # React app (TypeScript preferred; JS variants also present)
│       ├── components/
│       ├── pages/
│       ├── services/              # Client-side service wrappers
│       └── context/
├── public/                        # Copied to dist/ as-is
│   ├── manifest.json              # MV3 manifest
│   ├── service_worker.js          # Background service worker
│   ├── content/                   # Content scripts and styles
│   ├── icons/                     # Extension icons
│   └── assets/                    # Local libraries (no runtime CDNs)
├── services/                      # Shared service helpers (Gemini/OpenAI)
├── utils/                         # Utilities (e.g., rate limiter)
├── vite.config.ts                 # Vite config for MV3 build
├── tsconfig.json
└── package.json
```

## Tech Stack

- React 19
- Vite 6
- Chrome Extension Manifest V3
- Google Generative AI (`@google/genai`)
- OpenAI-compatible Chat Completions API
- Three.js
- Tailwind CSS

## Permissions

The extension requests:

- `sidePanel`
- `storage`
- `tabs`
- `host_permissions: <all_urls>`

These are used for the side panel UI, saving preferences, interacting with the active tab, and enabling the screenshot feature.

## Troubleshooting

- Side panel shows blank in Chrome: ensure you loaded `dist/` (not `public/`) and that `npm run build` completed without errors
- Screenshot capture errors or permission prompts: see `SCREENSHOT_FEATURE.md`
- UI works in dev server but Chrome APIs fail: use Option B (build and load the extension)

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes with linted commits
4. Verify UI (dev) and extension (build)
5. Open a PR

## License

MIT
