const DEFAULT_SHORTCUTS = [
  { id: 'summarize', icon: 'DocumentTextIcon', title: 'Summarize', prompt: 'Summarize the following text:\n\n{{selected_text}}', isDefault: true },
  { id: 'translate', icon: 'LanguageIcon', title: 'Translate to English', prompt: 'Translate the following text to English:\n\n{{selected_text}}', isDefault: true },
  { id: 'grammar', icon: 'CheckCircleIcon', title: 'Check Grammar', prompt: 'Check the grammar and spelling of the following text and provide corrections:\n\n{{selected_text}}', isDefault: true },
  { id: 'explain', icon: 'QuestionMarkCircleIcon', title: 'Explain This', prompt: 'Explain the following concept in simple terms:\n\n{{selected_text}}', isDefault: true },
];

// On extension installation, set up the default shortcuts in storage if they don't exist.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('shortcuts', (data) => {
    if (!data.shortcuts) {
      chrome.storage.local.set({ shortcuts: DEFAULT_SHORTCUTS });
    }
  });
});

// Configure the side panel to open when the user clicks the extension's action icon.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Main message listener for routing messages between different parts of the extension.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handles a request from the content script to execute a shortcut action.
  if (request.type === 'executeShortcut') {
    // Open the side panel in the tab where the shortcut was triggered.
    if (sender.tab && sender.tab.id) {
        chrome.sidePanel.open({ tabId: sender.tab.id });
    }
    // Forward the message to the side panel to perform the action.
    chrome.runtime.sendMessage(request);
    return; // No async response needed.
  }
  
  // Handles a request from the content script to get the current list of shortcuts.
  else if (request.type === 'getShortcuts') {
    chrome.storage.local.get('shortcuts', (data) => {
      const shortcuts = data.shortcuts || DEFAULT_SHORTCUTS;
      sendResponse({ shortcuts });
    });
    return true; // Indicates that the response is sent asynchronously.
  }
  
  // Handles capture tab request - captures current tab without permission dialog
  else if (request.type === 'captureTab') {
    // Get the sender tab ID or use active tab
    const tabId = sender.tab?.id;
    if (tabId) {
      // Get tab info first to check if it's capturable
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: 'Failed to get tab info: ' + chrome.runtime.lastError.message });
          return;
        }
        
        chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('AI Sidekick: Failed to capture tab:', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ dataUrl: dataUrl });
          }
        });
      });
    } else {
      // Fallback: capture active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error('AI Sidekick: Failed to capture tab:', chrome.runtime.lastError);
              sendResponse({ error: chrome.runtime.lastError.message });
            } else {
              sendResponse({ dataUrl: dataUrl });
            }
          });
        } else {
          sendResponse({ error: 'No active tab found' });
        }
      });
    }
    return true; // Indicates async response
  }
  
  // Handles screenshot requests - use alternative method to avoid permission dialog
  else if (request.type === 'initiateScreenshot') {
    // Received from side panel. Send request to content script to capture using DOM
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        const tab = tabs[0];
        
        // Check if the tab URL is capturable
        if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:') || tab.url === 'chrome://newtab/')) {
          chrome.runtime.sendMessage({
            type: 'screenshotError',
            error: 'Cannot capture screenshots on Chrome internal pages. Please navigate to a regular website.'
          });
          return;
        }
        
        // Send message to content script to initiate DOM-based capture
        chrome.tabs.sendMessage(tab.id, {
          type: 'initiateDOMCapture'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('AI Sidekick: Failed to initiate DOM capture:', chrome.runtime.lastError);
            
            // Fallback: Try chrome.tabs.captureVisibleTab (this might show permission dialog)
            console.log('AI Sidekick: Attempting fallback capture method...');
            chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, (dataUrl) => {
              if (chrome.runtime.lastError) {
                chrome.runtime.sendMessage({
                  type: 'screenshotError',
                  error: `Screen capture failed: ${chrome.runtime.lastError.message}. Try refreshing the page.`
                });
              } else {
                chrome.tabs.sendMessage(tab.id, {
                  type: 'screenshotCaptured',
                  dataUrl: dataUrl
                });
              }
            });
          }
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'screenshotError',
          error: 'No active tab found'
        });
      }
    });
    return;
  }

  else if (request.type === 'screenshotAction') {
    // Received from content script with action type. Forward to the side panel.
    chrome.runtime.sendMessage({
      type: 'screenshotAction',
      action: request.action,
      dataUrl: request.dataUrl
    });
    return; // No async response needed.
  }

  else if (request.type === 'screenshotTaken') {
    // Received from content script. Forward to the side panel.
    // Forward the *same* message type to the side panel.
    chrome.runtime.sendMessage({ type: 'screenshotTaken', dataUrl: request.dataUrl });
    return; // No async response needed.
  }
});
