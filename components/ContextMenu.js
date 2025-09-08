// This component is not used. Text selection menu functionality is handled by the content script (content/content.js).
import React from 'react';
import { useNavigate } from 'react-router-dom';
const { forwardRef, useEffect, useRef, useState, useImperativeHandle } = React;
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { DEFAULT_SHORTCUTS, PANEL_ROUTES } from '../constants.js';
import { useAppContext } from '../context/AppContext.js';
import { Icon } from './Icons.js';

const ContextMenu = forwardRef((props, ref) => {
    const { isContextMenuVisible, contextMenuPosition, selectedText, hideContextMenu, startConversationWithShortcut } = useAppContext();
    const [shortcuts] = useLocalStorage('shortcuts', DEFAULT_SHORTCUTS);
    const navigate = useNavigate();
    const menuRef = useRef(null);
    const [adjustedPosition, setAdjustedPosition] = useState(contextMenuPosition);

    useImperativeHandle(ref, () => menuRef.current, []);

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

    const handleShortcutClick = (shortcut) => {
        startConversationWithShortcut(shortcut, selectedText);
        navigate(PANEL_ROUTES.CONVERSATION);
        hideContextMenu();
    };

    const handleSettingsClick = () => {
        navigate(PANEL_ROUTES.OPTIONS);
        hideContextMenu();
    };

    return (
        React.createElement('div',
            {
                ref: menuRef,
                className: "fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200/80 p-1 flex flex-col items-start min-w-[220px] animate-fade-in-fast",
                style: { top: adjustedPosition.top, left: adjustedPosition.left }
            },
            React.createElement('ul', { className: "w-full" },
                shortcuts.slice(0, 5).map(shortcut => (
                    React.createElement('li', { key: shortcut.id },
                        React.createElement('button',
                            {
                                onClick: () => handleShortcutClick(shortcut),
                                className: "w-full text-left px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-md flex items-center gap-3 transition-colors"
                            },
                            React.createElement(Icon, { name: shortcut.icon, className: "w-5 h-5 text-gray-500" }),
                            React.createElement('span', { className: "font-medium" }, shortcut.title)
                        )
                    )
                ))
            ),
            React.createElement('div', { className: "w-full px-1 pt-1 mt-1 border-t border-gray-100" },
                React.createElement('button',
                    {
                        onClick: handleSettingsClick,
                        className: "w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-3 transition-colors"
                    },
                    React.createElement(Icon, { name: "Cog6ToothIcon", className: "w-5 h-5 text-gray-400" }),
                    React.createElement('span', null, "Manage Shortcuts...")
                )
            ),
            React.createElement('style', null, `
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95) translateY(-5px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fadeIn 0.1s ease-out;
                }
            `)
        )
    );
});

export default ContextMenu;