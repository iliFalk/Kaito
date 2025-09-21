import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants.js';
import { Icon } from '../components/Icons.js';
import { useAppContext } from '../context/AppContext.js';

const Settings = () => {
  const { filmGrain, setFilmGrain } = useAppContext();

  const handleGrainChange = (e) => {
    setFilmGrain(parseFloat(e.target.value));
  };

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
      ),
      React.createElement('div', { className: "mt-6 pt-4 border-t border-border-strong" },
        React.createElement('h2', { className: "text-base font-semibold text-text-primary mb-3" }, "Appearance"),
        React.createElement('div', { className: "p-4 bg-layer-01 rounded-lg border border-border-strong" },
          React.createElement('label', { htmlFor: "film-grain-slider", className: "flex justify-between items-center text-sm font-medium text-text-primary mb-2" },
            React.createElement('span', null, "Film Grain"),
            React.createElement('span', { className: "font-mono text-xs bg-layer-02 px-2 py-1 rounded" }, `${Math.round(filmGrain * 100)}%`)
          ),
          React.createElement('input', {
            id: "film-grain-slider",
            type: "range",
            min: "0",
            max: "0.2",
            step: "0.01",
            value: filmGrain,
            onChange: handleGrainChange,
            className: "w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
          })
        )
      )
    )
  );
};

export default Settings;
