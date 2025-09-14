import React from 'react';
import type { AIModel } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS } from '../constants';
import { Icon } from '../components/Icons';

const Models: React.FC = () => {
    const [models] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);

    return (
        <div className="p-4 bg-gray-50 h-full text-gray-800">
            <h1 className="text-xl font-bold mb-4">AI Models</h1>
            <p className="text-gray-600 mb-6">These are the AI models available for chat. API keys are managed automatically.</p>

            <div className="space-y-2">
                {models.map((model) => (
                    <div
                        key={model.id}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-200"
                    >
                        <Icon name="CpuChipIcon" className="w-6 h-6 text-blue-500 mr-4" />
                        <span className="flex-1 font-medium">{model.name}</span>
                        {model.isDefault && (
                            <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-1 rounded-full">Default</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Models;