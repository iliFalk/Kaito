
import React from 'react';
import { ApiType } from '../types.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { DEFAULT_MODELS } from '../constants.js';
import { Icon } from '../components/Icons.js';
const { useState, useEffect } = React;

const AIModelModal = ({ isOpen, onClose, onSave, modelToEdit }) => {
    const [apiType, setApiType] = useState(modelToEdit?.apiType || ApiType.Gemini);
    const [name, setName] = useState('');
    const [model, setModel] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [contextWindow, setContextWindow] = useState(undefined);
    const [temperature, setTemperature] = useState(0.7);
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
        const modelToSave = {
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
    
    const handleTempChange = (e) => setTemperature(parseFloat(e.target.value));

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-lg border border-gray-200 flex flex-col max-h-[90vh]" },
                React.createElement('div', { className: "p-4 border-b border-gray-200" },
                    React.createElement('h2', { className: "text-lg font-semibold text-gray-800" }, modelToEdit ? 'Edit AI Model' : 'Add New Model')
                ),
                React.createElement('div', { className: "p-4 space-y-4 overflow-y-auto" },
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "apiType", className: "block text-sm font-medium text-gray-600 mb-1" }, "API Type"),
                        React.createElement('select', { id: "apiType", value: apiType, onChange: e => setApiType(e.target.value),
                            className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500" },
                            React.createElement('option', { value: ApiType.Gemini }, "Google Gemini"),
                            React.createElement('option', { value: ApiType.OpenAI }, "OpenAI Compatible")
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "name", className: "block text-sm font-medium text-gray-600 mb-1" }, "Name"),
                        React.createElement('input', { type: "text", id: "name", value: name, onChange: e => setName(e.target.value),
                               className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                               placeholder: "e.g., Gemini Flash" })
                    ),
                    apiType === ApiType.OpenAI && (
                        React.createElement(React.Fragment, null,
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "baseUrl", className: "block text-sm font-medium text-gray-600 mb-1" }, "API Base URL"),
                                React.createElement('input', { type: "text", id: "baseUrl", value: baseUrl, onChange: e => setBaseUrl(e.target.value),
                                          className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                                          placeholder: "e.g., https://api.openai.com/v1" })
                            ),
                            React.createElement('div', null,
                                React.createElement('label', { htmlFor: "apiKey", className: "block text-sm font-medium text-gray-600 mb-1" }, "API Key"),
                                React.createElement('input', { type: "password", id: "apiKey", value: apiKey, onChange: e => setApiKey(e.target.value),
                                          className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                                          placeholder: "Enter your API key" })
                            )
                        )
                    ),
                     React.createElement('div', null,
                        React.createElement('label', { htmlFor: "model", className: "block text-sm font-medium text-gray-600 mb-1" }, "Model ID"),
                        React.createElement('input', { type: "text", id: "model", value: model, onChange: e => setModel(e.target.value),
                                  className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                                  placeholder: apiType === ApiType.Gemini ? "e.g., gemini-2.5-flash" : "e.g., gpt-4" })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "contextWindow", className: "block text-sm font-medium text-gray-600 mb-1" }, "Context Window"),
                        React.createElement('input', { type: "number", id: "contextWindow", value: contextWindow || '', onChange: e => setContextWindow(e.target.value ? parseInt(e.target.value, 10) : undefined),
                                  className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                                  placeholder: "Optional, e.g., 8192" })
                    ),
                     React.createElement('div', null,
                        React.createElement('label', { htmlFor: "temperature", className: "block text-sm font-medium text-gray-600 mb-1" }, "Temperature"),
                        React.createElement('div', { className: "flex items-center gap-4" },
                            React.createElement('input', { type: "range", id: "temperature", min: "0", max: "1", step: "0.1", value: temperature, onChange: handleTempChange,
                                      className: "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" }),
                            React.createElement('span', { className: "font-mono text-sm text-gray-700 w-10 text-center" }, temperature?.toFixed(1))
                        )
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                        React.createElement('input', { type: "checkbox", id: "supportImage", checked: supportImage, onChange: e => setSupportImage(e.target.checked),
                            className: "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" }),
                        React.createElement('label', { htmlFor: "supportImage", className: "text-sm font-medium text-gray-700" }, "Supports Image Upload")
                    )
                ),
                React.createElement('div', { className: "p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg border-t border-gray-200" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300" }, "Cancel"),
                    React.createElement('button', { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500" }, "Save")
                )
            )
        )
    );
};


const Models = () => {
    const [models, setModels] = useLocalStorage('ai_models', DEFAULT_MODELS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingModel, setEditingModel] = useState(null);

    const handleSaveModel = (model) => {
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

    const handleDelete = (id) => {
        const modelToDelete = models.find(m => m.id === id);
        if (modelToDelete?.isDefault) {
            alert("Cannot delete the default model.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this model?")) {
            setModels(prev => prev.filter(m => m.id !== id));
        }
    };
    
    const handleSetDefault = (id) => {
        setModels(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    };

    const openModal = (model) => {
        setEditingModel(model);
        setIsModalOpen(true);
    };

    return (
        React.createElement('div', { className: "p-4 bg-gray-50 h-full text-gray-800" },
            React.createElement('h1', { className: "text-xl font-bold mb-4" }, "AI Models"),
            React.createElement('p', { className: "text-gray-600 mb-6" }, "Manage the AI models available for chat. The default model will be used for new conversations."),

            React.createElement('div', { className: "space-y-2" },
                models.map((model) => (
                    React.createElement('div', {
                        key: model.id,
                        className: "flex items-center p-3 bg-white rounded-lg border border-gray-200"
                    },
                        React.createElement(Icon, { name: "CpuChipIcon", className: "w-6 h-6 text-blue-500 mr-4" }),
                        React.createElement('div', { className: "flex-1" },
                            React.createElement('p', { className: "font-medium" }, model.name, React.createElement('span', {className: "text-xs font-semibold text-gray-500 uppercase"}, `(${model.apiType})`)),
                            React.createElement('p', { className: "text-xs text-gray-500" }, model.model)
                        ),
                        React.createElement('div', { className: "flex items-center gap-2" },
                            model.isDefault ? (
                                React.createElement('span', { className: "text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded-full" }, "Default")
                            ) : (
                                React.createElement('button', { 
                                    onClick: () => handleSetDefault(model.id),
                                    className: "text-xs text-gray-600 font-semibold px-2 py-1 rounded-full hover:bg-gray-200"
                                }, "Set as default")
                            ),
                             React.createElement('button', { onClick: () => openModal(model), className: "p-1.5 hover:bg-gray-100 rounded-full", 'aria-label': "Edit model" },
                                React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-gray-500" })
                            ),
                            !model.isDefault && (
                                React.createElement('button', { onClick: () => handleDelete(model.id), className: "p-1.5 hover:bg-gray-100 rounded-full", 'aria-label': "Delete model" },
                                    React.createElement(Icon, { name: "TrashIcon", className: "w-4 h-4 text-red-500" })
                                )
                            )
                        )
                    )
                ))
            ),

            React.createElement('button', { onClick: () => openModal(null), className: "mt-6 w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors" },
                "Add New Model"
            ),

            React.createElement(AIModelModal, { 
                isOpen: isModalOpen,
                onClose: () => setIsModalOpen(false),
                onSave: handleSaveModel,
                modelToEdit: editingModel
            })
        )
    );
};

export default Models;
