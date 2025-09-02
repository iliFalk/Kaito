
import React, { createContext, useState, useContext, useMemo } from 'react';

interface AppContextType {
  searchText: string;
  setSearchText: (text: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchText, setSearchText] = useState('');

  const value = useMemo(() => ({
    searchText,
    setSearchText,
  }), [searchText]);

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
