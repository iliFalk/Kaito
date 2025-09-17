import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Search from './pages/Search.js';
import Conversation from './pages/Conversation.js';
import Options from './pages/Options.js';
import Models from './pages/Models.js';
import Settings from './pages/Settings.js';
import { AppContextProvider, useAppContext } from './context/AppContext.js';
import { PANEL_ROUTES } from './constants.js';
import { Icon } from './components/Icons.js';
import NeuralAnimation from './components/NeuralAnimation.js';

const { useState, useEffect } = React;

const pageTitles = {
  [PANEL_ROUTES.CONVERSATION]: 'Jain',
  [PANEL_ROUTES.OPTIONS]: 'Quick Actions',
  [PANEL_ROUTES.MODELS]: 'AI Models',
  [PANEL_ROUTES.SETTINGS]: 'Settings',
  [PANEL_ROUTES.SEARCH]: 'AI Search',
};

const HistoryModal = ({ isOpen, onClose }) => {
  const { conversations, selectConversation, deleteConversation, newChat, currentConversationId } = useAppContext();

  const handleSelectConversation = (id) => {
    selectConversation(id);
    onClose();
  };

  const handleDelete = (e, id) => {
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
    React.createElement('div', { 
      className: `fixed inset-0 z-30 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`,
      onClick: onClose, 
      role: "dialog", 
      'aria-modal': "true",
      'aria-hidden': !isOpen
    },
      React.createElement('div', { className: "absolute inset-0 bg-black/40" }),
      React.createElement('div', { 
        className: `
          absolute top-0 inset-x-0 bg-white shadow-xl 
          border-b border-gray-200 
          flex flex-col max-h-[calc(100vh-6rem)]
          transform transition-all duration-300 ease-out
          ${isOpen ? 'translate-y-0' : '-translate-y-full'}
        `,
        style: { top: '4rem' },
        onClick: e => e.stopPropagation()
      },
        React.createElement('div', { className: "p-4 border-b border-gray-200 flex-shrink-0" },
          React.createElement('h2', { className: "text-lg font-semibold text-gray-800" }, "Chat History")
        ),
        React.createElement('div', { className: "p-2 space-y-1 overflow-y-auto flex-1" },
          sortedConversations.map(([id, messages]) => {
            const firstUserMessage = messages.find(m => m.sender === 'user');
            const title = firstUserMessage?.text || "New Chat";
            const isActive = id === currentConversationId;
            return (
              React.createElement('div', {
                key: id,
                onClick: () => handleSelectConversation(id),
                className: `flex items-center p-2.5 rounded-md cursor-pointer group transition-colors ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`
              },
                React.createElement(Icon, { name: "ChatBubbleLeftIcon", className: `w-5 h-5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}` }),
                React.createElement('span', { className: `flex-1 font-medium truncate pr-2 ${isActive ? 'text-blue-800' : 'text-gray-800'}`, title: title }, title),
                React.createElement('button', {
                  onClick: (e) => handleDelete(e, id),
                  className: "p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
                  'aria-label': "Delete conversation",
                  disabled: Object.keys(conversations).length <= 1
                },
                  React.createElement(Icon, { name: "TrashIcon", className: "w-4 h-4" })
                )
              )
            );
          })
        ),
        React.createElement('div', { className: "p-3 bg-gray-50/70 border-t border-gray-200 flex-shrink-0" },
          React.createElement('button', { onClick: handleNewChat, className: "w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors" },
            "Start New Chat"
          )
        )
      )
    )
  );
};


const Header = ({ onHistoryClick }) => {
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
    React.createElement('header', { className: "relative z-40 flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white flex-shrink-0" },
      showBackButton ? (
        React.createElement('button', { onClick: handleGoToMain, className: "flex items-center gap-3 group", 'aria-label': "Go to main screen" },
          React.createElement(Icon, { name: "ArrowLeftIcon", className: "w-6 h-6 text-gray-500 group-hover:text-gray-900" }),
          React.createElement('h1', { className: "text-xl font-bold text-gray-800" }, title)
        )
      ) : (
        React.createElement('div', { className: "flex items-center gap-3" },
          title === 'Jain' && location.pathname === PANEL_ROUTES.CONVERSATION ? (
            React.createElement(NeuralAnimation, null)
          ) : (
            React.createElement('h1', { className: "text-xl font-bold text-gray-800" }, title)
          )
        )
      ),
      React.createElement('div', { className: "flex items-center gap-4" },
        location.pathname === PANEL_ROUTES.CONVERSATION && (
          React.createElement(React.Fragment, null,
            React.createElement('button', { onClick: handleNewChat, className: "text-gray-500 hover:text-blue-500", 'aria-label': "New Chat" },
              React.createElement(Icon, { name: "ChatBubbleBottomCenterPlusIcon", className: "w-6 h-6" })
            ),
            React.createElement('button', { onClick: onHistoryClick, className: "text-gray-500 hover:text-blue-500", 'aria-label': "History" },
              React.createElement(Icon, { name: "ClockIcon", className: "w-6 h-6" })
            ),
            React.createElement('button', { onClick: () => navigate(PANEL_ROUTES.SETTINGS), className: "text-gray-500 hover:text-blue-500", 'aria-label': "Settings" },
              React.createElement(Icon, { name: "Cog6ToothIcon", className: "w-6 h-6" })
            )
          )
        )
      )
    )
  );
};


const Layout = ({ children }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { startConversationWithShortcut, setPendingQuotedText } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    const chrome = (window).chrome;
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        const handleMessage = (request) => {
            if (request.type === 'executeShortcut') {
                if (request.shortcut.id === 'settings') {
                    navigate(PANEL_ROUTES.OPTIONS);
                } else if (request.shortcut.id === 'quote') {
                    setPendingQuotedText(request.selectedText);
                    navigate(PANEL_ROUTES.CONVERSATION);
                } else {
                    startConversationWithShortcut(request.shortcut, request.selectedText);
                    navigate(PANEL_ROUTES.CONVERSATION);
                }
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);

        return () => {
            if (chrome.runtime.onMessage) {
                chrome.runtime.onMessage.removeListener(handleMessage);
            }
        };
    }
  }, [startConversationWithShortcut, navigate, setPendingQuotedText]);

  return (
    React.createElement('div', { className: "flex flex-col h-screen bg-gray-50 text-gray-800" },
      React.createElement(Header, { onHistoryClick: () => setIsHistoryOpen(prev => !prev) }),
      React.createElement('main', { className: "flex-1 overflow-y-auto" },
        children
      ),
      React.createElement(HistoryModal, { isOpen: isHistoryOpen, onClose: () => setIsHistoryOpen(false) })
    )
  );
};

const AppRoutes = () => {
    return (
        React.createElement(Routes, null,
            React.createElement(Route, { path: PANEL_ROUTES.CONVERSATION, element: React.createElement(Conversation, null) }),
            React.createElement(Route, { path: "/conversation", element: React.createElement(Navigate, { to: "/", replace: true }) }),
            React.createElement(Route, { path: PANEL_ROUTES.SEARCH, element: React.createElement(Search, null) }),
            React.createElement(Route, { path: PANEL_ROUTES.OPTIONS, element: React.createElement(Options, null) }),
            React.createElement(Route, { path: PANEL_ROUTES.MODELS, element: React.createElement(Models, null) }),
            React.createElement(Route, { path: PANEL_ROUTES.SETTINGS, element: React.createElement(Settings, null) })
        )
    );
};

const App = () => {
  return (
    React.createElement(AppContextProvider, null,
      React.createElement(HashRouter, null,
        React.createElement(Layout, null,
          React.createElement(AppRoutes, null)
        )
      )
    )
  );
};

export default App;
