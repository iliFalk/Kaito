
import React, { useState } from 'react';
import type { AIModel } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS } from '../constants';
import { Icon } from '../components/Icons';

const ModelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (model: AIModel) => void;
}> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({
            id: name.trim(),
            name: name.trim(),
        });
        setName('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Add AI Model</h2>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Model Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)}
                               className="w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                               placeholder="e.g., gemini-2.5-flash" />
                         <p className="text-xs text-gray-500 mt-1">Enter the exact name of the model.</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500">Save</button>
                </div>
            </div>
        </div>
    );
};


const Models: React.FC = () => {
    const [models, setModels] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveModel = (model: AIModel) => {
        // Avoid duplicates
        if (!models.find(m => m.id === model.id)) {
            setModels([...models, model]);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this model?")) {
            setModels(models.filter(s => s.id !== id));
        }
    };

    return (
        <div className="p-4 bg-gray-50 h-full text-gray-800">
            <h1 className="text-xl font-bold mb-4">Manage AI Models</h1>
            <p className="text-gray-600 mb-6">Add or remove AI models available for chat.</p>

            <div className="space-y-2">
                {models.map((model) => (
                    <div
                        key={model.id}
                        className="flex items-center p-3 bg-white rounded-lg border border-gray-200"
                    >
                        <Icon name="CpuChipIcon" className="w-6 h-6 text-blue-500 mr-4" />
                        <span className="flex-1 font-medium">{model.name}</span>
                        {model.isDefault ? (
                            <span className="text-xs text-gray-500 mr-2">Default</span>
                        ) : (
                             <button onClick={() => handleDelete(model.id)} className="p-1 hover:bg-gray-100 rounded-full">
                                <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={() => setIsModalOpen(true)} className="mt-6 w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors">
                Add New Model
            </button>

            <ModelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveModel}
            />
        </div>
    );
};

export default Models;
