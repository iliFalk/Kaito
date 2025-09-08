const DEFAULT_SHORTCUTS = [
  { id: 'summarize', icon: 'DocumentTextIcon', title: 'Summarize', prompt: 'Summarize the following text:\n\n{{selected_text}}', isDefault: true },
  { id: 'translate', icon: 'LanguageIcon', title: 'Translate to English', prompt: 'Translate the following text to English:\n\n{{selected_text}}', isDefault: true },
  { id: 'grammar', icon: 'CheckCircleIcon', title: 'Check Grammar', prompt: 'Check the grammar and spelling of the following text and provide corrections:\n\n{{selected_text}}', isDefault: true },
  { id: 'explain', icon: 'QuestionMarkCircleIcon', title: 'Explain This', prompt: 'Explain the following concept in simple terms:\n\n{{selected_text}}', isDefault: true },
];

// Set initial shortcuts in storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('shortcuts', (data) => {
    if (!data.shortcuts) {
      chrome.storage.local.set({ shortcuts: DEFAULT_SHORTCUTS });
    }
  });
});

// Toggles the side panel on the extension icon click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for messages from content script and side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'executeShortcut') {
    // A content script is asking to execute a shortcut.
    // Open the side panel for the tab that sent the message.
    if (sender.tab && sender.tab.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id });
    }
    
    // Forward the message to all parts of the extension (specifically, the side panel).
    chrome.runtime.sendMessage(request);

  } else if (request.type === 'getShortcuts') {
    // A content script is asking for the list of shortcuts.
    chrome.storage.local.get('shortcuts', (data) => {
      const shortcuts = data.shortcuts || DEFAULT_SHORTCUTS;
      sendResponse({ shortcuts });
    });
    return true; // Indicates that the response is sent asynchronously.
  } else if (request.type === 'initiateScreenshot') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'startScreenshotSelection' });
      }
    });
  } else if (request.type === 'screenshotTaken') {
    chrome.runtime.sendMessage({ type: 'screenshotReady', dataUrl: request.dataUrl });
  }
});
