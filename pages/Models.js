import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { DEFAULT_MODELS } from '../constants.js';
import { Icon } from '../components/Icons.js';

const Models = () => {
    const [models] = useLocalStorage('ai_models', DEFAULT_MODELS);

    return (
        React.createElement('div', { className: "p-4 bg-gray-50 h-full text-gray-800" },
            React.createElement('h1', { className: "text-xl font-bold mb-4" }, "AI Models"),
            React.createElement('p', { className: "text-gray-600 mb-6" }, "These are the AI models available for chat. API keys are managed automatically."),

            React.createElement('div', { className: "space-y-2" },
                models.map((model) => (
                    React.createElement('div', {
                        key: model.id,
                        className: "flex items-center p-3 bg-white rounded-lg border border-gray-200"
                    },
                        React.createElement(Icon, { name: "CpuChipIcon", className: "w-6 h-6 text-blue-500 mr-4" }),
                        React.createElement('span', { className: "flex-1 font-medium" }, model.name),
                        model.isDefault && (
                            React.createElement('span', { className: "text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-1 rounded-full" }, "Default")
                        )
                    )
                ))
            )
        )
    );
};

export default Models;
