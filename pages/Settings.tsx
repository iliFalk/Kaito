import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants';
import { Icon } from '../components/Icons';
import { useAppContext } from '../context/AppContext';

const Settings: React.FC = () => {
  const { filmGrain, setFilmGrain, filmGrainSize, setFilmGrainSize } = useAppContext();

  const handleGrainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilmGrain(parseFloat(e.target.value));
  };

  const handleGrainSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilmGrainSize(parseInt(e.target.value));
  };

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
            <label htmlFor="film-grain-slider" className="flex justify-between items-center text-sm font-medium text-text-primary mb-2">
              <span>Film Grain Intensity</span>
              <span className="font-mono text-xs bg-layer-02 px-2 py-1 rounded">{Math.round(filmGrain * 100)}%</span>
            </label>
            <input
              id="film-grain-slider"
              type="range"
              min="0"
              max="0.2"
              step="0.01"
              value={filmGrain}
              onChange={handleGrainChange}
              className="w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
            />
          </div>
          <div className="p-4 bg-layer-01 rounded-lg border border-border-strong">
            <label htmlFor="film-grain-size-slider" className="flex justify-between items-center text-sm font-medium text-text-primary mb-2">
              <span>Film Grain Size</span>
              <span className="font-mono text-xs bg-layer-02 px-2 py-1 rounded">{filmGrainSize}px</span>
            </label>
            <input
              id="film-grain-size-slider"
              type="range"
              min="50"
              max="300"
              step="10"
              value={filmGrainSize}
              onChange={handleGrainSizeChange}
              className="w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer accent-interactive"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
