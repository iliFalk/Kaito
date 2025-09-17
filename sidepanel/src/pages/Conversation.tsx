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
      .replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-[#2b2b2b] p-2 rounded-md my-2 overflow-x-auto text-sm"><code>${code.trim()}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code class="bg-[#5a5a5a] text-white rounded px-1 py-0.5 text-sm">$1</code>')
      .replace(/\n/g, '<br />');
    
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
});

const AIMessage: React.FC<{ message: Message }> = ({ message }) => (
    <div className="flex items-start gap-3">
        <NeuralAnimation className="flex-shrink-0 w-8 h-8" />
        <div className="flex-1 bg-[#3c3c3c] rounded-lg p-3 max-w-[calc(100%-3rem)]">
            <div className="text-gray-100 leading-relaxed">
                {message.isStreaming && message.text.length === 0 ? (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                    </div>
                ) : (
                    <SimpleMarkdown content={message.text} />
                )}
                {message.error && <p className="text-red-500 mt-2">{message.error}</p>}
            </div>
        </div>
    </div>
);

const UserMessage: React.FC<{ message: Message }> = ({ message }) => (
    <div className="flex items-start gap-3 justify-end">
        <div className="flex-1 bg-blue-800 rounded-lg p-3 max-w-[calc(100%-3rem)] order-1">
             <p className="text-white leading-relaxed">{message.text}</p>
             {message.quotedText && (
                 <div className="mt-2 p-2 border-l-2 border-blue-600 bg-blue-900/50 rounded-r-md">
                    <p className="text-xs text-blue-100 italic truncate">{message.quotedText}</p>
                 </div>
             )}
             {message.filePreview && (
                 <div className="mt-2">
                    <img src={message.filePreview} alt={message.fileName} className="max-h-32 rounded-md"/>
                    <p className="text-xs text-blue-100 mt-1">{message.fileName}</p>
                 </div>
             )}
             {message.pageContext && (
                 <div className="mt-2 p-2 border-l-2 border-blue-600 bg-blue-900/50 rounded-r-md">
                    <p className="text-xs text-blue-100 font-semibold">{message.pageContext.title}</p>
                    <p className="text-xs text-blue-100 italic truncate">{message.pageContext.url}</p>
                 </div>
             )}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black flex items-center justify-center order-2">
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
    const [models] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const actionsDropdownRef = useRef<HTMLDivElement>(null);

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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const startScreenshot = () => {
        const chrome = (window as any).chrome;
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'initiateScreenshot' });
        } else {
            console.warn("Screenshot feature only available in extension environment.");
        }
    };

    useEffect(() => {
        const chrome = (window as any).chrome;
        if (!chrome || !chrome.runtime) return;

        const handleMessage = (request: any) => {
            if (request.type === 'screenshotTaken' && request.dataUrl && canAttachFile) {
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
    }, [canAttachFile]);

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

    if (!activeModel) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <Icon name="CpuChipIcon" className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-100">No AI Model Configured</h2>
                <p className="text-gray-400 mt-2">Please go to Settings &gt; Manage AI Models to add and select a default model.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full text-gray-200">
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <NeuralAnimation className="w-32 h-32" />
                        <p className="mt-4 text-lg font-medium text-gray-400">How can I help you today?</p>
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
                <div className={`bg-[#3c3c3c] rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] p-2 border ${attachedFile || pageContext ? 'border-blue-700' : 'border-[#5a5a5a]'}`}>
                    {attachedFile ? (
                        <div>
                            <div className="flex items-center justify-between p-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg border-2 border-dashed border-[#7a7a7a] bg-[#5a5a5a]">
                                        <div className="text-center">
                                            <svg className="w-6 h-6 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
                                            </svg>
                                            <p className="text-[9px] font-bold text-blue-500">{attachedFile.name.split('.').pop()?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-200 truncate max-w-xs">{attachedFile.name}</span>
                                </div>
                                <button onClick={removeAttachment} className="p-1.5 text-gray-400 hover:text-gray-200 rounded-full hover:bg-[#5a5a5a]">
                                    <Icon name="TrashIcon" className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-2 mb-2 flex items-center gap-2 px-1">
                                <button onClick={() => handleFileAction("Extract text from the image and translate it to Simplified Chinese")} className="flex items-center gap-1 text-sm bg-blue-900/70 text-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-800 font-medium">
                                    <span>Extract & Translate:</span>
                                    <span className="font-semibold">简体中文</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => handleFileAction("Extract all text from this image")} className="text-sm bg-blue-900/70 text-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-800 font-medium">
                                    Grab Text
                                </button>
                                <button onClick={() => handleFileAction("Describe this image")} className="text-sm bg-blue-900/70 text-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-800 font-medium">
                                    Describe
                                </button>
                            </div>
                            <hr className="border-[#5a5a5a]"/>
                        </div>
                    ) : pageContext ? (
                        <div>
                            <div className="bg-[#5a5a5a]/80 rounded-lg p-2.5 mb-2">
                                <div className="flex items-start">
                                    <Icon name="LinkIcon" className="w-5 h-5 text-gray-400 mr-2.5 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-200 leading-tight">{pageContext.title}</p>
                                        <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{pageContext.url}</p>
                                    </div>
                                    <button onClick={removePageContext} className="ml-2 p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-[#7a7a7a] flex-shrink-0">
                                        <Icon name="XMarkIcon" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-1 mb-2">
                                <button onClick={() => handleContextAction('Questions')} className="text-sm bg-blue-900/70 text-blue-200 px-3 py-1 rounded-full hover:bg-blue-800 font-medium">Questions</button>
                                <button onClick={() => handleContextAction('Key Points')} className="text-sm bg-blue-900/70 text-blue-200 px-3 py-1 rounded-full hover:bg-blue-800 font-medium">Key Points</button>
                                <button onClick={() => handleContextAction('Summarize')} className="text-sm bg-blue-900/70 text-blue-200 px-3 py-1 rounded-full hover:bg-blue-800 font-medium">Summarize</button>
                            </div>
                            <hr className="border-[#5a5a5a]"/>
                        </div>
                    ) : quotedText ? (
                        <div className="bg-[#5a5a5a]/80 rounded-lg p-2.5 mb-2">
                            <div className="flex items-start">
                                <Icon name="ChatBubbleLeftRightIcon" className="w-5 h-5 text-gray-400 mr-2.5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-300 italic truncate">"{quotedText}"</p>
                                </div>
                                <button onClick={() => setQuotedText('')} className="ml-2 p-1 text-gray-400 hover:text-gray-200 rounded-full hover:bg-[#7a7a7a] flex-shrink-0">
                                    <Icon name="XMarkIcon" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex items-center gap-1 text-sm font-semibold text-gray-300 bg-[#5a5a5a] rounded-lg px-3 py-1.5">
                                    <Icon name="CpuChipIcon" className="w-4 h-4" />
                                    <span>{activeModel.name}</span>
                            </div>
                            <div className="flex items-center text-gray-400">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" disabled={!canAttachFile} />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-[#5a5a5a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Attach file" disabled={!canAttachFile} title={!canAttachFile ? "File attachments not supported for this model" : "Attach file"}>
                                    <Icon name="PaperClipIcon" className="w-5 h-5"/>
                                </button>
                                <button onClick={handlePasteContext} className="p-2 hover:bg-[#5a5a5a] rounded-lg" aria-label="Paste from clipboard">
                                    <Icon name="LinkIcon" className="w-5 h-5"/>
                                </button>
                                <button onClick={startScreenshot} className="p-2 hover:bg-[#5a5a5a] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Take screenshot" disabled={!canAttachFile} title={!canAttachFile ? "Screenshots not supported for this model" : "Take screenshot"}>
                                    <Icon name="CameraIcon" className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`flex items-end gap-2 ${!attachedFile && !pageContext && !quotedText ? 'border-t border-[#5a5a5a] pt-2' : ''}`}>
                        <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Enter message..."
                            className="w-full bg-[#3c3c3c] p-2 text-base text-gray-100 placeholder-gray-500 resize-none focus:ring-0 focus:outline-none max-h-40"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="relative flex-shrink-0" ref={actionsDropdownRef}>
                            <div className="flex items-center bg-[#3c3c3c] rounded-xl shadow-sm border border-[#5a5a5a]/80 overflow-hidden">
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || (!userInput.trim() && !attachedFile && !quotedText)}
                                    className="p-2.5 text-blue-500 disabled:text-gray-500 hover:bg-[#5a5a5a] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    aria-label="Send message">
                                    <Icon name="PaperAirplaneIcon" className="w-5 h-5" />
                                </button>
                                <div className="w-px self-stretch bg-[#5a5a5a]/80"></div>
                                <button
                                    onClick={() => setIsActionsDropdownOpen(prev => !prev)}
                                    className="p-2 text-gray-400 hover:bg-[#5a5a5a] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    aria-label="Quick actions"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {isActionsDropdownOpen && (
                                <div className="absolute bottom-full mb-2 w-56 bg-[#5a5a5a] rounded-lg shadow-lg border border-[#7a7a7a] z-10 right-0">
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
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-[#7a7a7a] flex items-center gap-3"
                                                >
                                                    <Icon name={shortcut.icon} className="w-5 h-5 text-gray-400" />
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