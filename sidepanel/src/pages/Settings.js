import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants.js';
import { Icon } from '../components/Icons.js';
import { useAppContext } from '../context/AppContext.js';

const Settings = () => {
  const { grainAmount, setGrainAmount, grainSize, setGrainSize, grainRoughness, setGrainRoughness } = useAppContext();

  const handleAmountChange = (e) => {
    setGrainAmount(parseInt(e.target.value));
  };

  const handleSizeChange = (e) => {
    setGrainSize(parseInt(e.target.value));
  };

  const handleRoughnessChange = (e) => {
    setGrainRoughness(parseInt(e.target.value));
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
          React.createElement('h3', { className: "text-sm font-medium text-text-primary mb-3" }, "Grain"),
          React.createElement('div', { className: "space-y-3" },
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "grain-amount-slider", className: "flex justify-between items-center text-xs font-medium text-text-secondary mb-1" },
                React.createElement('span', null, "Amount"),
                React.createElement('span', { className: "font-mono text-xs bg-layer-02 px-2 py-1 rounded" }, grainAmount)
              ),
              React.createElement('input', {
                id: "grain-amount-slider",
                type: "range",
                min: "1",
                max: "100",
                step: "1",
                value: grainAmount,
                onChange: handleAmountChange,
                className: "w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "grain-size-slider", className: "flex justify-between items-center text-xs font-medium text-text-secondary mb-1" },
                React.createElement('span', null, "Size"),
                React.createElement('span', { className: "font-mono text-xs bg-layer-02 px-2 py-1 rounded" }, grainSize)
              ),
              React.createElement('input', {
                id: "grain-size-slider",
                type: "range",
                min: "1",
                max: "100",
                step: "1",
                value: grainSize,
                onChange: handleSizeChange,
                className: "w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "grain-roughness-slider", className: "flex justify-between items-center text-xs font-medium text-text-secondary mb-1" },
                React.createElement('span', null, "Roughness"),
                React.createElement('span', { className: "font-mono text-xs bg-layer-02 px-2 py-1 rounded" }, grainRoughness)
              ),
              React.createElement('input', {
                id: "grain-roughness-slider",
                type: "range",
                min: "1",
                max: "100",
                step: "1",
                value: grainRoughness,
                onChange: handleRoughnessChange,
                className: "w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
              })
            )
          )
        )
      )
    )
  );
};

export default Settings;
