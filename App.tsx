import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Search from './pages/Search';
import Conversation from './pages/Conversation';
import Options from './pages/Options';
import Models from './pages/Models';
import Settings from './pages/Settings';
import { AppContextProvider } from './context/AppContext';
import { PANEL_ROUTES } from './constants';
import { Icon } from './components/Icons';

const pageTitles: { [key: string]: string } = {
  [PANEL_ROUTES.CONVERSATION]: 'Jain',
  [PANEL_ROUTES.OPTIONS]: 'Quick Actions',
  [PANEL_ROUTES.MODELS]: 'AI Models',
  [PANEL_ROUTES.SETTINGS]: 'Settings',
  [PANEL_ROUTES.SEARCH]: 'AI Search',
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const title = pageTitles[location.pathname] || 'Jain';
  
  const handleNewChat = () => {
    window.location.hash = PANEL_ROUTES.CONVERSATION;
    window.location.reload();
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
    <header className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white flex-shrink-0">
      {showBackButton ? (
        <button onClick={handleGoToMain} className="flex items-center gap-3 group" aria-label="Go to main screen">
          <Icon name="ArrowLeftIcon" className="w-6 h-6 text-gray-500 group-hover:text-gray-900" />
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </button>
      ) : (
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>
      )}
      <div className="flex items-center gap-4">
        {location.pathname === PANEL_ROUTES.CONVERSATION && (
          <>
            <button onClick={handleNewChat} className="text-gray-500 hover:text-blue-500" aria-label="New Chat">
              <Icon name="ChatBubbleBottomCenterPlusIcon" className="w-6 h-6" />
            </button>
            <button className="text-gray-500 hover:text-blue-500" aria-label="History">
              <Icon name="ClockIcon" className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </header>
  );
};


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-800">
      <Header />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppContextProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path={PANEL_ROUTES.CONVERSATION} element={<Conversation />} />
            <Route path="/conversation" element={<Navigate to="/" replace />} />
            <Route path={PANEL_ROUTES.SEARCH} element={<Search />} />
            <Route path={PANEL_ROUTES.OPTIONS} element={<Options />} />
            <Route path={PANEL_ROUTES.MODELS} element={<Models />} />
            <Route path={PANEL_ROUTES.SETTINGS} element={<Settings />} />
          </Routes>
        </Layout>
      </HashRouter>
    </AppContextProvider>
  );
};

export default App;