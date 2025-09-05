import React, { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_SHORTCUTS, PANEL_ROUTES } from '../constants';
import type { Shortcut } from '../types';
import { useAppContext } from '../context/AppContext';
import { Icon } from './Icons';

const ContextMenu = forwardRef<HTMLDivElement>((props, ref) => {
    const { isContextMenuVisible, contextMenuPosition, selectedText, hideContextMenu, startConversationWithShortcut } = useAppContext();
    const [shortcuts] = useLocalStorage<Shortcut[]>('shortcuts', DEFAULT_SHORTCUTS);
    const navigate = useNavigate();
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(contextMenuPosition);

    useImperativeHandle(ref, () => menuRef.current as HTMLDivElement, []);

    useEffect(() => {
        if (isContextMenuVisible && menuRef.current) {
            const menu = menuRef.current;
            const { innerWidth, innerHeight } = window;
            const { offsetWidth, offsetHeight } = menu;
            
            let top = contextMenuPosition.top + 5;
            let left = contextMenuPosition.left + 5;

            if (left + offsetWidth > innerWidth) {
                left = innerWidth - offsetWidth - 10;
            }
            if (top + offsetHeight > innerHeight) {
                top = innerHeight - offsetHeight - 10;
            }
            if (left < 10) {
                left = 10;
            }
            if (top < 10) {
                top = 10;
            }

            setAdjustedPosition({ top, left });
        }
    }, [isContextMenuVisible, contextMenuPosition]);

    if (!isContextMenuVisible) return null;

    const handleShortcutClick = (shortcut: Shortcut) => {
        startConversationWithShortcut(shortcut, selectedText);
        navigate(PANEL_ROUTES.CONVERSATION);
        hideContextMenu();
    };

    const handleSettingsClick = () => {
        navigate(PANEL_ROUTES.OPTIONS);
        hideContextMenu();
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200/80 p-1 flex flex-col items-start min-w-[220px] animate-fade-in-fast"
            style={{ top: adjustedPosition.top, left: adjustedPosition.left }}
        >
            <ul className="w-full">
                {shortcuts.slice(0, 5).map(shortcut => (
                    <li key={shortcut.id}>
                        <button
                            onClick={() => handleShortcutClick(shortcut)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-md flex items-center gap-3 transition-colors"
                        >
                            <Icon name={shortcut.icon} className="w-5 h-5 text-gray-500" />
                            <span className="font-medium">{shortcut.title}</span>
                        </button>
                    </li>
                ))}
            </ul>
            <div className="w-full px-1 pt-1 mt-1 border-t border-gray-100">
                <button
                    onClick={handleSettingsClick}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-3 transition-colors"
                >
                    <Icon name="Cog6ToothIcon" className="w-5 h-5 text-gray-400" />
                    <span>Manage Shortcuts...</span>
                </button>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-5px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fadeIn 0.1s ease-out;
                }
            `}</style>
        </div>
    );
});

export default ContextMenu;