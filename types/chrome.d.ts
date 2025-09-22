/**
 * Chrome Extension API type definitions
 * Add this file to ensure TypeScript recognizes Chrome APIs
 */

declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | object): Promise<any>;
      set(items: object): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }
    
    const local: StorageArea;
    const session: StorageArea;
    const sync: StorageArea;
  }
  
  namespace runtime {
    interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
    }
    
    function sendMessage(message: any, responseCallback?: (response: any) => void): void;
    const onMessage: {
      addListener(callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void): void;
      removeListener(callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => void): void;
    };
    
    const lastError: { message?: string } | undefined;
  }
  
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
    }
    
    function query(queryInfo: object, callback: (tabs: Tab[]) => void): void;
    function sendMessage(tabId: number, message: any, responseCallback?: (response: any) => void): void;
  }
  
  namespace sidePanel {
    function open(options: { tabId?: number; windowId?: number }): void;
    function setPanelBehavior(behavior: { openPanelOnActionClick: boolean }): Promise<void>;
  }
}

// Make chrome available globally
declare global {
  const chrome: typeof chrome;
}

export {};