import React, { useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SEARCH_ENGINES } from '../constants';
import { SparklesIcon } from '../components/Icons';

const SearchHome: React.FC = () => {
    const { setSearchText } = useAppContext();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const startSearch = () => {
        const query = textareaRef.current?.value.trim();
        if (query) {
            setSearchText(query);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            startSearch();
        }
    };

    return (
        <div className="flex flex-col h-full p-4 text-gray-200">
            <div className="flex flex-col items-center justify-center flex-grow text-center">
                <SparklesIcon className="w-16 h-16 text-blue-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-100">AI Work Assistant</h1>
                <p className="text-gray-400 mt-1">Search multiple AI engines at once.</p>
            </div>
            
            <div className="flex-shrink-0 mb-4">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        autoFocus
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your question..."
                        className="w-full h-24 p-4 pr-24 bg-[#3c3c3c] border border-[#7a7a7a] rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-100 placeholder-gray-500"
                    />
                     <button
                        onClick={startSearch}
                        className="absolute bottom-3 right-3 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                        Search
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0">
                <p className="text-sm text-gray-500 mb-2 text-center">Available Search Engines:</p>
                <div className="grid grid-cols-3 gap-4">
                    {SEARCH_ENGINES.map(site => (
                        <div key={site.id} className="flex flex-col items-center justify-center p-2 bg-[#3c3c3c] rounded-lg border border-[#5a5a5a]">
                            <span className="text-gray-200">{site.icon}</span>
                            <span className="text-xs text-gray-400 mt-1">{site.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const SearchResults: React.FC = () => {
    const { searchText, setSearchText } = useAppContext();

    return (
        <div className="flex flex-col h-full bg-[#2b2b2b]">
            <div className="flex-shrink-0 p-3 bg-[#3c3c3c]/80 backdrop-blur-sm border-b border-[#5a5a5a] flex items-center justify-between">
                <p className="text-sm text-gray-400 truncate">
                    Results for: <span className="font-semibold text-gray-100">{searchText}</span>
                </p>
                <button
                    onClick={() => setSearchText('')}
                    className="text-sm bg-blue-600 text-white font-semibold py-1 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                    New Search
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4 p-4">
                {SEARCH_ENGINES.map(site => (
                    <div key={site.id} className="flex flex-col bg-[#3c3c3c] rounded-lg border border-[#5a5a5a] overflow-hidden">
                        <div className="flex items-center gap-2 p-2 bg-[#5a5a5a]/50">
                            <span className="text-gray-200">{site.icon}</span>
                            <h2 className="font-semibold text-gray-200">{site.name}</h2>
                        </div>
                        <div className="w-full h-96">
                             <iframe
                                src={`${site.url}${encodeURIComponent(searchText)}`}
                                title={site.name}
                                className="w-full h-full border-0"
                                sandbox="allow-scripts allow-same-origin allow-forms"
                             />
                        </div>
                    </div>
                ))}
                </div>
            </div>
        </div>
    );
};

const Search: React.FC = () => {
    const { searchText } = useAppContext();
    return searchText ? <SearchResults /> : <SearchHome />;
};

export default Search;