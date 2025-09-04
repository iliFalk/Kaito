import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message, AIModel, Shortcut } from '../types';
import { Sender } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS, PANEL_ROUTES, DEFAULT_SHORTCUTS } from '../constants';
import { generateChatStream } from '../services/geminiService';
import { UserIcon, SparklesIcon, Icon } from '../components/Icons';
import ScreenshotOverlay from '../components/ScreenshotOverlay';

// Basic markdown to HTML renderer
const SimpleMarkdown: React.FC<{ content: string }> = React.memo(({ content }) => {
    const html = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/g, (_, code) => `<pre class="bg-gray-200 p-2 rounded-md my-2 overflow-x-auto text-sm"><code>${code.trim()}</code></pre>`)
      .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-white rounded px-1 py-0.5 text-sm">$1</code>')
      .replace(/\n/g, '<br />');
    
    return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
});

const AIMessage: React.FC<{ message: Message }> = ({ message }) => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 bg-gray-100 rounded-lg p-3 max-w-[calc(100%-3rem)]">
            <div className="text-gray-800 leading-relaxed">
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
        <div className="flex-1 bg-blue-600 rounded-lg p-3 max-w-[calc(100%-3rem)] order-1">
             <p className="text-white leading-relaxed">{message.text}</p>
             {message.quotedText && (
                 <div className="mt-2 p-2 border-l-2 border-blue-400 bg-blue-500/50 rounded-r-md">
                    <p className="text-xs text-blue-100 italic truncate">{message.quotedText}</p>
                 </div>
             )}
             {message.filePreview && (
                 <div className="mt-2">
                    <img src={message.filePreview} alt={message.fileName} className="max-h-32 rounded-md"/>
                    <p className="text-xs text-blue-100 mt-1">{message.fileName}</p>
                 </div>
             )}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center order-2">
            <UserIcon className="w-5 h-5 text-gray-600" />
        </div>
    </div>
);

const Conversation: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [quotedText, setQuotedText] = useState('');
    const [isTakingScreenshot, setIsTakingScreenshot] = useState(false);

    const [models] = useLocalStorage<AIModel[]>('ai_models', DEFAULT_MODELS);
    const [selectedModel, setSelectedModel] = useLocalStorage<string>('selected_ai_model', DEFAULT_MODELS[0]?.id || '');
    const [shortcuts] = useLocalStorage<Shortcut[]>('shortcuts', DEFAULT_SHORTCUTS);
    const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
    const [isActionsDropdownOpen, setIsActionsDropdownOpen] = useState(false);
    
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const modelDropdownRef = useRef<HTMLDivElement>(null);
    const actionsDropdownRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setIsModelDropdownOpen(false);
            }
            if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
                setIsActionsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
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

    const startScreenshot = useCallback(() => {
        setIsTakingScreenshot(true);
    }, []);

    const handleScreenshotCapture = useCallback((file: File) => {
        if (file) {
            setAttachedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        setIsTakingScreenshot(false);
    }, []);

    const cancelScreenshot = useCallback(() => {
        setIsTakingScreenshot(false);
    }, []);


    const handleSend = useCallback(async (promptOverride?: string) => {
        const textToSend = typeof promptOverride === 'string' ? promptOverride : userInput.trim();
        const fileToSend = attachedFile;

        if (!textToSend && !fileToSend) return;

        setIsLoading(true);
        const userMessage: Message = {
            id: Date.now().toString(),
            sender: Sender.User,
            text: textToSend,
            quotedText: quotedText,
            filePreview: filePreview || undefined,
            fileName: fileToSend?.name,
        };
        const aiMessageId = (Date.now() + 1).toString();

        setMessages(prev => [...prev, userMessage, { id: aiMessageId, sender: Sender.AI, text: '', isStreaming: true }]);
        setUserInput('');
        setQuotedText('');
        removeAttachment();

        try {
            const history = messages.map(msg => ({
                role: msg.sender === Sender.User ? 'user' : 'model',
                parts: [{ text: msg.text }]
            }));

            const stream = await generateChatStream(textToSend, history, selectedModel, fileToSend || undefined);
            
            let fullText = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                fullText += chunkText;
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === aiMessageId ? { ...msg, text: fullText } : msg
                    )
                );
            }
        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, error: `Failed to get response: ${errorMessage}` } : msg
                )
            );
        } finally {
            setIsLoading(false);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, isStreaming: false } : msg
                )
            );
        }
    }, [userInput, attachedFile, filePreview, quotedText, messages, selectedModel]);
    
    const handleFileAction = (prompt: string) => {
        if (!attachedFile) return;
        handleSend(prompt);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 text-gray-800">
            {isTakingScreenshot && <ScreenshotOverlay onCapture={handleScreenshotCapture} onClose={cancelScreenshot} />}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.length === 0 && (
                     <div className="text-left text-gray-800">
                        <p>How can I assist you now?</p>
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
                <div className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-2 border ${attachedFile ? 'border-blue-300' : 'border-gray-200'}`}>
                    {attachedFile ? (
                        <div>
                            <div className="flex items-center justify-between p-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                                        <div className="text-center">
                                            <svg className="w-6 h-6 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" />
                                            </svg>
                                            <p className="text-[9px] font-bold text-blue-500">{attachedFile.name.split('.').pop()?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-800 truncate max-w-xs">{attachedFile.name}</span>
                                </div>
                                <button onClick={removeAttachment} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                                    <Icon name="TrashIcon" className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mt-2 mb-2 flex items-center gap-2 px-1">
                                <button onClick={() => handleFileAction("Extract text from the image and translate it to Simplified Chinese")} className="flex items-center gap-1 text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium">
                                    <span>Extract & Translate:</span>
                                    <span className="font-semibold">简体中文</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => handleFileAction("Extract all text from this image")} className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium">
                                    Grab Text
                                </button>
                                <button onClick={() => handleFileAction("Describe this image")} className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-200 font-medium">
                                    Describe
                                </button>
                            </div>
                            <hr className="border-gray-200"/>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="relative" ref={modelDropdownRef}>
                                <button onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} className="flex items-center gap-1 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg px-3 py-1.5 hover:bg-gray-200" aria-label="Select AI Model">
                                    <Icon name="CpuChipIcon" className="w-4 h-4" />
                                    <span className="max-w-[120px] truncate">{selectedModel}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                                </button>
                                {isModelDropdownOpen && (
                                    <div className="absolute bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                        <ul className="py-1 max-h-48 overflow-y-auto">
                                            {models.map(model => (
                                                <li key={model.id}>
                                                    <button onClick={() => { setSelectedModel(model.id); setIsModelDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between">
                                                        <span className="truncate">{model.name}</span>
                                                        {selectedModel === model.id && <Icon name="CheckCircleIcon" className="w-4 h-4 text-blue-600"/>}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center text-gray-500">
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Attach file">
                                    <Icon name="PaperClipIcon" className="w-5 h-5"/>
                                </button>
                                <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Paste from clipboard">
                                    <Icon name="ClipboardDocumentIcon" className="w-5 h-5"/>
                                </button>
                                <button onClick={startScreenshot} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Take screenshot">
                                    <Icon name="CameraIcon" className="w-5 h-5"/>
                                </button>
                            </div>
                            <div className="flex items-center text-gray-500 flex-shrink-0">
                                <button onClick={() => navigate(PANEL_ROUTES.SETTINGS)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Settings">
                                    <Icon name="Cog6ToothIcon" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className={`flex items-end gap-2 ${!attachedFile ? 'border-t border-gray-200 pt-2' : ''}`}>
                        <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder="Enter message..."
                            className="w-full bg-white p-2 text-base resize-none focus:ring-0 focus:outline-none max-h-40"
                            rows={1}
                            disabled={isLoading}
                        />
                        <div className="relative flex-shrink-0" ref={actionsDropdownRef}>
                            <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isLoading || (!userInput.trim() && !attachedFile)}
                                    className="p-2.5 text-blue-600 disabled:text-gray-400 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    aria-label="Send message">
                                    <Icon name="PaperAirplaneIcon" className="w-5 h-5" />
                                </button>
                                <div className="w-px self-stretch bg-gray-200/80"></div>
                                <button
                                    onClick={() => setIsActionsDropdownOpen(prev => !prev)}
                                    className="p-2 text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    aria-label="Quick actions"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {isActionsDropdownOpen && (
                                <div className="absolute bottom-full mb-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10 right-0">
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
                                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                                                >
                                                    <Icon name={shortcut.icon} className="w-5 h-5 text-gray-500" />
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