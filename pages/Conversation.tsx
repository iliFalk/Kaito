import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Message, AIModel, Shortcut } from '../types';
import { Sender } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULT_MODELS, PANEL_ROUTES, DEFAULT_SHORTCUTS } from '../constants';
import { generateChatStream } from '../services/geminiService';
import { UserIcon, SparklesIcon, Icon } from '../components/Icons';

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

    const handleSend = useCallback(async () => {
        const trimmedInput = userInput.trim();
        if (!trimmedInput && !attachedFile) return;

        setIsLoading(true);
        const userMessage: Message = {
            id: Date.now().toString(),
            sender: Sender.User,
            text: trimmedInput,
            quotedText: quotedText,
            filePreview: filePreview || undefined,
            fileName: attachedFile?.name,
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

            const stream = await generateChatStream(trimmedInput, history, selectedModel, attachedFile || undefined);
            
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
    }, [userInput, attachedFile, quotedText, messages, filePreview, selectedModel]);

    return (
        <div className="flex flex-col h-full bg-gray-50 text-gray-800">
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
            
            {(filePreview || quotedText) && (
                <div className="px-4 pb-2">
                    <div className="p-2 bg-gray-200 rounded-lg flex items-start gap-2">
                        {filePreview && (
                        <div className="relative">
                            <img src={filePreview} alt="preview" className="h-12 w-12 object-cover rounded"/>
                            <button onClick={removeAttachment} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 text-xs flex items-center justify-center">&times;</button>
                        </div>
                        )}
                        {quotedText && (
                        <div className="flex-1 relative">
                            <p className="text-xs text-gray-600 italic bg-gray-300 p-2 rounded line-clamp-2">"{quotedText}"</p>
                            <button onClick={() => setQuotedText('')} className="absolute top-0 right-0 text-gray-500 hover:text-gray-800">&times;</button>
                        </div>
                        )}
                    </div>
                </div>
            )}

            <div className="p-3 bg-transparent">
                <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-2 border border-gray-200">
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
                        <div className="flex items-center text-gray-500 flex-shrink-0">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Attach file">
                                <Icon name="PaperClipIcon" className="w-5 h-5"/>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Paste from clipboard">
                                <Icon name="ClipboardDocumentIcon" className="w-5 h-5"/>
                            </button>
                            <button className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Copy conversation">
                                <Icon name="DocumentDuplicateIcon" className="w-5 h-5"/>
                            </button>
                            <button onClick={() => navigate(PANEL_ROUTES.SETTINGS)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Settings">
                                <Icon name="Cog6ToothIcon" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-end gap-2 border-t border-gray-200 pt-2">
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
                                    onClick={handleSend}
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