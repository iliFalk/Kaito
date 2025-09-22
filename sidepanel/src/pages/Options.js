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
            React.createElement('div', { className: "bg-layer-01 rounded-lg shadow-xl w-full max-w-md border border-border-strong" },
                React.createElement('div', { className: "p-4 border-b border-border-strong" },
                    React.createElement('h2', { className: "text-lg font-semibold text-text-primary" }, isEditing ? 'Edit Shortcut' : 'Create Shortcut')
                ),
                React.createElement('div', { className: "p-4 space-y-4" },
                    React.createElement('div', null,
                        React.createElement('label', { className: "block text-sm font-medium text-text-secondary mb-1" }, "Icon"),
                        React.createElement('div', { className: "grid grid-cols-8 gap-2 p-2 bg-background rounded-lg" },
                            ALL_ICONS.map(iconName => (
                                React.createElement('button', { key: iconName, onClick: () => setIcon(iconName), className: `p-2 rounded ${icon === iconName ? 'bg-interactive text-text-on-color' : 'bg-layer-02 text-text-secondary'} hover:bg-interactive hover:text-text-on-color` },
                                    React.createElement(Icon, { name: iconName, className: "w-5 h-5 mx-auto" })
                                )
                            ))
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "title", className: "block text-sm font-medium text-text-secondary mb-1" }, "Name"),
                        React.createElement('input', { type: "text", id: "title", value: title, onChange: e => setTitle(e.target.value),
                               className: "w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive" })
                    ),
                    React.createElement('div', null,
                        React.createElement('label', { htmlFor: "prompt", className: "block text-sm font-medium text-text-secondary mb-1" }, "Prompt"),
                        React.createElement('textarea', { id: "prompt", value: prompt, onChange: e => setPrompt(e.target.value), rows: 4,
                                  className: "w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive",
                                  placeholder: "e.g., Summarize this: {{selected_text}}" }),
                        React.createElement('p', { className: "text-xs text-text-placeholder mt-1" }, 'Use `{{selected_text}}` for context from quoted text.')
                    )
                ),
                React.createElement('div', { className: "p-4 bg-background flex justify-end gap-2 rounded-b-lg" },
                    React.createElement('button', { onClick: onClose, className: "px-4 py-2 bg-layer-03 rounded-md text-text-primary hover:bg-layer-hover" }, "Cancel"),
                    React.createElement('button', { onClick: handleSubmit, className: "px-4 py-2 bg-interactive rounded-md text-text-on-color hover:bg-interactive-hover" }, "Save")
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
        React.createElement('div', { className: "p-4 h-full overflow-y-auto" },
             React.createElement('div', { className: "mb-6" },
                React.createElement('h1', { className: "text-xl font-bold text-text-primary" }, "Quick Action Shortcuts"),
                React.createElement('p', { className: "text-text-secondary" }, "Customize and reorder your one-click prompts for the context menu.")
             ),
             
             React.createElement('div', { className: "mb-8" },
                React.createElement('h2', { className: "text-lg font-bold mb-2 text-text-secondary" }, "Context Menu Preview"),
                React.createElement('p', { className: "text-sm text-text-placeholder mb-4" }, "This is how the context menu will look when you select text on a webpage. The changes you make below will be reflected here live."),
                React.createElement('div', { className: "bg-black/50 p-8 rounded-lg flex justify-center items-center" },
                    React.createElement('div', { className: "bg-layer-01/90 backdrop-blur-sm rounded-lg shadow-lg p-1 flex flex-row gap-1" },
                        React.createElement('button', { title: "Quote Text", className: "group relative p-2 rounded-md text-text-secondary hover:bg-layer-hover/70 hover:text-text-primary transition-colors" },
                            React.createElement(Icon, { name: "ChatBubbleLeftRightIcon", className: "w-5 h-5" })
                        ),
                        React.createElement('div', { className: "w-px bg-border-strong/50 mx-1 my-2" }),
                        ...shortcuts.slice(0, 4).map(shortcut => (
                            React.createElement('button', { key: shortcut.id, title: shortcut.title, className: "group relative p-2 rounded-md text-text-secondary hover:bg-layer-hover/70 hover:text-text-primary transition-colors" },
                                React.createElement(Icon, { name: shortcut.icon, className: "w-5 h-5" })
                            )
                        )),
                        React.createElement('button', { title: "Manage Shortcuts...", className: "group relative p-2 rounded-md text-text-secondary hover:bg-layer-hover/70 hover:text-text-primary transition-colors" },
                            React.createElement(Icon, { name: "EllipsisHorizontalIcon", className: "w-5 h-5" })
                        )
                    )
                )
             ),

            React.createElement('div', null,
                React.createElement('h2', { className: "text-lg font-bold mb-3 text-text-secondary" }, "Edit Shortcuts"),
                React.createElement('div', { className: "space-y-2", onDragEnd: handleDrop },
                    shortcuts.map((shortcut, index) => (
                        React.createElement('div', {
                            key: shortcut.id,
                            draggable: true,
                            onDragStart: (e) => handleDragStart(e, index),
                            onDragEnter: (e) => handleDragEnter(e, index),
                            onDragOver: (e) => e.preventDefault(),
                            className: "flex items-center p-3 bg-layer-01 rounded-lg border border-border-strong cursor-grab active:cursor-grabbing"
                        },
                            React.createElement(Icon, { name: "Bars3Icon", className: "w-5 h-5 text-text-placeholder mr-3" }),
                            React.createElement(Icon, { name: shortcut.icon, className: "w-6 h-6 text-interactive mr-4" }),
                            React.createElement('span', { className: "flex-1 font-medium" }, shortcut.title),
                            shortcut.isDefault ? (
                                React.createElement('div', { className: "flex items-center gap-2" },
                                    React.createElement('span', { className: "text-xs bg-layer-03 text-text-secondary font-semibold px-2 py-1 rounded-full" }, "Default"),
                                    React.createElement('button', { onClick: () => openModal(shortcut), className: "p-1 hover:bg-layer-02 rounded-full", 'aria-label': "Edit shortcut" },
                                        React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-text-secondary" })
                                    )
                                )
                            ) : (
                                React.createElement('div', { className: "flex items-center gap-2" },
                                    React.createElement('button', { onClick: () => openModal(shortcut), className: "p-1 hover:bg-layer-02 rounded-full", 'aria-label': "Edit shortcut" },
                                        React.createElement(Icon, { name: "PencilIcon", className: "w-4 h-4 text-text-secondary" })
                                    ),
                                    React.createElement('button', { onClick: () => handleDelete(shortcut.id), className: "p-1 hover:bg-layer-02 rounded-full", 'aria-label': "Delete shortcut" },
                                        React.createElement(Icon, { name: "TrashIcon", className: "w-4 h-4 text-support-error" })
                                    )
                                )
                            )
                        )
                    ))
                ),

                React.createElement('button', { onClick: () => openModal(null), className: "mt-6 w-full py-2 px-4 bg-interactive rounded-md text-text-on-color hover:bg-interactive-hover transition-colors" },
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
