import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sender, ApiType } from '../types.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { DEFAULT_MODELS, PANEL_ROUTES, DEFAULT_SHORTCUTS } from '../constants.js';
import { generateChatStream } from '../services/geminiService.js';
import { generateOpenAIChatStream } from '../services/openAIService.js';
import { Icon } from '../components/Icons.js';
import { useAppContext } from '../context/AppContext.js';
import NeuralAnimation from '../components/NeuralAnimation.js';
import TypingKeyboardIcon from '../components/TypingKeyboardIcon.js';

const { useState, useRef, useEffect, useCallback } = React;

const LANGUAGE_OPTIONS = [
    { display: 'English', full: 'English' },
    { display: 'Deutsch', full: 'German' },
    { display: 'Русский', full: 'Russian' },
];

// Basic markdown to HTML renderer
const SimpleMarkdown = React.memo(({ content }) => {
    const html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-background p-2 rounded-md my-2 overflow-x-auto text-sm"><code>${code.trim()}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code class="bg-layer-02 text-text-primary rounded px-1 py-0.5 text-sm">$1</code>')
      .replace(/\n/g, '<br />');
    
    return React.createElement('div', { className: "prose prose-sm max-w-none", dangerouslySetInnerHTML: { __html: html } });
});

const AIMessage = ({ message }) => (
    React.createElement('div', { className: "flex items-start gap-3" },
        React.createElement(NeuralAnimation, { className: "flex-shrink-0 w-8 h-8" }),
        React.createElement('div', { className: `flex-1 bg-layer-01 rounded-lg p-3 max-w-[calc(100%-3rem)] ${message.isStreaming ? 'streaming-border' : ''}` },
            React.createElement('div', { className: "text-text-primary leading-relaxed" },
                message.isStreaming && message.text.length === 0 ? (
                    React.createElement('div', { className: "flex items-center gap-2" },
                        React.createElement('div', { className: "w-2 h-2 bg-interactive rounded-full animate-pulse" }),
                        React.createElement('div', { className: "w-2 h-2 bg-interactive rounded-full animate-pulse delay-75" }),
                        React.createElement('div', { className: "w-2 h-2 bg-interactive rounded-full animate-pulse delay-150" })
                    )
                ) : (
                    React.createElement(SimpleMarkdown, { content: message.text })
                ),
                message.error && React.createElement('p', { className: "text-text-error mt-2" }, message.error)
            )
        )
    )
);

const UserMessage = ({ message }) => (
    React.createElement('div', { className: "flex items-start gap-3 justify-end" },
        React.createElement('div', { className: "flex-1 bg-interactive-active rounded-lg p-3 max-w-[calc(100%-3rem)] order-1" },
             React.createElement('p', { className: "text-text-on-color leading-relaxed" }, message.text),
             message.quotedText && (
                 React.createElement('div', { className: "mt-2 p-2 border-l-2 border-interactive bg-interactive-hover/50 rounded-r-md" },
                    React.createElement('p', { className: "text-xs text-interactive-secondary italic truncate" }, message.quotedText)
                 )
             ),
             message.filePreview && (
                 React.createElement('div', { className: "mt-2" },
                    React.createElement('img', { src: message.filePreview, alt: message.fileName, className: "max-h-32 rounded-md" }),
                    React.createElement('p', { className: "text-xs text-interactive-secondary mt-1" }, message.fileName)
                 )
             ),
             message.pageContext && (
                 React.createElement('div', { className: "mt-2 p-2 border-l-2 border-interactive bg-interactive-hover/50 rounded-r-md" },
                    React.createElement('p', { className: "text-xs text-interactive-secondary font-semibold" }, message.pageContext.title),
                    React.createElement('p', { className: "text-xs text-interactive-secondary italic truncate" }, message.pageContext.url)
                 )
             )
        ),
        React.createElement('div', { className: "flex-shrink-0 w-8 h-8 rounded-full bg-layer-03 flex items-center justify-center order-2" },
            React.createElement(TypingKeyboardIcon, { className: "w-full h-full p-1" })
        )
    )
);

const Conversation = () => {
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
    const [attachedFile, setAttachedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [quotedText, setQuotedText] = useState('');
    const [pageContext, setPageContext] = useState(null);

    const [shortcuts] = useLocalStorage('shortcuts', DEFAULT_SHORTCUTS);
    const [models] = useLocalStorage('ai_models', DEFAULT_MODELS);
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState('English');
    const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);
    const actionsDropdownRef = useRef(null);
    const languageDropdownRef = useRef(null);

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
        const handleClickOutside = (event) => {
            if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target)) {
                setIsActionsDropdownOpen(false);
            }
            if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target)) {
                setIsLanguageDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file && canAttachFile) {
            setAttachedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
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
        const chrome = (window).chrome;
        if (chrome && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'initiateScreenshot' });
        } else {
            console.warn("Screenshot feature only available in extension environment.");
        }
    };

    useEffect(() => {
        const chrome = (window).chrome;
        if (!chrome || !chrome.runtime) return;

        const handleMessage = (request) => {
            if (request.type === 'screenshotTaken' && request.dataUrl && canAttachFile) {
                const dataUrlToFile = async (dataUrl, fileName) => {
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
        const chrome = window.chrome;
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
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

    const handleSend = useCallback(async (options) => {
        const textToSend = options?.prompt ?? userInput.trim();
        const fileToSend = attachedFile;
        const contextToSend = pageContext;
        const currentQuotedText = options?.quotedText ?? quotedText;

        if ((!textToSend && !fileToSend) || !currentConversationId) return;

        setIsLoading(true);

        const userMessage = {
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
        const aiMessage = { id: aiMessageId, sender: Sender.AI, text: '', isStreaming: true };
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
                        role: h.role === 'user' ? 'user' : 'assistant',
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
    
    const handleFileAction = (prompt) => {
        if (!attachedFile) return;
        handleSend({ prompt });
    };

    const handleContextAction = (action) => {
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
            React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center p-4" },
                React.createElement(Icon, { name: "CpuChipIcon", className: "w-16 h-16 text-support-error mb-4" }),
                React.createElement('h2', { className: "text-xl font-bold text-text-primary" }, "No AI Model Configured"),
                React.createElement('p', { className: "text-text-secondary mt-2" }, "Please go to Settings > Manage AI Models to add and select a default model.")
            )
        )
    }

    return (
        React.createElement('div', { className: "flex flex-col h-full" },
            React.createElement('style', null, `
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
            `),
            React.createElement('div', { className: "flex-1 p-4 space-y-4 overflow-y-auto" },
                messages.length === 0 && (
                     React.createElement('div', { className: "flex flex-col items-center justify-center h-full text-center" },
                        React.createElement(NeuralAnimation, { className: "w-32 h-32" }),
                        React.createElement('p', { className: "mt-4 text-lg font-medium text-text-secondary" }, "How can I help you today?")
                    )
                ),
                messages.map(message =>
                    message.sender === Sender.AI ? (
                        React.createElement(AIMessage, { key: message.id, message: message })
                    ) : (
                        React.createElement(UserMessage, { key: message.id, message: message })
                    )
                ),
                React.createElement('div', { ref: messagesEndRef })
            ),
            React.createElement('div', { className: "p-3 bg-transparent" },
                React.createElement('div', { className: `bg-layer-01 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] p-2 border ${attachedFile || pageContext ? 'border-interactive' : 'border-border-strong'}` },
                    attachedFile ? (
                        React.createElement('div', null,
                            React.createElement('div', { className: "flex items-center justify-between p-1" },
                                React.createElement('div', { className: "flex items-center gap-3" },
                                    React.createElement('div', { className: "w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg border-2 border-dashed border-layer-03 bg-layer-02" },
                                        React.createElement('div', { className: "text-center" },
                                            React.createElement('svg', { className: "w-6 h-6 mx-auto text-interactive", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor" },
                                                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" })
                                            ),
                                            React.createElement('p', { className: "text-[9px] font-bold text-interactive" }, attachedFile.name.split('.').pop()?.toUpperCase())
                                        )
                                    ),
                                    React.createElement('span', { className: "text-sm font-medium text-text-primary truncate max-w-xs" }, attachedFile.name)
                                ),
                                React.createElement('button', { onClick: removeAttachment, className: "p-1.5 text-text-secondary hover:text-text-primary rounded-full hover:bg-layer-02" },
                                    React.createElement(Icon, { name: "TrashIcon", className: "w-5 h-5" })
                                )
                            ),
                            React.createElement('div', { className: "mt-1 mb-1 flex items-center gap-1 px-1" },
                                React.createElement('div', { className: "relative" },
                                    React.createElement('button', { onClick: () => setIsLanguageDropdownOpen(true), className: "flex items-center gap-1 text-xs bg-interactive-active/70 text-interactive-secondary px-2 py-1 rounded-lg hover:bg-interactive-active font-medium" },
                                        React.createElement('span', null, "Extract & Translate:"),
                                        React.createElement('span', { className: "font-semibold" }, LANGUAGE_OPTIONS.find(l => l.full === selectedLanguage).display),
                                        React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", className: "w-4 h-4" }, React.createElement('path', { fillRule: "evenodd", d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z", clipRule: "evenodd" }))
                                    ),
                                    isLanguageDropdownOpen && React.createElement('div', { className: "absolute bottom-full mb-1 w-40 bg-layer-02 rounded-lg shadow-lg border border-border-strong z-10", ref: languageDropdownRef },
                                        React.createElement('ul', { className: "py-1" },
                                            LANGUAGE_OPTIONS.map(lang => React.createElement('li', { key: lang.full },
                                                React.createElement('button', { onClick: () => { setSelectedLanguage(lang.full); setIsLanguageDropdownOpen(false); handleFileAction(`Extract text from the image and translate it to ${lang.full}`); }, className: "w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-layer-03" }, lang.display)
                                            ))
                                        )
                                    )
                                ),
                                React.createElement('button', { onClick: () => handleFileAction("Extract all text from this image"), className: "text-xs bg-interactive-active/70 text-interactive-secondary px-2 py-1 rounded-lg hover:bg-interactive-active font-medium" }, "Grab Text"),
                                React.createElement('button', { onClick: () => handleFileAction("Describe this image"), className: "text-xs bg-interactive-active/70 text-interactive-secondary px-2 py-1 rounded-lg hover:bg-interactive-active font-medium" }, "Describe")
                            ),
                            React.createElement('hr', { className: "border-border-strong" })
                        )
                    ) : pageContext ? (
                        React.createElement('div', null,
                            React.createElement('div', { className: "bg-layer-02/80 rounded-lg p-2.5 mb-2" },
                                React.createElement('div', { className: "flex items-start" },
                                    React.createElement(Icon, { name: "LinkIcon", className: "w-5 h-5 text-text-secondary mr-2.5 mt-0.5 flex-shrink-0" }),
                                    React.createElement('div', { className: "flex-1 min-w-0" },
                                        React.createElement('p', { className: "font-semibold text-sm text-text-primary leading-tight" }, pageContext.title),
                                        React.createElement('p', { className: "text-xs text-text-secondary truncate leading-tight mt-0.5" }, pageContext.url)
                                    ),
                                    React.createElement('button', { onClick: removePageContext, className: "ml-2 p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-layer-03 flex-shrink-0" },
                                        React.createElement(Icon, { name: "XMarkIcon", className: "w-4 h-4" })
                                    )
                                )
                            ),
                            React.createElement('div', { className: "flex items-center gap-2 px-1 mb-2" },
                                React.createElement('button', { onClick: () => handleContextAction('Questions'), className: "text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1 rounded-full hover:bg-interactive-active font-medium" }, "Questions"),
                                React.createElement('button', { onClick: () => handleContextAction('Key Points'), className: "text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1 rounded-full hover:bg-interactive-active font-medium" }, "Key Points"),
                                React.createElement('button', { onClick: () => handleContextAction('Summarize'), className: "text-sm bg-interactive-active/70 text-interactive-secondary px-3 py-1 rounded-full hover:bg-interactive-active font-medium" }, "Summarize")
                            ),
                            React.createElement('hr', { className: "border-border-strong" })
                        )
                    ) : quotedText ? (
                        React.createElement('div', { className: "bg-layer-02/80 rounded-lg p-2.5 mb-2" },
                            React.createElement('div', { className: "flex items-start" },
                                React.createElement(Icon, { name: "ChatBubbleLeftRightIcon", className: "w-5 h-5 text-text-secondary mr-2.5 mt-0.5 flex-shrink-0" }),
                                React.createElement('div', { className: "flex-1 min-w-0" },
                                    React.createElement('p', { className: "text-sm text-text-secondary italic truncate" }, `"${quotedText}"`)
                                ),
                                React.createElement('button', { onClick: () => setQuotedText(''), className: "ml-2 p-1 text-text-secondary hover:text-text-primary rounded-full hover:bg-layer-03 flex-shrink-0" },
                                    React.createElement(Icon, { name: "XMarkIcon", className: "w-4 h-4" })
                                )
                            )
                        )
                    ) : (
                        React.createElement('div', { className: "flex items-center justify-between mb-2 px-1" },
                            React.createElement('div', { className: "flex items-center gap-1 text-sm font-semibold text-text-secondary bg-layer-02 rounded-lg px-3 py-1.5" },
                                React.createElement(Icon, { name: "CpuChipIcon", className: "w-4 h-4" }),
                                React.createElement('span', null, activeModel.name)
                            ),
                            React.createElement('div', { className: "flex items-center text-text-secondary" },
                                React.createElement('input', { type: "file", ref: fileInputRef, onChange: handleFileChange, className: "hidden", accept: "image/*", disabled: !canAttachFile }),
                                React.createElement('button', { onClick: () => fileInputRef.current?.click(), className: "p-2 hover:bg-layer-02 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed", 'aria-label': "Attach file", disabled: !canAttachFile, title: !canAttachFile ? "File attachments not supported for this model" : "Attach file" },
                                    React.createElement(Icon, { name: "PaperClipIcon", className: "w-5 h-5" })
                                ),
                                React.createElement('button', { onClick: handlePasteContext, className: "p-2 hover:bg-layer-02 rounded-lg", 'aria-label': "Paste from clipboard" },
                                    React.createElement(Icon, { name: "LinkIcon", className: "w-5 h-5" })
                                )
                            )
                        )
                    ),
                    React.createElement('div', { className: `flex items-end gap-2 ${!attachedFile && !pageContext && !quotedText ? 'border-t border-border-strong pt-2' : ''}` },
                        React.createElement('textarea', {
                            ref: textareaRef,
                            value: userInput,
                            onChange: e => setUserInput(e.target.value),
                            onKeyDown: e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } },
                            placeholder: "Enter message...",
                            className: "w-full bg-layer-01 p-2 text-base text-text-primary placeholder-text-placeholder resize-none focus:ring-0 focus:outline-none max-h-40",
                            rows: 1,
                            disabled: isLoading
                        }),
                        React.createElement('div', { className: "relative flex-shrink-0", ref: actionsDropdownRef },
                            React.createElement('div', { className: "flex items-center bg-layer-01 rounded-xl shadow-sm border border-border-strong/80 overflow-hidden" },
                                React.createElement('button', {
                                    onClick: () => handleSend(),
                                    disabled: isLoading || (!userInput.trim() && !attachedFile && !quotedText),
                                    className: "p-2.5 text-interactive disabled:text-text-placeholder hover:bg-layer-02 transition-colors focus:outline-none focus:ring-2 focus:ring-focus",
                                    'aria-label': "Send message"
                                },
                                    React.createElement(Icon, { name: "PaperAirplaneIcon", className: "w-5 h-5" })
                                ),
                                React.createElement('div', { className: "w-px self-stretch bg-border-strong/80" }),
                                React.createElement('button', {
                                    onClick: () => setIsActionsDropdownOpen(prev => !prev),
                                    className: "p-2 text-text-secondary hover:bg-layer-02 transition-colors focus:outline-none focus:ring-2 focus:ring-focus",
                                    'aria-label': "Quick actions"
                                },
                                    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "w-4 h-4", viewBox: "0 0 20 20", fill: "currentColor" },
                                        React.createElement('path', { fillRule: "evenodd", d: "M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z", clipRule: "evenodd" })
                                    )
                                )
                            ),
                            isActionsDropdownOpen && (
                                React.createElement('div', { className: "absolute bottom-full mb-2 w-56 bg-layer-02 rounded-lg shadow-lg border border-border-strong z-10 right-0" },
                                    React.createElement('ul', { className: "py-1 max-h-48 overflow-y-auto" },
                                        shortcuts.map(shortcut => (
                                            React.createElement('li', { key: shortcut.id },
                                                React.createElement('button', {
                                                    onClick: () => {
                                                        const newPrompt = shortcut.prompt.replace('{{selected_text}}', quotedText || '');
                                                        setUserInput(userInput ? `${userInput}\n${newPrompt}` : newPrompt);
                                                        setIsActionsDropdownOpen(false);
                                                        textareaRef.current?.focus();
                                                    },
                                                    className: "w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-layer-03 flex items-center gap-3"
                                                },
                                                    React.createElement(Icon, { name: shortcut.icon, className: "w-5 h-5 text-text-secondary" }),
                                                    React.createElement('span', { className: "truncate" }, shortcut.title)
                                                )
                                            )
                                        ))
                                    )
                                )
                            )
                        )
                    )
                )
            )
        )
    );
};

export default Conversation;