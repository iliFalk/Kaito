# Screenshot/Snipping Tool Feature

## Overview
The AI Sidekick Chrome extension includes a built-in screenshot/snipping tool similar to Windows Snipping Tool, allowing users to capture and analyze specific areas of web pages. Additionally, you can now paste screenshots directly from your clipboard into the chat input area.

## NEW: Direct Clipboard Paste Support 📋
You can now paste screenshots directly from your clipboard! This works with:
- Windows Snipping Tool (Win + Shift + S)
- macOS Screenshot (Cmd + Shift + 4)
- Any screenshot tool that copies images to clipboard
- Print Screen button
- Third-party screenshot applications

### How to Use Clipboard Paste:
1. Take a screenshot using any tool (e.g., Windows Snipping Tool)
2. Click in the chat input area
3. Press **Ctrl+V** (Windows) or **Cmd+V** (Mac)
4. The screenshot will automatically attach to your message
5. Add your prompt and send!

**Note**: This feature requires a Gemini model with image support enabled.

## ⚠️ IMPORTANT: Use the Extension's Camera Button
Make sure you're clicking the camera icon (📷) **inside the AI Sidekick side panel**, NOT any camera/screenshot buttons on the webpage itself (like ChatGPT's interface).

## How to Use

1. **Start Screenshot Mode**
   - Open the AI Sidekick side panel (click the extension icon)
   - In the conversation interface at the bottom, click the camera icon (📷) next to the send button
   - Note: This feature requires a Gemini model that supports image input

2. **Choose Capture Method**
   When you click the screenshot button, you'll see two options:
   
   - **📋 Preview Mode (Recommended)**
     - No permission dialog required
     - Shows a grid preview for area selection
     - Perfect for quick selections without interruptions
   
   - **📸 Full Screen Capture**
     - Uses `navigator.mediaDevices.getDisplayMedia()` API
     - Shows Chrome's permission dialog
     - Captures actual webpage content
     - You'll need to select "Entire Screen", "Window", or "Tab"

3. **Select Area**
   - Your screen will be overlaid with either a preview grid or the actual screenshot
   - Click and drag to select the area you want to capture
   - Press ESC to cancel selection

4. **Choose Action**
   After selecting an area, a context menu appears with options:
   - **Describe**: AI will describe the content in the selected area
   - **Grab Text**: Extract all text from the selected area (OCR)
   - **Extract & Translate**: Extract text and translate to Simplified Chinese
   - **✓**: Confirm selection without auto-prompt
   - **✕**: Cancel selection

5. **AI Analysis**
   - The cropped screenshot is automatically attached to your conversation
   - If you chose an action, a relevant prompt is pre-filled
   - You can modify the prompt before sending or write your own

## Technical Details

### Implementation
- **Service Worker**: Handles tab capture using `chrome.tabs.captureVisibleTab()`
- **Content Script**: Creates selection overlay and handles user interaction
- **Side Panel**: Receives the cropped screenshot and integrates with AI chat

### Permissions Required
- `activeTab`: To capture the current tab
- `tabs`: To query and interact with tabs
- `host_permissions: <all_urls>`: To inject content script

### Limitations
- Cannot capture Chrome internal pages (chrome://, chrome-extension://)
- Only works with AI models that support image input (Gemini with image support)
- Screenshot is captured at the current viewport size
- Tab must be visible and not minimized

### Error Handling
- Shows alert if trying to capture restricted pages
- Handles cases where content script is not available
- Validates model capabilities before enabling feature

### Troubleshooting

#### "Screen capture failed" Error
If you see this error, try:
1. **Ensure the tab is visible**: The tab must be active and not minimized
2. **Check the page URL**: Cannot capture chrome://, chrome-extension://, or file:// URLs
3. **Reload the extension**: Go to chrome://extensions, find AI Sidekick, and click the refresh button
4. **Grant permissions**: Ensure the extension has all necessary permissions in chrome://extensions
5. **Try a different page**: Navigate to a regular website (e.g., google.com) and try again
6. **Check console**: Right-click the extension icon → "Inspect popup" to see detailed error logs

#### "Screen sharing dialog appears"
If you see a screen sharing dialog:
1. **From the website** (e.g., ChatGPT): You're clicking the wrong button
   - Use the camera icon **inside the AI Sidekick side panel** instead
2. **From Chrome** ("Choose what to share"):
   - This occurs with newer Chrome versions or certain security policies
   - **Workaround**: The extension now uses a preview grid to avoid this dialog
   - The preview allows you to select areas for AI analysis without permission dialogs
   - For actual webpage screenshots, you may need to accept the dialog once

## Implementation Details

The extension uses multiple capture methods to provide flexibility:

### 1. **Preview Mode (Default Recommendation)**
- Uses Canvas API to create a grid preview
- No permission dialogs
- Instant access
- Good for selecting areas for AI analysis

### 2. **Full Screen Capture Mode**
- Uses `navigator.mediaDevices.getDisplayMedia()` with `ImageCapture` API
- Shows Chrome's screen sharing permission dialog
- Captures actual webpage content
- Similar to your suggested code:
  ```javascript
  navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
      const track = stream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      imageCapture.grabFrame().then(bitmap => {
          // Process the captured frame
      });
  });
  ```

### 3. **Direct Clipboard Paste (NEW)**
- Use your OS screenshot tool (Windows: Win+Shift+S, Mac: Cmd+Shift+4)
- Click in the AI Sidekick chat input area
- Press Ctrl+V (Windows) or Cmd+V (Mac)
- The screenshot will automatically attach as a file
- No permission dialogs or overlays needed!

## Privacy Note
The screenshot feature only captures what you explicitly select and sends it directly to your chosen AI model. No screenshots are stored or transmitted elsewhere.

## File Structure
- `/service_worker.js`: Screenshot capture logic
- `/content/content.js`: Selection overlay and UI
- `/content/content.css`: Styling for overlay and context menu
- `/pages/Conversation.tsx`: Integration with chat interface