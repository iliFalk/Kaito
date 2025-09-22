import React, { useState, useRef } from 'react';
import type { Shortcut } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_SHORTCUTS } from '../constants';
import { Icon } from '../components/Icons';

const ALL_ICONS = ['DocumentTextIcon', 'LanguageIcon', 'CheckCircleIcon', 'QuestionMarkCircleIcon', 'PencilIcon', 'SparklesIcon', 'BoltIcon', 'CodeBracketIcon'];

const ShortcutModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (shortcut: Shortcut) => void;
    shortcut?: Shortcut | null;
}> = ({ isOpen, onClose, onSave, shortcut }) => {
    const [title, setTitle] = useState(shortcut?.title || '');
    const [prompt, setPrompt] = useState(shortcut?.prompt || '');
    const [icon, setIcon] = useState(shortcut?.icon || ALL_ICONS[0]);
    const isEditing = !!shortcut;

    React.useEffect(() => {
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-layer-01 rounded-lg shadow-xl w-full max-w-md border border-border-strong">
                <div className="p-4 border-b border-border-strong">
                    <h2 className="text-lg font-semibold text-text-primary">{isEditing ? 'Edit Shortcut' : 'Create Shortcut'}</h2>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Icon</label>
                        <div className="grid grid-cols-8 gap-2 p-2 bg-background rounded-lg">
                            {ALL_ICONS.map(iconName => (
                                <button key={iconName} onClick={() => setIcon(iconName)} className={`p-2 rounded ${icon === iconName ? 'bg-interactive text-text-on-color' : 'bg-layer-02 text-text-secondary'} hover:bg-interactive hover:text-text-on-color`}>
                                    <Icon name={iconName} className="w-5 h-5 mx-auto"/>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                        <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)}
                               className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive" />
                    </div>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-1">Prompt</label>
                        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4}
                                  className="w-full bg-layer-02 text-text-primary rounded-md border-border-strong focus:ring-interactive focus:border-interactive"
                                  placeholder="e.g., Summarize this: {{selected_text}}" />
                        <p className="text-xs text-text-placeholder mt-1">{'Use `{{selected_text}}` for context from quoted text.'}</p>
                    </div>
                </div>
                <div className="p-4 bg-background flex justify-end gap-2 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-layer-03 rounded-md text-text-primary hover:bg-layer-hover">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-interactive rounded-md text-text-on-color hover:bg-interactive-hover">Save</button>
                </div>
            </div>
        </div>
    );
};

const Options: React.FC = () => {
    const [shortcuts, setShortcuts] = useLocalStorage<Shortcut[]>('shortcuts', DEFAULT_SHORTCUTS);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragItem.current = position;
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
        dragOverItem.current = position;
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        if (dragItem.current === null || dragOverItem.current === null) return;

        const newShortcuts = [...shortcuts];
        const dragItemContent = newShortcuts[dragItem.current];
        newShortcuts.splice(dragItem.current, 1);
        newShortcuts.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setShortcuts(newShortcuts);
    };

    const handleSaveShortcut = (shortcut: Shortcut) => {
        if (editingShortcut) {
            setShortcuts(prev => prev.map(s => s.id === editingShortcut.id ? { ...shortcut, id: editingShortcut.id, isDefault: s.isDefault } : s));
        } else {
            setShortcuts(prev => [...prev, { ...shortcut, isDefault: false }]);
        }
        setEditingShortcut(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this shortcut?")) {
            setShortcuts(prev => prev.filter(s => s.id !== id));
        }
    };

    const openModal = (shortcut: Shortcut | null) => {
        setEditingShortcut(shortcut);
        setIsModalOpen(true);
    };
    
    return (
        <div className="p-4 h-full overflow-y-auto">
             <div className="mb-6">
                <h1 className="text-xl font-bold text-text-primary">Quick Action Shortcuts</h1>
                <p className="text-text-secondary">Customize and reorder your one-click prompts for the context menu.</p>
             </div>
             
             <div className="mb-8">
                <h2 className="text-lg font-bold mb-2 text-text-secondary">Context Menu Preview</h2>
                <p className="text-sm text-text-placeholder mb-4">This is how the context menu will look when you select text on a webpage. The changes you make below will be reflected here live.</p>
                <div className="bg-black/50 p-8 rounded-lg flex justify-center items-center">
                    <div className="bg-layer-01/90 backdrop-blur-sm rounded-lg shadow-lg p-1 flex flex-row gap-1">
                        <button title="Quote Text" className="group relative p-2 rounded-md text-text-secondary hover:bg-layer-hover/70 hover:text-text-primary transition-colors">
                            <Icon name="ChatBubbleLeftRightIcon" className="w-5 h-5" />
                        </button>

                        <div className="w-px bg-border-strong/50 mx-1 my-2" />

                        {shortcuts.slice(0, 4).map(shortcut => (
                            <button key={shortcut.id} title={shortcut.title} className="group relative p-2 rounded-md text-text-secondary hover:bg-layer-hover/70 hover:text-text-primary transition-colors">
                                <Icon name={shortcut.icon} className="w-5 h-5" />
                            </button>
                        ))}

                        <button title="Manage Shortcuts..." className="group relative p-2 rounded-md text-text-secondary hover:bg-layer-hover/70 hover:text-text-primary transition-colors">
                            <Icon name="EllipsisHorizontalIcon" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
             </div>

            <div>
                <h2 className="text-lg font-bold mb-3 text-text-secondary">Edit Shortcuts</h2>
                <div className="space-y-2" onDragEnd={handleDrop}>
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={shortcut.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={(e) => handleDragEnter(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            className="flex items-center p-3 bg-layer-01 rounded-lg border border-border-strong cursor-grab active:cursor-grabbing"
                        >
                            <Icon name="Bars3Icon" className="w-5 h-5 text-text-placeholder mr-3" />
                            <Icon name={shortcut.icon} className="w-6 h-6 text-interactive mr-4" />
                            <span className="flex-1 font-medium">{shortcut.title}</span>
                            {shortcut.isDefault ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-layer-03 text-text-secondary font-semibold px-2 py-1 rounded-full">Default</span>
                                    <button onClick={() => openModal(shortcut)} className="p-1 hover:bg-layer-02 rounded-full" aria-label="Edit shortcut">
                                        <Icon name="PencilIcon" className="w-4 h-4 text-text-secondary" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openModal(shortcut)} className="p-1 hover:bg-layer-02 rounded-full" aria-label="Edit shortcut">
                                        <Icon name="PencilIcon" className="w-4 h-4 text-text-secondary" />
                                    </button>
                                    <button onClick={() => handleDelete(shortcut.id)} className="p-1 hover:bg-layer-02 rounded-full" aria-label="Delete shortcut">
                                        <Icon name="TrashIcon" className="w-4 h-4 text-support-error" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <button onClick={() => openModal(null)} className="mt-6 w-full py-2 px-4 bg-interactive rounded-md text-text-on-color hover:bg-interactive-hover transition-colors">
                    Create New Shortcut
                </button>
            </div>


            <ShortcutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveShortcut}
                shortcut={editingShortcut}
            />
        </div>
    );
};

export default Options;
