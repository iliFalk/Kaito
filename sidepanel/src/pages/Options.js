import React from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { DEFAULT_SHORTCUTS } from '../constants.js';
import { Icon } from '../components/Icons.js';
const { useState, useRef, useEffect } = React;

const ALL_ICONS = ['DocumentTextIcon', 'LanguageIcon', 'CheckCircleIcon', 'QuestionMarkCircleIcon', 'PencilIcon', 'SparklesIcon', 'BoltIcon', 'CodeBracketIcon'];

const ShortcutModal = ({ isOpen, onClose, onSave, shortcut }) => {
    const [title, setTitle] = useState(shortcut?.title || '');
    const [prompt, setPrompt] = useState(shortcut?.prompt || '');
    const [icon, setIcon] = useState(shortcut?.icon || ALL_ICONS[0]);
    const isEditing = !!shortcut;

    useEffect(() => {
        if (isOpen) {
            setTitle(shortcut?.title || '');
            setPrompt(shortcut?.prompt || '');
            setIcon(shortcut?.icon || ALL_ICONS[0]);
        }
    }, [shortcut, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!title || !prompt) return;
        onSave({
            id: shortcut?.id || Date.now().toString(),
            title,
            prompt,
            icon,
        });
        onClose();
    };

    return (
        React.createElement('div', { className: "fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" },
            React.createElement('div', { className: "bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200" },
                React.createElement('div', { className: "p-4 border-b border-gray-200" },
                    React.createElement('h2', { className: "text-lg font-semibold text-gray-800" }, isEditing ? 'Edit Shortcut' : 'Create Shortcut')
                ),
                React.createElement('div', { className: "p-4 space-y-4" },
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-gray-600 mb-1" }, "Icon"),
                        React.createElement('div', { className: "grid grid-cols-8 gap-2 p-2 bg-gray-100 rounded-lg" },
                            ALL_ICONS.map(iconName => (
                                React.createElement('button', { key: iconName, onClick: () => setIcon(iconName), className: `p-2 rounded ${icon === iconName ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} hover:bg-blue-500 hover:text-white` },
                                    React.createElement(Icon, { name: iconName, className: "w-5 h-5 mx-auto" })
                                )
                            ))
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "title", className: "block text-sm font-medium text-gray-600 mb-1" }, "Name"),
                        React.createElement('input', { type: "text", id: "title", value: title, onChange: e => setTitle(e.target.value),
                               className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500" })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "prompt", className: "block text-sm font-medium text-gray-600 mb-1" }, "Prompt"),
                        React.createElement('textarea', { id: "prompt", value: prompt, onChange: e => setPrompt(e.target.value), rows: 4,
                                  className: "w-full bg-gray-100 text-gray-800 rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500",
                                  placeholder: "e.g., Summarize this: {{selected_text}}" }),
                        React.createElement('p', { className: "text-xs text-gray-500 mt-1" }, 'Use `{{selected_text}}` for context from quoted text.')
                    )
                ),
                React.createElement('div', { className: "p-4 bg-gray-50 flex justify-end gap-2 rounded-b-lg" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300" }, "Cancel"),
                    React.createElement('button', { onClick: handleSubmit, className: "px-4 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-500" }, "Save")
                )
            )
        )
    );
};

const Options = () => {
    const [shortcuts, setShortcuts] = useLocalStorage('shortcuts', DEFAULT_SHORTCUTS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState(null);
    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleDragStart = (e, position) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e, position) => {
        dragOverItem.current = position;
    };

    const handleDrop = (e) => {
        if (dragItem.current === null || dragOverItem.current === null) return;

        const newShortcuts = [...shortcuts];
        const dragItemContent = newShortcuts[dragItem.current];
        newShortcuts.splice(dragItem.current, 1);
        newShortcuts.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setShortcuts(newShortcuts);
    };

    const handleSaveShortcut = (shortcut) => {
        if (editingShortcut) {
            setShortcuts(prev => prev.map(s => s.id === editingShortcut.id ? { ...shortcut, id: editingShortcut.id, isDefault: s.isDefault } : s));
        } else {
            setShortcuts(prev => [...prev, { ...shortcut, isDefault: false }]);
        }
        setEditingShortcut(null);
    };

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this shortcut?")) {
            setShortcuts(prev => prev.filter(s => s.id !== id));
        }
    };

    const openModal = (shortcut) => {
        setEditingShortcut(shortcut);
        setIsModalOpen(true);
    };
    
    return (
        React.createElement('div', { className: "p-4 bg-gray-50 h-full text-gray-800 overflow-y-auto" },
             React.createElement('div', { className: "mb-6" },
                React.createElement('h1', { className: "text-xl font-bold" }, "Quick Action Shortcuts"),
                React.createElement('p', { className: "text-gray-600" }, "Customize and reorder your one-click prompts for the context menu.")
             ),
             
             React.createElement('div', { className: "mb-8" },
                React.createElement('h2', { className: "text-lg font-bold mb-2 text-gray-700" }, "Context Menu Preview"),
                React.createElement('p', { className: "text-sm text-gray-500 mb-4" }, "This is how the context menu will look when you select text on a webpage. The changes you make below will be reflected here live."),
                React.createElement('div', { className: "bg-gray-200 p-8 rounded-lg flex justify-center items-center" },
                    React.createElement('div', { className: "bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-lg p-1 flex flex-col gap-1" },
                        React.createElement('button', { title: "Quote Text", className: "group relative p-2 rounded-md text-gray-300 hover:bg-gray-600/70 hover:text-white transition-colors" },
                            React.createElement(Icon, { name: "ChatBubbleLeftRightIcon", className: "w-5 h-5" })
                        ),
                        React.createElement('div', { className: "h-px bg-gray-500/50 my-1 mx-1" }),
                        ...shortcuts.slice(0, 4).map(shortcut => (
                            React.createElement('button', { key: shortcut.id, title: shortcut.title, className: "group relative p-2 rounded-md text-gray-300 hover:bg-gray-600/70 hover:text-white transition-colors" },
                                React.createElement(Icon, { name: shortcut.icon, className: "w-5 h-5" })
                            )
                        )),
                        React.createElement('button', { title: "Manage Shortcuts...", className: "group relative p-2 rounded-md text-gray-300 hover:bg-gray-600/70 hover:text-white transition-colors" },
                            React.createElement(Icon, { name: "EllipsisHorizontalIcon", className: "w-5 h-5" })
                        )
                    )
                )
             ),

            React.createElement('div', null,
                React.createElement('h2', { className: "text-lg font-bold mb-3 text-gray-700" }, "Edit Shortcuts"),
                React.createElement('div', { className: "space-y-2", onDragEnd: handleDrop },
                    shortcuts.map((shortcut, index) => (
                        React.createElement('div', {
                            key: shortcut.id,
                            draggable: true,
                            onDragStart: (e) => handleDragStart(e, index),
                            onDragEnter: (e) => handleDragEnter(e, index),
                            onDragOver: (e) => e.preventDefault(),
                            className: "flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-grab active:cursor-grabbing"
                        },
                            React.createElement(Icon, { name: "Bars3Icon", className: "w-5 h-5 text-gray-400 mr-3" }),
                            React.createElement(Icon, { name: shortcut.icon, className: "w-6 h-6 text-blue-500 mr-4" }),
                            React.createElement('span', { className: "flex-1 font-medium" }, shortcut.title),
                            shortcut.isDefault ? (
                                React.createElement('div', { className: "flex items-center gap-2" },
                                    React.createElement('span', { className: "text-xs bg-gray-200 text-gray-600 font-semibold px-2 py-1 rounded-full" }, "Default"),
                                    React.createElement('button', { onClick: () => openModal(shortcut), className: "p-1 hover:bg-gray-100 rounded-full", 'aria-label': "Edit shortcut" },
                                        React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-gray-500" })
                                    )
                                )
                            ) : (
                                React.createElement('div', { className: "flex items-center gap-2" },
                                    React.createElement('button', { onClick: () => openModal(shortcut), className: "p-1 hover:bg-gray-100 rounded-full", 'aria-label': "Edit shortcut" },
                                        React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-gray-500" })
                                    ),
                                    React.createElement('button', { onClick: () => handleDelete(shortcut.id), className: "p-1 hover:bg-gray-100 rounded-full", 'aria-label': "Delete shortcut" },
                                        React.createElement(Icon, { name: "TrashIcon", className: "w-4 h-4 text-red-500" })
                                    )
                                )
                            )
                        )
                    ))
                ),

                React.createElement('button', { onClick: () => openModal(null), className: "mt-6 w-full py-2 px-4 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors" },
                    "Create New Shortcut"
                )
            ),


            React.createElement(ShortcutModal, {
                isOpen: isModalOpen,
                onClose: () => setIsModalOpen(false),
                onSave: handleSaveShortcut,
                shortcut: editingShortcut
            })
        )
    );
};

export default Options;