import React, { useState, useEffect } from 'react';
import type { AIModel } from '../types';
import { ApiType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS } from '../constants';
import { Icon } from '../components/Icons';

const AIModelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (model: AIModel) => void;
    modelToEdit?: AIModel | null;
}> = ({ isOpen, onClose, onSave, modelToEdit }) => {
    const [apiType, setApiType] = useState<ApiType>(modelToEdit?.apiType || ApiType.Gemini);
    const [name, setName] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [contextWindow, setContextWindow] = useState<number | undefined>(undefined);
    const [temperature, setTemperature] = useState<number | undefined>(0.7);
    const [supportImage, setSupportImage] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (modelToEdit) {
                setApiType(modelToEdit.apiType || ApiType.Gemini);
                setName(modelToEdit.name || '');
                setModel(modelToEdit.model || '');
                setApiKey(modelToEdit.apiKey || '');
                setBaseUrl(modelToEdit.baseUrl || '');
                setContextWindow(modelToEdit.contextWindow);
                setTemperature(modelToEdit.temperature ?? 0.7);
                setSupportImage(modelToEdit.supportImage || false);
            } else {
                // Reset to default for new model
                setApiType(ApiType.Gemini);
                setName('');
                setModel('');
                setApiKey('');
                setBaseUrl('');
                setContextWindow(undefined);
                setTemperature(0.7);
                setSupportImage(false);
            }
        }
    }, [modelToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name || !model) {
            alert("Name and Model ID are required.");
            return;
        }
        if (apiType === ApiType.OpenAI && (!apiKey || !baseUrl)) {
            alert("API Key and Base URL are required for OpenAI compatible models.");
            return;
        }

        const modelToSave: AIModel = {
            id: modelToEdit?.id || Date.now().toString(),
            name,
            model,
            apiType,
            apiKey: apiType === ApiType.OpenAI ? apiKey : undefined,
            baseUrl: apiType === ApiType.OpenAI ? baseUrl : undefined,
            contextWindow,
            temperature,
            supportImage,
        };
        onSave(modelToSave);
        onClose();
    };

    const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTemperature(parseFloat(e.target.value));
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-layer-01 rounded-lg shadow-xl w-full max-w-lg border border-border-strong flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-border-strong">
                    <h2 className="text-lg font-semibold text-text-primary">{modelToEdit ? 'Edit AI Model' : 'Add New Model'}</h2>
                </div>
                <div className="p-4 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="apiType" className="block text-sm font-medium text-text-secondary mb-1">API Type</label>
                        <select id="apiType" value={apiType} onChange={e => setApiType(e.target.value as ApiType)}
                            className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive">
                            <option value={ApiType.Gemini}>Google Gemini</option>
                            <option value={ApiType.OpenAI}>OpenAI Compatible</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)}
                               className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive" 
                               placeholder="e.g., Gemini Flash" />
                    </div>
                    {apiType === ApiType.OpenAI && (
                        <>
                           <div>
                                <label htmlFor="baseUrl" className="block text-sm font-medium text-text-secondary mb-1">API Base URL</label>
                                <input type="text" id="baseUrl" value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                                          className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive"
                                          placeholder="e.g., https://api.openai.com/v1" />
                            </div>
                            <div>
                                <label htmlFor="apiKey" className="block text-sm font-medium text-text-secondary mb-1">API Key</label>
                                <input type="password" id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)}
                                          className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive"
                                          placeholder="Enter your API key" />
                            </div>
                        </>
                    )}
                     <div>
                        <label htmlFor="model" className="block text-sm font-medium text-text-secondary mb-1">Model ID</label>
                        <input type="text" id="model" value={model} onChange={e => setModel(e.target.value)}
                                  className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive"
                                  placeholder={apiType === ApiType.Gemini ? "e.g., gemini-2.5-flash" : "e.g., gpt-4"} />
                    </div>
                    <div>
                        <label htmlFor="contextWindow" className="block text-sm font-medium text-text-secondary mb-1">Context Window</label>
                        <input type="number" id="contextWindow" value={contextWindow || ''} onChange={e => setContextWindow(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                  className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive"
                                  placeholder="Optional, e.g., 8192" />
                    </div>
                     <div>
                        <label htmlFor="temperature" className="block text-sm font-medium text-text-secondary mb-1">Temperature</label>
                        <div className="flex items-center gap-4">
                            <input type="range" id="temperature" min="0" max="1" step="0.1" value={temperature} onChange={handleTempChange}
                                      className="w-full h-2 bg-layer-03 rounded-lg appearance-none cursor-pointer" />
                            <span className="font-mono text-sm text-text-secondary w-10 text-center">{temperature?.toFixed(1)}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="supportImage" checked={supportImage} onChange={e => setSupportImage(e.target.checked)}
                            className="h-4 w-4 rounded border-border-strong bg-layer-02 text-interactive focus:ring-interactive" />
                        <label htmlFor="supportImage" className="text-sm font-medium text-text-secondary">Supports Image Upload</label>
                    </div>
                </div>
                <div className="p-4 bg-background flex justify-end gap-2 rounded-b-lg border-t border-border-strong">
                    <button onClick={onClose} className="px-4 py-2 bg-layer-03 rounded-md text-text-primary hover:bg-layer-hover">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-interactive rounded-md text-text-on-color hover:bg-interactive-hover">Save</button>
                </div>
            </div>
        </div>
    );
};


const Models: React.FC = () => {
    const [models, setModels] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);

    const handleSaveModel = (model: AIModel) => {
        if (editingModel) {
            setModels(prev => prev.map(m => m.id === model.id ? model : m));
        } else {
            if (models.some(m => m.name === model.name)) {
                alert("A model with this name already exists.");
                return;
            }
            const newModel = {
                ...model,
                isDefault: models.length === 0
            };
            setModels(prev => [...prev, newModel]);
        }
        setEditingModel(null);
    };

    const handleDelete = (id: string) => {
        const modelToDelete = models.find(m => m.id === id);
        if (modelToDelete?.isDefault) {
            alert("Cannot delete the default model.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this model?")) {
            setModels(prev => prev.filter(m => m.id !== id));
        }
    };
    
    const handleSetDefault = (id: string) => {
        setModels(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const openModal = (model: AIModel | null) => {
        setEditingModel(model);
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 h-full">
            <h1 className="text-xl font-bold text-text-primary mb-4">AI Models</h1>
            <p className="text-text-secondary mb-6">Manage the AI models available for chat. The default model will be used for new conversations.</p>

            <div className="space-y-2">
                {models.map((model) => (
                    <div
                        key={model.id}
                        className="flex items-center p-3 bg-layer-01 rounded-lg border border-border-strong"
                    >
                        <Icon name="CpuChipIcon" className="w-6 h-6 text-interactive mr-4" />
                        <div className="flex-1">
                            <p className="font-medium text-text-primary">{model.name} <span className="text-xs font-semibold text-text-secondary uppercase">({model.apiType})</span></p>
                            <p className="text-xs text-text-secondary">{model.model}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {model.isDefault ? (
                                <span className="text-xs bg-interactive-active/50 text-interactive-secondary font-semibold px-2 py-1 rounded-full">Default</span>
                            ) : (
                                <button 
                                    onClick={() => handleSetDefault(model.id)}
                                    className="text-xs text-text-secondary font-semibold px-2 py-1 rounded-full hover:bg-layer-02"
                                >
                                    Set as default
                                </button>
                            )}
                             <button onClick={() => openModal(model)} className="p-1.5 hover:bg-layer-02 rounded-full" aria-label="Edit model">
                                <Icon name="PencilIcon" className="w-4 h-4 text-text-secondary" />
                            </button>
                            {!model.isDefault && (
                                <button onClick={() => handleDelete(model.id)} className="p-1.5 hover:bg-layer-02 rounded-full" aria-label="Delete model">
                                    <Icon name="TrashIcon" className="w-4 h-4 text-support-error" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={() => openModal(null)} className="mt-6 w-full py-2 px-4 bg-interactive rounded-md text-text-on-color hover:bg-interactive-hover transition-colors">
                Add New Model
            </button>

            <AIModelModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveModel}
                modelToEdit={editingModel}
            />
        </div>
    );
};

export default Models;