import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants';
import { Icon } from '../components/Icons';

const Settings: React.FC = () => {
  return (
    <div className="p-4 h-full text-gray-200">
      <div className="space-y-3">
        <NavLink 
          to={PANEL_ROUTES.OPTIONS} 
          className="flex items-center w-full p-4 text-gray-200 bg-[#3c3c3c] rounded-lg border border-[#5a5a5a] hover:bg-[#5a5a5a] transition-colors"
        >
          <Icon name="PencilIcon" className="w-6 h-6 mr-4 text-gray-400" />
          <div>
            <p className="font-semibold">Quick Action Shortcuts</p>
            <p className="text-sm text-gray-400">Customize and reorder your one-click prompts.</p>
          </div>
        </NavLink>
        <NavLink 
          to={PANEL_ROUTES.MODELS} 
          className="flex items-center w-full p-4 text-gray-200 bg-[#3c3c3c] rounded-lg border border-[#5a5a5a] hover:bg-[#5a5a5a] transition-colors"
        >
          <Icon name="CpuChipIcon" className="w-6 h-6 mr-4 text-gray-400" />
          <div>
            <p className="font-semibold">Manage AI Models</p>
            <p className="text-sm text-gray-400">Add or remove AI models available for chat.</p>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Settings;