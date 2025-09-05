
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Search from './pages/Search';
import Conversation from './pages/Conversation';
import Options from './pages/Options';
import Models from './pages/Models';
import Settings from './pages/Settings';
import { AppContextProvider, useAppContext } from './context/AppContext';
import { PANEL_ROUTES } from './constants';
import { Icon } from './components/Icons';
import NeuralAnimation from './components/NeuralAnimation';

const pageTitles: { [key:string]: string } = {
  [PANEL_ROUTES.CONVERSATION]: 'Jain',
  [PANEL_ROUTES.OPTIONS]: 'Quick Actions',
  [PANEL_ROUTES.MODELS]: 'AI Models',
  [PANEL_ROUTES.SETTINGS]: 'Settings',
  [PANEL_ROUTES.SEARCH]: 'AI Search',
};

const HistoryModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
  const { conversations, selectConversation, deleteConversation, newChat, currentConversationId } = useAppContext();

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (Object.keys(conversations).length > 1) {
        if(window.confirm("Are you sure you want to delete this conversation?")) {
            deleteConversation(id);
        }
    }
  };
  
  const handleNewChat = () => {
    newChat();
    onClose();
  };
  
  const sortedConversations = Object.entries(conversations).sort(([idA], [idB]) => Number(idB) - Number(idA));

  return (
    <div 
      className={`fixed inset-0 z-30 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose} 
      role="dialog" 
      aria-modal="true"
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div 
        className={`
          absolute top-0 inset-x-0 bg-white shadow-xl 
          border-b border-gray-200 
          flex flex-col max-h-[calc(100vh-6rem)]
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0' : '-translate-y-full'}
        `}
        style={{ top: '4rem' }} // Positioned below the header
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
        </div>
        <div className="p-2 space-y-1 overflow-y-auto flex-1">
          {sortedConversations.map(([id, messages]) => {
            const firstUserMessage = messages.find(m => m.sender === 'user');
            const title = firstUserMessage?.text || "New Chat";
            const isActive = id === currentConversationId;
            return (
              <div
                key={id}
                onClick={() => handleSelectConversation(id)}
                className={`flex items-center p-2.5 rounded-md cursor-pointer group transition-colors ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
              >
                <Icon name="ChatBubbleLeftIcon" className={`w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`flex-1 font-medium truncate pr-2 ${isActive ? 'text-blue-800' : 'text-gray-800'}`} title={title}>{title}</span>
                <button
                  onClick={(e) => handleDelete(e, id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Delete conversation"
                  disabled={Object.keys(conversations).length <= 1}
                >
                  <Icon name="TrashIcon" className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="p-3 bg-gray-50/70 border-t border-gray-200 flex-shrink-0">
          <button onClick={handleNewChat} className="w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors">
            Start New Chat
          </button>
        </div>
      </div>
    </div>
  );
};


const Header: React.FC<{ onHistoryClick: () => void; }> = ({ onHistoryClick }) => {
  const { newChat } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Jain';
  
  const handleNewChat = () => {
    if (location.pathname !== PANEL_ROUTES.CONVERSATION) {
        navigate(PANEL_ROUTES.CONVERSATION);
    }
    newChat();
  };

  const showBackButton = [
    PANEL_ROUTES.OPTIONS,
    PANEL_ROUTES.MODELS,
    PANEL_ROUTES.SETTINGS,
  ].includes(location.pathname);

  const handleGoToMain = () => {
    navigate(PANEL_ROUTES.CONVERSATION);
  };

  return (
    <header className="relative z-40 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white flex-shrink-0">
      {showBackButton ? (
        <button onClick={handleGoToMain} className="flex items-center gap-3 group" aria-label="Go to main screen">
          <Icon name="ArrowLeftIcon" className="w-6 h-6 text-gray-500 group-hover:text-gray-900" />
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          {title === 'Jain' && location.pathname === PANEL_ROUTES.CONVERSATION ? (
            <NeuralAnimation />
          ) : (
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
          )}
        </div>
      )}
      <div className="flex items-center gap-4">
        {location.pathname === PANEL_ROUTES.CONVERSATION && (
          <>
            <button onClick={handleNewChat} className="text-gray-500 hover:text-blue-500" aria-label="New Chat">
              <Icon name="ChatBubbleBottomCenterPlusIcon" className="w-6 h-6" />
            </button>
            <button onClick={onHistoryClick} className="text-gray-500 hover:text-blue-500" aria-label="History">
              <Icon name="ClockIcon" className="w-6 h-6" />
            </button>
            <button onClick={() => navigate(PANEL_ROUTES.SETTINGS)} className="text-gray-500 hover:text-blue-500" aria-label="Settings">
              <Icon name="Cog6ToothIcon" className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { startConversationWithShortcut } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    // FIX: Cannot find name 'chrome'. Access via window to avoid TS errors.
    const chrome = (window as any).chrome;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        const handleMessage = (request: any) => {
            if (request.type === 'executeShortcut') {
                if (request.shortcut.id === 'settings') {
                    navigate(PANEL_ROUTES.OPTIONS);
                } else {
                    startConversationWithShortcut(request.shortcut, request.selectedText);
                    navigate(PANEL_ROUTES.CONVERSATION);
                }
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            chrome.runtime.onMessage.removeListener(handleMessage);
        };
    }
  }, [startConversationWithShortcut, navigate]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      <Header onHistoryClick={() => setIsHistoryOpen(prev => !prev)} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path={PANEL_ROUTES.CONVERSATION} element={<Conversation />} />
            <Route path="/conversation" element={<Navigate to="/" replace />} />
            <Route path={PANEL_ROUTES.SEARCH} element={<Search />} />
            <Route path={PANEL_ROUTES.OPTIONS} element={<Options />} />
            <Route path={PANEL_ROUTES.MODELS} element={<Models />} />
            <Route path={PANEL_ROUTES.SETTINGS} element={<Settings />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <HashRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </HashRouter>
    </AppContextProvider>
  );
};

export default App;
