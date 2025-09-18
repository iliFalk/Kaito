

import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants.js';
import { Icon } from '../components/Icons.js';

const Settings = () => {
  return (
    React.createElement('div', { className: "p-4 h-full" },
      React.createElement('div', { className: "space-y-3" },
        React.createElement(NavLink, { 
          to: PANEL_ROUTES.OPTIONS, 
          className: "flex items-center w-full p-4 bg-layer-01 rounded-lg border border-border-strong hover:bg-layer-hover transition-colors"
        },
          React.createElement(Icon, { name: "PencilIcon", className: "w-6 h-6 mr-4 text-text-secondary" }),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold text-text-primary" }, "Quick Action Shortcuts"),
            React.createElement('p', { className: "text-sm text-text-secondary" }, "Customize and reorder your one-click prompts.")
          )
        ),
        React.createElement(NavLink, { 
          to: PANEL_ROUTES.MODELS, 
          className: "flex items-center w-full p-4 bg-layer-01 rounded-lg border border-border-strong hover:bg-layer-hover transition-colors"
        },
          React.createElement(Icon, { name: "CpuChipIcon", className: "w-6 h-6 mr-4 text-text-secondary" }),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold text-text-primary" }, "Manage AI Models"),
            React.createElement('p', { className: "text-sm text-text-secondary" }, "Add or remove AI models available for chat.")
          )
        )
      )
    )
  );
};

export default Settings;