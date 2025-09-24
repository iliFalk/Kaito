import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message, AIModel } from '../types';
import { Sender, ApiType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS, PANEL_ROUTES, DEFAULT_SHORTCUTS } from '../constants';
import { generateChatStream } from '../services/geminiService';
import { generateOpenAIChatStream } from '../services/openAIService';
import { Icon } from '../components/Icons';
import { useAppContext } from '../context/AppContext';
import NeuralAnimation from '../components/NeuralAnimation';
import TypingKeyboardIcon from '../components/TypingKeyboardIcon';

// Basic markdown to HTML renderer
const SimpleMarkdown: React.FC<{ content: string }> = React.memo(({ content }) => {
    const html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-background p-2 rounded-md my-2 overflow-x-auto text-sm"><code>${code.trim()}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code class="bg-layer-02 text-text-primary rounded px-1 py-0.5 text-sm">$1</code>')
      .replace(/\n/g, '<br />');
    
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
});

const AIMessage: React.FC<{ message: Message }> = ({ message }) => (
    <div className="flex items-start gap-3">
        <NeuralAnimation className="flex-shrink-0 w-8 h-8" />
        <div className={`flex-1 bg-layer-01 rounded-lg p-3 max-w-[calc(100%-3rem)] ${message.isStreaming ? 'streaming-border' : ''}`}>
            <div className="text-text-primary leading-relaxed">
                {message.isStreaming && message.text.length === 0 ? (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-interactive rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-interactive rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-interactive rounded-full animate-pulse delay-150"></div>
                    </div>
                ) : (
                    <SimpleMarkdown content={message.text} />
                )}
                {message.error && <p className="text-text-error mt-2">{message.error}</p>}
            </div>
        </div>
    </div>
);

const UserMessage: React.FC<{ message: Message }> = ({ message }) => (
    <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 bg-interactive-active rounded-lg p-3 max-w-[calc(100%-3rem)] order-1">
             <p className="text-text-on-color leading-relaxed">{message.text}</p>
             {message.quotedText && (
                 <div className="mt-2 p-2 border-l-2 border-interactive bg-interactive-hover/50 rounded-r-md">
                    <p className="text-xs text-interactive-secondary italic truncate">{message.quotedText}</p>
                 </div>
             )}
             {message.filePreview && (
                 <div className="mt-2">
                    <img src={message.filePreview} alt={message.fileName} className="max-h-32 rounded-md"/>
                    <p className="text-xs text-interactive-secondary mt-1">{message.fileName}</p>
                 </div>
             )}
             {message.pageContext && (
                 <div className="mt-2 p-2 border-l-2 border-interactive bg-interactive-hover/50 rounded-r-md">
                    <p className="text-xs text-interactive-secondary font-semibold">{message.pageContext.title}</p>
                    <p className="text-xs text-interactive-secondary italic truncate">{message.pageContext.url}</p>
                 </div>
             )}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-layer-03 flex items-center justify-center order-2">
            <TypingKeyboardIcon className="w-full h-full p-1" />
        </div>
    </div>
);

const Conversation: React.FC = () => {
    const { 
        conversations, 
        currentConversationId, 
        addMessage, 
        updateStreamingMessage, 
        getConversationHistory,
        newChat,
        pendingShortcutAction,
        clearPendingShortcutAction,
        pendingQuotedText,
        clearPendingQuotedText,
    } = useAppContext();

    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [quotedText, setQuotedText] = useState('');
    const [pageContext, setPageContext] = useState<{ title: string; url: string } | null>(null);

    const [shortcuts] = useLocalStorage('shortcuts', DEFAULT_SHORTCUTS);
    const [models, setModels] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const actionsDropdownRef = useRef<HTMLDivElement>(null);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    const messages = currentConversationId ? conversations[currentConversationId] || [] : [];
    const activeModel = models.find(m => m.isDefault) || models[0] || DEFAULT_MODELS[0];
    const canAttachFile = activeModel?.apiType === ApiType.Gemini && activeModel?.supportImage;


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!currentConversationId) {
            newChat();
        }
    }, [currentConversationId, newChat]);

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
                setIsActionsDropdownOpen(false);
            }
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setIsModelDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && canAttachFile) {
            setAttachedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeAttachment = () => {
        setAttachedFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const dt = e.clipboardData;
        if (!dt) return;

        // Prefer DataTransferItem API for pasted images
        if (canAttachFile && dt.items && dt.items.length) {
            for (let i = 0; i < dt.items.length; i++) {
                const item = dt.items[i];
                if (item.kind === 'file') {
                    const file = item.getAsFile();
                    if (file && file.type.startsWith('image/')) {
                        setAttachedFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setFilePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                        e.preventDefault();
                        return;
                    }
                }
            }
        }

        // Fallback to files list
        if (canAttachFile && dt.files && dt.files.length) {
            const file = dt.files[0];
            if (file && file.type.startsWith('image/')) {
                setAttachedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
                e.preventDefault();
                return;
            }
        }

        // Support data URL pasted as text
        const text = dt.getData('text/plain');
        if (canAttachFile && text && text.startsWith('data:image/')) {
            try {
                const res = await fetch(text);
                const blob = await res.blob();
                const ext = blob.type.split('/')[1] || 'png';
                const file = new File([blob], `pasted-image.${ext}`, { type: blob.type });
                setAttachedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFilePreview(reader.result as string);
                };
                reader.readAsDataURL(file);
                e.preventDefault();
                return;
            } catch {
                // If fetch fails, allow default paste behavior
            }
        }
    };
    
    const startScreenshot = () => {
        const chrome = (window as any).chrome;
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'initiateScreenshot' });
        } else {
            console.warn("Screenshot feature only available in extension environment.");
        }
    };

    const handlePasteContext = () => {
        const chrome = (window as any).chrome;
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs: any[]) => {
                if (chrome.runtime.lastError) {
                    console.error('AI Sidekick: Error querying tabs:', chrome.runtime.lastError.message);
                    return;
                }
                if (tabs && tabs.length > 0 && tabs[0].url) {
                    // Filter out the extension's own pages.
                    if (tabs[0].url.startsWith('chrome-extension://')) {
                         console.warn("AI Sidekick: Active tab is an extension page. Cannot get page context.");
                         return;
                    }
                    setPageContext({
                        title: tabs[0].title || 'No title',
                        url: tabs[0].url,
                    });
                } else {
                    console.error('AI Sidekick: Could not get active tab info.');
                }
            });
        } else {
            // Fallback for development outside of the extension
            console.warn("AI Sidekick: Not in a Chrome extension environment. Using placeholder context.");
            setPageContext({
                title: 'Example Page Title',
                url: 'https://example.com',
            });
        }
    };

    const removePageContext = () => {
        setPageContext(null);
    };

    const handleSend = useCallback(async (options?: { prompt?: string; quotedText?: string }) => {
        const textToSend = options?.prompt ?? userInput.trim();
        const fileToSend = attachedFile;
        const contextToSend = pageContext;
        const currentQuotedText = options?.quotedText ?? quotedText;

        if ((!textToSend && !fileToSend) || !currentConversationId) return;

        setIsLoading(true);

        const userMessage: Message = {
            id: Date.now().toString(),
            sender: Sender.User,
            text: textToSend,
            quotedText: currentQuotedText,
            filePreview: filePreview || undefined,
            fileName: fileToSend?.name,
            pageContext: contextToSend || undefined,
        };
        addMessage(currentConversationId, userMessage);
        
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = { id: aiMessageId, sender: Sender.AI, text: '', isStreaming: true };
        addMessage(currentConversationId, aiMessage);
        
        const promptForApi = contextToSend 
            ? `Regarding the page "${contextToSend.title}" (${contextToSend.url}):\n\n${textToSend}` 
            : textToSend;

        setUserInput('');
        setQuotedText('');
        removeAttachment();
        setPageContext(null);

        try {
            if (activeModel.apiType === ApiType.OpenAI) {
                if (!activeModel.apiKey || !activeModel.baseUrl) {
                    throw new Error("OpenAI model is not configured with API Key and Base URL.");
                }
                const history = getConversationHistory(currentConversationId)
                    .map(h => ({
                        role: h.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
                        content: h.parts[0].text
                    }));

                const stream = generateOpenAIChatStream(promptForApi, history, activeModel.apiKey, activeModel.baseUrl, activeModel.model, activeModel.temperature);
                for await (const chunk of stream) {
                    updateStreamingMessage(currentConversationId, aiMessageId, chunk, false);
                }
            } else { // Gemini
                if (!process.env.API_KEY) {
                    throw new Error("API key is not configured. Please ensure the API_KEY environment variable is set.");
                }
                const history = getConversationHistory(currentConversationId);
                const stream = await generateChatStream(promptForApi, history, activeModel.model, process.env.API_KEY, fileToSend || undefined);
                
                for await (const chunk of stream) {
                    const chunkText = chunk.text;
                    updateStreamingMessage(currentConversationId, aiMessageId, chunkText, false);
                }
            }
            updateStreamingMessage(currentConversationId, aiMessageId, '', true);

        } catch (error) {
            console.error("AI API error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            updateStreamingMessage(currentConversationId, aiMessageId, '', true, `Failed to get response: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [
        userInput, attachedFile, filePreview, quotedText, pageContext,
        currentConversationId, addMessage, updateStreamingMessage,
        getConversationHistory, models, activeModel
    ]);

    useEffect(() => {
        const chrome = (window as any).chrome;
        if (!chrome || !chrome.runtime) return;

        const handleMessage = (request: any) => {
            if (request.type === 'screenshotAction' && request.dataUrl && canAttachFile) {
                const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    return new File([blob], fileName, { type: blob.type });
                };

                dataUrlToFile(request.dataUrl, `screenshot-${Date.now()}.png`).then(file => {
                    setAttachedFile(file);
                    setFilePreview(request.dataUrl);

                    // Perform action based on the selected option
                    let prompt = '';
                    switch (request.action) {
                        case 'describe':
                            prompt = 'Describe this image';
                            break;
                        case 'grab-text':
                            prompt = 'Extract all text from this image';
                            break;
                        case 'extract-translate':
                            prompt = 'Extract text from this image and translate it to Simplified Chinese';
                            break;
                        default:
                            return; // Don't send if no valid action
                    }

                    // Automatically send the message with the selected action
                    handleSend({ prompt });
                });
            } else if (request.type === 'screenshotTaken' && request.dataUrl && canAttachFile) {
                // Fallback for old behavior
                const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
                    const res = await fetch(dataUrl);
                    const blob = await res.blob();
                    return new File([blob], fileName, { type: blob.type });
                };

                dataUrlToFile(request.dataUrl, `screenshot-${Date.now()}.png`).then(file => {
                    setAttachedFile(file);
                    setFilePreview(request.dataUrl);
                });
            }
        };

        chrome.runtime.onMessage.addListener(handleMessage);
        return () => {
            if (chrome.runtime && chrome.runtime.onMessage) {
                chrome.runtime.onMessage.removeListener(handleMessage);
            }
        };
    }, [canAttachFile, handleSend]);

    useEffect(() => {
        if (pendingShortcutAction) {
            const { shortcut, selectedText } = pendingShortcutAction;
            const newPrompt = shortcut.prompt.replace('{{selected_text}}', selectedText);
            handleSend({ prompt: newPrompt, quotedText: selectedText });
            clearPendingShortcutAction();
        }
    }, [pendingShortcutAction, clearPendingShortcutAction, handleSend]);

    useEffect(() => {
        if (pendingQuotedText) {
            setQuotedText(pendingQuotedText);
            textareaRef.current?.focus();
            clearPendingQuotedText();
        }
    }, [pendingQuotedText, clearPendingQuotedText]);
    
    const handleFileAction = (prompt: string) => {
        if (!attachedFile) return;
        handleSend({ prompt });
    };

    const handleContextAction = (action: 'Questions' | 'Key Points' | 'Summarize') => {
        if (!pageContext) return;

        let prompt = '';
        switch(action) {
            case 'Questions':
                prompt = `Generate some key questions about the content of this page.`;
                break;
            case 'Key Points':
                prompt = `Extract the key points from the content of this page.`;
                break;
            case 'Summarize':
                prompt = `Summarize the content of this page.`;
                break;
        }
        handleSend({ prompt });
    };

    const handleModelSelect = (modelId: string) => {
        setModels(prev => prev.map(m => ({ ...m, isDefault: m.id === modelId })));
        setIsModelDropdownOpen(false);
    };

    const handleModelDropdownToggle = () => {
        setIsModelDropdownOpen(prev => !prev);
    };

    if (!activeModel) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Icon name="CpuChipIcon" className="w-16 h-16 text-support-error mb-4" />
                <h2 className="text-xl font-bold text-text-primary">No AI Model Configured</h2>
                <p className="text-text-secondary mt-2">Please go to Settings &gt; Manage AI Models to add and select a default model.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <style>{`
                @keyframes spin {
                    to { --angle: 360deg; }
                }
                
                @keyframes pulse-glow {
                    0% { filter: drop-shadow(0 0 6px rgba(0, 80, 207, 0.6)); }
                    50% { filter: drop-shadow(0 0 14px rgba(0, 80, 207, 0.9)); }
                    100% { filter: drop-shadow(0 0 6px rgba(0, 80, 207, 0.6)); }
                }

                @property --angle {
                    syntax: '<angle>';
                    initial-value: 0deg;
                    inherits: false;
                }

                .streaming-border {
                    border: 3px solid transparent;
                    background: 
                        linear-gradient(var(--layer-01), var(--layer-01)) padding-box,
                        conic-gradient(from var(--angle), var(--layer-01) 40%, var(--interactive), var(--layer-01) 60%) border-box;
                    animation: spin 2.5s linear infinite, pulse-glow 2s ease-in-out infinite;
                }
            `}</style>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <NeuralAnimation className="w-32 h-32" />
                        <p className="mt-4 text-lg font-medium text-text-secondary">How can I help you today?</p>
                    </div>
                )}
                {messages.map(message =>
                    message.sender === Sender.AI ? (
                        <AIMessage key={message.id} message={message} />
                    ) : (
                        <UserMessage key={message.id} message={message} />
                    )
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-transparent">
                <div className={`bg-layer-01 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] p-2 border ${attachedFile || pageContext ? 'border-interactive' : 'border-border-strong'}`}>
                    {attachedFile ? (
                        <div>
                            <div className="flex items-center justify-between p-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg border-2 border-dashed border-layer-03 bg-layer-02">
                                        <div className="text-center">
                                            <svg className="w-6 h-6 mx-auto text-interactive" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
                                            </svg>
                                            <p className="text-[9px] font-bold text-interactive">{attachedFile.name.split('.').pop()?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-text-primary truncate max-w-xs">{attachedFile.name}</span>
                                </div>
                                <button onClick={removeAttachment} className="p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-layer-02">
                                    <Icon name="TrashIcon" className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-2 mb-2 flex items-center gap-2 px-1">
                                <button onClick={() => handleFileAction("Extract text from the image and translate it to Simplified Chinese")} className="flex items-center gap-1 text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1.5 rounded-lg hover:bg-interactive-active font-medium">
                                    <span>Extract & Translate:</span>
                                    <span className="font-semibold">简体中文</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => handleFileAction("Extract all text from this image")} className="text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1.5 rounded-lg hover:bg-interactive-active font-medium">
                                    Grab Text
                                </button>
                                <button onClick={() => handleFileAction("Describe this image")} className="text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1.5 rounded-lg hover:bg-interactive-active font-medium">
                                    Describe
                                </button>
                            </div>
                            <hr className="border-border-strong"/>
                        </div>
                    ) : pageContext ? (
                        <div>
                            <div className="bg-layer-02/80 rounded-lg p-2.5 mb-2">
                                <div className="flex items-start">
                                    <Icon name="LinkIcon" className="w-5 h-5 text-text-secondary mr-2.5 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-text-primary leading-tight">{pageContext.title}</p>
                                        <p className="text-xs text-text-secondary truncate leading-tight mt-0.5">{pageContext.url}</p>
                                    </div>
                                    <button onClick={removePageContext} className="ml-2 p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-layer-03 flex-shrink-0">
                                        <Icon name="XMarkIcon" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1 mb-2">
                                <button onClick={() => handleContextAction('Questions')} className="text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1 rounded-full hover:bg-interactive-active font-medium">Questions</button>
                                <button onClick={() => handleContextAction('Key Points')} className="text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1 rounded-full hover:bg-interactive-active font-medium">Key Points</button>
                                <button onClick={() => handleContextAction('Summarize')} className="text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1 rounded-full hover:bg-interactive-active font-medium">Summarize</button>
                            </div>
                            <hr className="border-border-strong"/>
                        </div>
                    ) : quotedText ? (
                        <div className="bg-layer-02/80 rounded-lg p-2.5 mb-2">
                            <div className="flex items-start">
                                <Icon name="ChatBubbleLeftRightIcon" className="w-5 h-5 text-text-secondary mr-2.5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-text-secondary italic truncate">"{quotedText}"</p>
                                </div>
                                <button onClick={() => setQuotedText('')} className="ml-2 p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-layer-03 flex-shrink-0">
                                    <Icon name="XMarkIcon" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="relative" ref={modelDropdownRef} style={{ zIndex: 60 }}>
                                <button
                                    type="button"
                                    onClick={handleModelDropdownToggle}
                                    aria-haspopup="listbox"
                                    aria-expanded={isModelDropdownOpen}
                                    className="flex items-center gap-1 text-sm font-semibold text-text-secondary bg-layer-02 rounded-lg px-3 py-1.5 hover:bg-layer-03 transition-colors cursor-pointer"
                                >
                                    <Icon name="SparklesIcon" className="w-4 h-4" />
                                    <span>{activeModel.name}</span>
                                    <svg className={`w-4 h-4 ml-1 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isModelDropdownOpen && (
                                    <div className="absolute bottom-full mb-1 w-56 bg-layer-02 rounded-lg shadow-lg border border-border-strong z-50">
                                        <ul className="py-1 max-h-48 overflow-y-auto" role="listbox">
                                            {models.length === 0 ? (
                                                <li className="px-3 py-2 text-sm text-text-secondary">No models configured</li>
                                            ) : (
                                                models.map(model => (
                                                    <li key={model.id}>
                                                        <button
                                                            onClick={() => handleModelSelect(model.id)}
                                                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 hover:bg-layer-03 ${
                                                                model.isDefault ? 'text-interactive' : 'text-text-primary'
                                                            }`}
                                                        >
                                                            <Icon name="SparklesIcon" className="w-5 h-5 text-text-secondary" />
                                                            <span className="truncate">{model.name}</span>
                                                            {model.isDefault && (
                                                                <span className="ml-auto text-xs text-interactive">Default</span>
                                                            )}
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center text-text-secondary">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={!canAttachFile} />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-layer-02 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Attach file" disabled={!canAttachFile} title={!canAttachFile ? "File attachments not supported for this model" : "Attach file"}>
                                    <Icon name="PaperClipIcon" className="w-5 h-5"/>
                                </button>
                                <button onClick={handlePasteContext} className="p-2 hover:bg-layer-02 rounded-lg" aria-label="Paste from clipboard">
                                    <Icon name="LinkIcon" className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`flex items-end gap-2 ${!attachedFile && !pageContext && !quotedText ? 'border-t border-border-strong pt-2' : ''}`}>
                        <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onPaste={handlePaste}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Enter message..."
                            className="w-full bg-layer-01 p-2 text-base text-text-primary placeholder-text-placeholder resize-none focus:ring-0 focus:outline-none max-h-40"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="relative flex-shrink-0" ref={actionsDropdownRef}>
                            <div className="flex items-center bg-layer-01 rounded-xl shadow-sm border border-border-strong/80 overflow-hidden hover:bg-layer-02 transition-colors">
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || (!userInput.trim() && !attachedFile && !quotedText)}
                                    className="p-2.5 text-interactive disabled:text-text-placeholder transition-colors focus:outline-none focus:ring-2 focus:ring-focus"
                                    aria-label="Send message">
                                    <Icon name="PaperAirplaneIcon" className="w-5 h-5" />
                                </button>
                                <div className="w-px self-stretch bg-border-strong/80"></div>
                                <button
                                    onClick={() => setIsActionsDropdownOpen(prev => !prev)}
                                    className="p-2 text-text-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-focus"
                                    aria-label="Quick actions"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {isActionsDropdownOpen && (
                                <div className="absolute bottom-full mb-2 w-56 bg-layer-02 rounded-lg shadow-lg border border-border-strong z-10 right-0">
                                    <ul className="py-1 max-h-48 overflow-y-auto">
                                        {shortcuts.map(shortcut => (
                                            <li key={shortcut.id}>
                                                <button
                                                    onClick={() => {
                                                        const newPrompt = shortcut.prompt.replace('{{selected_text}}', quotedText || '');
                                                        setUserInput(userInput ? `${userInput}\n${newPrompt}` : newPrompt);
                                                        setIsActionsDropdownOpen(false);
                                                        textareaRef.current?.focus();
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-layer-03 flex items-center gap-3"
                                                >
                                                    <Icon name={shortcut.icon} className="w-5 h-5 text-text-secondary" />
                                                    <span className="truncate">{shortcut.title}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Conversation;
