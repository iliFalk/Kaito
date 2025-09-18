import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants';
import { Icon } from '../components/Icons';

const Settings: React.FC = () => {
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
    </div>
  );
};

export default Settings;