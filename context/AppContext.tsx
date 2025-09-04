import React, { createContext, useState, useContext, useMemo } from 'react';

interface AppContextType {
  searchText: string;
  setSearchText: (text: string) => void;
  newChat: () => void;
  conversationKey: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchText, setSearchText] = useState('');
  const [conversationKey, setConversationKey] = useState(Date.now());

  const newChat = () => {
    setConversationKey(Date.now());
  };

  const value = useMemo(() => ({
    searchText,
    setSearchText,
    newChat,
    conversationKey,
  }), [searchText, conversationKey]);

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