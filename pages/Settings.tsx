import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants';
import { Icon } from '../components/Icons';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
  const { grainAmount = 80, setGrainAmount, grainSize = 50, setGrainSize, grainRoughness = 50, setGrainRoughness } = useAppContext();

  return (
    <div className="p-4 h-full">
      <div className="space-y-3">
        <NavLink 
          to={PANEL_ROUTES.OPTIONS} 
          className="flex items-center w-full p-4 bg-layer-01 rounded-lg border border-border-strong hover:bg-layer-hover transition-colors"
        >
          <Icon name="PencilIcon" className="w-6 h-6 mr-4 text-text-secondary" />
          <div>
            <p className="font-semibold text-text-primary">Quick Action Shortcuts</p>
            <p className="text-sm text-text-secondary">Customize and reorder your one-click prompts.</p>
          </div>
        </NavLink>
        <NavLink 
          to={PANEL_ROUTES.MODELS} 
          className="flex items-center w-full p-4 bg-layer-01 rounded-lg border border-border-strong hover:bg-layer-hover transition-colors"
        >
          <Icon name="CpuChipIcon" className="w-6 h-6 mr-4 text-text-secondary" />
          <div>
            <p className="font-semibold text-text-primary">Manage AI Models</p>
            <p className="text-sm text-text-secondary">Add or remove AI models available for chat.</p>
          </div>
        </NavLink>
      </div>

      <div className="mt-6 pt-4 border-t border-border-strong">
        <h2 className="text-base font-semibold text-text-primary mb-3">Appearance</h2>
        <div className="space-y-4">
          <div className="p-4 bg-layer-01 rounded-lg border border-border-strong">
            <h3 className="text-sm font-medium text-text-primary mb-3">Grain</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="grain-amount-slider" className="flex justify-between items-center text-sm font-medium text-text-primary mb-2">
                  <span>Amount</span>
                  <span className="font-mono text-xs bg-layer-02 px-2 py-1 rounded">{grainAmount}</span>
                </label>
                <input
                  id="grain-amount-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={grainAmount}
                  onChange={(e) => setGrainAmount(parseInt(e.target.value))}
                  className="w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
                />
              </div>
              <div>
                <label htmlFor="grain-size-slider" className="flex justify-between items-center text-sm font-medium text-text-primary mb-2">
                  <span>Size</span>
                  <span className="font-mono text-xs bg-layer-02 px-2 py-1 rounded">{grainSize}</span>
                </label>
                <input
                  id="grain-size-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={grainSize}
                  onChange={(e) => setGrainSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
                />
              </div>
              <div>
                <label htmlFor="grain-roughness-slider" className="flex justify-between items-center text-sm font-medium text-text-primary mb-2">
                  <span>Roughness</span>
                  <span className="font-mono text-xs bg-layer-02 px-2 py-1 rounded">{grainRoughness}</span>
                </label>
                <input
                  id="grain-roughness-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={grainRoughness}
                  onChange={(e) => setGrainRoughness(parseInt(e.target.value))}
                  className="w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
