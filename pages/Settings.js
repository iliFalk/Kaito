
import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants.js';
import { Icon } from '../components/Icons.js';

const Settings = () => {
  return (
    React.createElement('div', { className: "p-4 bg-gray-50 h-full text-gray-800" },
      React.createElement('div', { className: "space-y-3" },
        React.createElement(NavLink, { 
          to: PANEL_ROUTES.OPTIONS, 
          className: "flex items-center w-full p-4 text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        },
          React.createElement(Icon, { name: "PencilIcon", className: "w-6 h-6 mr-4 text-gray-500" }),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold" }, "Quick Action Shortcuts"),
            React.createElement('p', { className: "text-sm text-gray-500" }, "Customize and reorder your one-click prompts.")
          )
        ),
        React.createElement(NavLink, { 
          to: PANEL_ROUTES.MODELS, 
          className: "flex items-center w-full p-4 text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        },
          React.createElement(Icon, { name: "CpuChipIcon", className: "w-6 h-6 mr-4 text-gray-500" }),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold" }, "Manage AI Models"),
            React.createElement('p', { className: "text-sm text-gray-500" }, "Add or remove AI models available for chat.")
          )
        )
      )
    )
  );
};

export default Settings;
