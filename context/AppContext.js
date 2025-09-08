import React from 'react';
import { Sender } from '../types.js';

const { createContext, useState, useContext, useMemo, useEffect, useCallback } = React;

const AppContext = createContext(undefined);

export const AppContextProvider = ({ children }) => {
  const [searchText, setSearchText] = useState('');
  const [conversations, setConversations] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  
  // Shortcut Action State
  const [pendingShortcutAction, setPendingShortcutAction] = useState(null);
  
  // Quoted Text State
  const [pendingQuotedText, setPendingQuotedTextState] = useState(null);

  // Context Menu State
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');

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

  const selectConversation = (id) => {
    if (conversations[id]) {
      setCurrentConversationId(id);
    }
  };

  const deleteConversation = (id) => {
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
  
  const addMessage = (conversationId, message) => {
    setConversations(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
    }));
  };

  const updateStreamingMessage = (conversationId, messageId, chunk, isDone, error) => {
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

  const getConversationHistory = (id) => {
      const messages = conversations[id] || [];
      const historyMessages = messages.filter(m => !(m.sender === Sender.AI && m.isStreaming));
      
      return historyMessages.map(msg => ({
          role: msg.sender === Sender.User ? 'user' : 'model',
          parts: [{ text: msg.text }]
      }));
  };

  const startConversationWithShortcut = useCallback((shortcut, selectedText) => {
    setPendingShortcutAction({ shortcut, selectedText });
  }, []);

  const clearPendingShortcutAction = useCallback(() => {
    setPendingShortcutAction(null);
  }, []);

  const setPendingQuotedText = useCallback((text) => {
    setPendingQuotedTextState(text);
  }, []);

  const clearPendingQuotedText = useCallback(() => {
    setPendingQuotedTextState(null);
  }, []);

  const showContextMenu = useCallback((position, text) => {
    setIsContextMenuVisible(true);
    setContextMenuPosition(position);
    setSelectedText(text);
  }, []);

  const hideContextMenu = useCallback(() => {
    setIsContextMenuVisible(false);
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
    pendingQuotedText,
    setPendingQuotedText,
    clearPendingQuotedText,
    isContextMenuVisible,
    contextMenuPosition,
    selectedText,
    hideContextMenu,
    showContextMenu,
  }), [searchText, conversations, currentConversationId, startConversationWithShortcut, pendingShortcutAction, clearPendingShortcutAction, pendingQuotedText, setPendingQuotedText, clearPendingQuotedText, isContextMenuVisible, contextMenuPosition, selectedText, hideContextMenu, showContextMenu]);

  return (
    React.createElement(AppContext.Provider, { value: value },
      children
    )
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};