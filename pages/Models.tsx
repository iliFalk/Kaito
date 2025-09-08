import React, { useState } from 'react';
import type { AIModel } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS } from '../constants';
import { Icon } from '../components/Icons';

const ModelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (model: Omit<AIModel, 'id' | 'isDefault'>) => void;
    model?: AIModel | null;
    existingModels: AIModel[];
}> = ({ isOpen, onClose, onSave, model: editingModel, existingModels }) => {
    const [name, setName] = useState('');
    const [apiType, setApiType] = useState('OpenAI / OpenAI Compatible APIs / Ollama');
    const [apiKey, setApiKey] = useState('');
    const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
    const [model, setModel] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [supportImage, setSupportImage] = useState('No');
    const [contextWindow, setContextWindow] = useState('8000');
    const [temperature, setTemperature] = useState('0.7');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const isEditing = !!editingModel;

    React.useEffect(() => {
        if (isOpen) {
            setName(editingModel?.name || '');
            setApiType(editingModel?.apiType || 'OpenAI / OpenAI Compatible APIs / Ollama');
            setApiKey(editingModel?.apiKey || '');
            setModel(editingModel?.model || '');
            setApiBaseUrl(editingModel?.apiBaseUrl || '');
            setSupportImage(editingModel?.supportImage ? 'Yes' : 'No');
            setContextWindow(String(editingModel?.contextWindow || '8000'));
            setTemperature(String(editingModel?.temperature || '0.7'));
            setErrors({});
        }
    }, [isOpen, editingModel]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!name.trim()) {
            newErrors.name = 'Name is required.';
        } else if (existingModels.some(m => m.name.trim().toLowerCase() === name.trim().toLowerCase() && m.id !== editingModel?.id)) {
            newErrors.name = 'A model with this name already exists.';
        }
        if (!apiKey.trim()) newErrors.apiKey = 'API Key is required.';
        if (!model.trim()) newErrors.model = 'Model is required.';
        if (!apiBaseUrl.trim()) newErrors.apiBaseUrl = 'API Base URL is required.';
        if (isNaN(Number(contextWindow))) newErrors.contextWindow = 'Must be a number.';
        if (isNaN(Number(temperature))) newErrors.temperature = 'Must be a number.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        onSave({
            name: name.trim(),
            apiType,
            apiKey: apiKey.trim(),
            model: model.trim(),
            apiBaseUrl: apiBaseUrl.trim(),
            supportImage: supportImage === 'Yes',
            contextWindow: parseInt(contextWindow, 10),
            temperature: parseFloat(temperature),
        });
        onClose();
    };

    const inputClasses = "w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
    const selectClasses = inputClasses + " appearance-none";
    const labelClasses = "block text-sm font-medium text-gray-700";

    const renderError = (field: string) => errors[field] ? <p className="text-xs text-red-500 mt-1">{errors[field]}</p> : null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 backdrop-blur-sm" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-200 flex flex-col max-h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">{isEditing ? 'Edit Model' : 'Add Model Configuration'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label htmlFor="name" className={labelClasses}><span className="text-red-500 mr-1">*</span>Name</label>
                        <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className={inputClasses} placeholder="Give your model configuration a name" />
                        {renderError('name')}
                    </div>
                    <div>
                        <label htmlFor="apiType" className={labelClasses}><span className="text-red-500 mr-1">*</span>API Type</label>
                        <div className="relative"><select id="apiType" value={apiType} onChange={e => setApiType(e.target.value)} className={selectClasses}><option>OpenAI / OpenAI Compatible APIs / Ollama</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    </div>
                    <div>
                        <label htmlFor="apiKey" className={labelClasses}><span className="text-red-500 mr-1">*</span>API Key</label>
                        <div className="relative"><input type={isApiKeyVisible ? 'text' : 'password'} id="apiKey" value={apiKey} onChange={e => setApiKey(e.target.value)} className={inputClasses} placeholder="sk-..." /><button onClick={() => setIsApiKeyVisible(!isApiKeyVisible)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"><Icon name={isApiKeyVisible ? 'EyeSlashIcon' : 'EyeIcon'} className="w-5 h-5" /></button></div>
                        <p className="text-xs text-gray-500 mt-1">Your API key will be stored locally and securely</p>
                        <p className="text-xs text-gray-500"><strong className="text-blue-600">For local Ollama</strong>, API key is required but can be any value as it won't be used</p>
                        {renderError('apiKey')}
                    </div>
                    <div>
                        <label htmlFor="model" className={labelClasses}><span className="text-red-500 mr-1">*</span>Model</label>
                        <div className="relative"><select id="model" value={model} onChange={e => setModel(e.target.value)} className={selectClasses}><option value="" disabled>Select a model or add custom one</option><option>gpt-4</option><option>gpt-3.5-turbo</option><option>llama3</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                        {renderError('model')}
                    </div>
                    <div>
                        <label htmlFor="apiBaseUrl" className={labelClasses}><span className="text-red-500 mr-1">*</span>API Base URL</label>
                        <input type="text" id="apiBaseUrl" value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} className={inputClasses} placeholder="https://api.openai.com/v1" />
                        <p className="text-xs text-gray-500 mt-1">Leave empty to use OpenAI's default API endpoint</p>
                        <p className="text-xs text-gray-500 mt-1"><strong className="text-blue-600">For local Ollama</strong>, default URL is: http://localhost:11434/v1 (port can be customized)</p>
                        {renderError('apiBaseUrl')}
                    </div>
                    <div>
                        <label htmlFor="supportImage" className={labelClasses}>Support Image <button className="align-middle"><Icon name="QuestionMarkCircleIcon" className="w-4 h-4 text-gray-400" /></button></label>
                        <div className="relative"><select id="supportImage" value={supportImage} onChange={e => setSupportImage(e.target.value)} className={selectClasses}><option>No</option><option>Yes</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div></div>
                    </div>
                    <div>
                        <label htmlFor="contextWindow" className={labelClasses}><span className="text-red-500 mr-1">*</span>Context Window <button className="align-middle"><Icon name="QuestionMarkCircleIcon" className="w-4 h-4 text-gray-400" /></button></label>
                        <input type="number" id="contextWindow" value={contextWindow} onChange={e => setContextWindow(e.target.value)} className={inputClasses} />
                        {renderError('contextWindow')}
                    </div>
                    <div>
                        <label htmlFor="temperature" className={labelClasses}><span className="text-red-500 mr-1">*</span>Temperature</label>
                        <input type="number" step="0.1" min="0" max="2" id="temperature" value={temperature} onChange={e => setTemperature(e.target.value)} className={inputClasses} />
                        <p className="text-xs text-gray-500 mt-1">Controls randomness: 0 is focused, 1 is balanced, 2 is creative</p>
                        {renderError('temperature')}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-800 hover:bg-gray-100 text-sm font-semibold">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 text-sm font-semibold">OK</button>
                </div>
            </div>
        </div>
    );
};

const Models: React.FC = () => {
    const [models, setModels] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<AIModel | null>(null);

    const handleSaveModel = (modelData: Omit<AIModel, 'id' | 'isDefault'>) => {
        if (editingModel) {
            setModels(prev => prev.map(m => (m.id === editingModel.id ? { ...m, ...modelData, isDefault: false } : m)));
        } else {
            const newModel: AIModel = {
                id: Date.now().toString(),
                isDefault: false,
                ...modelData,
            };
            setModels(prev => [...prev, newModel]);
        }
        setEditingModel(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this model?")) {
            setModels(prev => prev.filter(model => model.id !== id));
        }
    };

    const openModal = (model: AIModel | null) => {
        setEditingModel(model);
        setIsModalOpen(true);
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
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-1 rounded-full">Default</span>
                                <button onClick={() => openModal(model)} className="p-1 hover:bg-gray-100 rounded-full" aria-label="Edit model">
                                    <Icon name="PencilIcon" className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>
                        ) : (
                             <div className="flex items-center gap-2">
                                <button onClick={() => openModal(model)} className="p-1 hover:bg-gray-100 rounded-full" aria-label="Edit model">
                                    <Icon name="PencilIcon" className="w-4 h-4 text-gray-500" />
                                </button>
                                <button onClick={() => handleDelete(model.id)} className="p-1 hover:bg-gray-100 rounded-full" aria-label="Delete model">
                                    <Icon name="TrashIcon" className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button onClick={() => openModal(null)} className="mt-6 w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors">
                Add New Model
            </button>

            <ModelModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveModel}
                model={editingModel}
                existingModels={models}
            />
        </div>
    );
};

export default Models;