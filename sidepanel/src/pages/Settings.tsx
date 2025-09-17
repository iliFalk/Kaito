
import React from 'react';
import { NavLink } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants';
import { Icon } from '../components/Icons';

const Settings: React.FC = () => {
  return (
    <div className="p-4 bg-gray-50 h-full text-gray-800">
      <div className="space-y-3">
        <NavLink 
          to={PANEL_ROUTES.OPTIONS} 
          className="flex items-center w-full p-4 text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Icon name="PencilIcon" className="w-6 h-6 mr-4 text-gray-500" />
          <div>
            <p className="font-semibold">Quick Action Shortcuts</p>
            <p className="text-sm text-gray-500">Customize and reorder your one-click prompts.</p>
          </div>
        </NavLink>
        <NavLink 
          to={PANEL_ROUTES.MODELS} 
          className="flex items-center w-full p-4 text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <Icon name="CpuChipIcon" className="w-6 h-6 mr-4 text-gray-500" />
          <div>
            <p className="font-semibold">Manage AI Models</p>
            <p className="text-sm text-gray-500">Add or remove AI models available for chat.</p>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default Settings;
