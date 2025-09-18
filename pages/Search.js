import React from 'react';
import { useAppContext } from '../context/AppContext.js';
import { SEARCH_ENGINES } from '../constants.js';
import { SparklesIcon } from '../components/Icons.js';
const { useRef } = React;

const SearchHome = () => {
    const { setSearchText } = useAppContext();
    const textareaRef = useRef(null);

    const startSearch = () => {
        const query = textareaRef.current?.value.trim();
        if (query) {
            setSearchText(query);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            startSearch();
        }
    };

    return (
        React.createElement('div', { className: "flex flex-col h-full p-4" },
            React.createElement('div', { className: "flex flex-col items-center justify-center flex-grow text-center" },
                React.createElement(SparklesIcon, { className: "w-16 h-16 text-interactive mb-4" }),
                React.createElement('h1', { className: "text-2xl font-bold text-text-primary" }, "AI Work Assistant"),
                React.createElement('p', { className: "text-text-secondary mt-1" }, "Search multiple AI engines at once.")
            ),
            React.createElement('div', { className: "flex-shrink-0 mb-4" },
                React.createElement('div', { className: "relative" },
                    React.createElement('textarea', {
                        ref: textareaRef,
                        autoFocus: true,
                        onKeyDown: handleKeyDown,
                        placeholder: "Enter your question...",
                        className: "w-full h-24 p-4 pr-24 bg-layer-01 border border-border-strong rounded-lg resize-none focus:ring-2 focus:ring-interactive focus:outline-none text-text-primary placeholder-text-placeholder"
                    }),
                     React.createElement('button', {
                        onClick: startSearch,
                        className: "absolute bottom-3 right-3 bg-interactive text-text-on-color font-semibold py-2 px-4 rounded-md hover:bg-interactive-hover transition-colors duration-200"
                    }, "Search")
                )
            ),
            React.createElement('div', { className: "flex-shrink-0" },
                React.createElement('p', { className: "text-sm text-text-secondary mb-2 text-center" }, "Available Search Engines:"),
                React.createElement('div', { className: "grid grid-cols-3 gap-4" },
                    SEARCH_ENGINES.map(site => (
                        React.createElement('div', { key: site.id, className: "flex flex-col items-center justify-center p-2 bg-layer-01 rounded-lg border border-border-subtle" },
                            React.createElement('span', { className: "text-text-primary" }, site.icon),
                            React.createElement('span', { className: "text-xs text-text-secondary mt-1" }, site.name)
                        )
                    ))
                )
            )
        )
    );
};

const SearchResults = () => {
    const { searchText, setSearchText } = useAppContext();

    return (
        React.createElement('div', { className: "flex flex-col h-full bg-background" },
            React.createElement('div', { className: "flex-shrink-0 p-3 bg-layer-01/80 backdrop-blur-sm border-b border-border-subtle flex items-center justify-between" },
                React.createElement('p', { className: "text-sm text-text-secondary truncate" },
                    "Results for: ",
                    React.createElement('span', { className: "font-semibold text-text-primary" }, searchText)
                ),
                React.createElement('button', {
                    onClick: () => setSearchText(''),
                    className: "text-sm bg-interactive text-text-on-color font-semibold py-1 px-3 rounded-md hover:bg-interactive-hover transition-colors duration-200"
                }, "New Search")
            ),
            React.createElement('div', { className: "flex-1 overflow-y-auto" },
                React.createElement('div', { className: "flex flex-col gap-4 p-4" },
                SEARCH_ENGINES.map(site => (
                    React.createElement('div', { key: site.id, className: "flex flex-col bg-layer-01 rounded-lg border border-border-subtle overflow-hidden" },
                        React.createElement('div', { className: "flex items-center gap-2 p-2 bg-layer-02/50" },
                            React.createElement('span', { className: "text-text-primary" }, site.icon),
                            React.createElement('h2', { className: "font-semibold text-text-primary" }, site.name)
                        ),
                        React.createElement('div', { className: "w-full h-96" },
                             React.createElement('iframe', {
                                src: `${site.url}${encodeURIComponent(searchText)}`,
                                title: site.name,
                                className: "w-full h-full border-0",
                                sandbox: "allow-scripts allow-same-origin allow-forms"
                             })
                        )
                    )
                ))
                )
            )
        )
    );
};

const Search = () => {
    const { searchText } = useAppContext();
    return searchText ? React.createElement(SearchResults, null) : React.createElement(SearchHome, null);
};

export default Search;