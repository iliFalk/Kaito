import React, { createContext, useState, useContext, useMemo, useEffect, useCallback } from 'react';
import type { Message, Shortcut } from '../types';
import { Sender } from '../types';

interface AppContextType {
  searchText: string;
  setSearchText: (text: string) => void;
  
  // Conversation state
  conversations: Record<string, Message[]>;
  currentConversationId: string | null;
  newChat: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateStreamingMessage: (conversationId: string, messageId: string, chunk: string, isDone: boolean, error?: string) => void;
  getConversationHistory: (id: string) => { role: string; parts: { text: string }[] }[];

  // Shortcut Action State
  startConversationWithShortcut: (shortcut: Shortcut, selectedText: string) => void;
  pendingShortcutAction: { shortcut: Shortcut; selectedText: string } | null;
  clearPendingShortcutAction: () => void;

  // FIX: Add missing properties for context menu state and actions.
  isContextMenuVisible: boolean;
  contextMenuPosition: { top: number; left: number };
  selectedText: string;
  hideContextMenu: () => void;
  showContextMenu: (top: number, left: number, text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // Shortcut Action State
  const [pendingShortcutAction, setPendingShortcutAction] = useState<{ shortcut: Shortcut; selectedText: string } | null>(null);

  // Context Menu State
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

  const showContextMenu = useCallback((top: number, left: number, text: string) => {
    setContextMenuPosition({ top, left });
    setSelectedText(text);
    setIsContextMenuVisible(true);
  }, []);

  const hideContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
  }, []);

  const newChat = () => {
    const newId = Date.now().toString();
    setConversations(prev => ({ ...prev, [newId]: [] }));
    setCurrentConversationId(newId);
  };

  useEffect(() => {
    if (Object.keys(conversations).length === 0) {
      newChat();
    }
  }, []);

  const selectConversation = (id: string) => {
    if (conversations[id]) {
      setCurrentConversationId(id);
    }
  };

  const deleteConversation = (id: string) => {
    const newConversations = { ...conversations };
    delete newConversations[id];
    setConversations(newConversations);

    if (id === currentConversationId) {
      const remainingIds = Object.keys(newConversations);
      if (remainingIds.length > 0) {
        setCurrentConversationId(remainingIds[0]);
      } else {
        newChat();
      }
    }
  };
  
  const addMessage = (conversationId: string, message: Message) => {
    setConversations(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
    }));
  };

  const updateStreamingMessage = (conversationId: string, messageId: string, chunk: string, isDone: boolean, error?: string) => {
      setConversations(prev => {
          const newConversations = { ...prev };
          const conversationMessages = newConversations[conversationId] || [];
          const messageIndex = conversationMessages.findIndex(m => m.id === messageId);
          
          if (messageIndex > -1) {
              const updatedMessage = { ...conversationMessages[messageIndex] };
              updatedMessage.text += chunk;
              if (isDone) {
                  updatedMessage.isStreaming = false;
              }
              if (error) {
                  updatedMessage.error = error;
              }
              newConversations[conversationId] = [
                  ...conversationMessages.slice(0, messageIndex),
                  updatedMessage,
                  ...conversationMessages.slice(messageIndex + 1)
              ];
          }
          return newConversations;
      });
  };

  const getConversationHistory = (id: string) => {
      const messages = conversations[id] || [];
      const historyMessages = messages.filter(m => !(m.sender === Sender.AI && m.isStreaming));
      
      return historyMessages.map(msg => ({
          role: msg.sender === Sender.User ? 'user' : 'model',
          parts: [{ text: msg.text }]
      }));
  };

  const startConversationWithShortcut = useCallback((shortcut: Shortcut, selectedText: string) => {
    setPendingShortcutAction({ shortcut, selectedText });
  }, []);

  const clearPendingShortcutAction = useCallback(() => {
    setPendingShortcutAction(null);
  }, []);

  const value = useMemo(() => ({
    searchText,
    setSearchText,
    conversations,
    currentConversationId,
    newChat,
    selectConversation,
    deleteConversation,
    addMessage,
    updateStreamingMessage,
    getConversationHistory,
    startConversationWithShortcut,
    pendingShortcutAction,
    clearPendingShortcutAction,
    isContextMenuVisible,
    contextMenuPosition,
    selectedText,
    showContextMenu,
    hideContextMenu,
  }), [searchText, conversations, currentConversationId, newChat, selectConversation, deleteConversation, addMessage, updateStreamingMessage, getConversationHistory, startConversationWithShortcut, pendingShortcutAction, clearPendingShortcutAction, isContextMenuVisible, contextMenuPosition, selectedText, showContextMenu, hideContextMenu]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
