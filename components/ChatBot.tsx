

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';
import { SendIcon, SparklesIcon, BookOpenIcon, PlusCircleIcon, CheckIcon, PlusIcon, MinusIcon, ContrastIcon, RefreshIcon } from './icons';
import { mockChatMessages } from '../data/mockChatData';
import { useGlossary } from '../hooks/useGlossary';
import GlossaryModal from './GlossaryModal';

const FONT_SIZE_STEP = 1; 
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 20;
const DEFAULT_FONT_SIZE = 14; // Tailwind's `text-sm`

const AccessibilityToolbar: React.FC<{ onFontSizeChange: (size: number) => void; onToggleContrast: () => void; onReset: () => void; fontSize: number }> = ({ onFontSizeChange, onToggleContrast, onReset, fontSize }) => {
    return (
        <div className="flex items-center space-x-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-md">
            <button onClick={() => onFontSizeChange(fontSize + FONT_SIZE_STEP)} disabled={fontSize >= MAX_FONT_SIZE} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50" title="Increase font size" aria-label="Increase font size">
                <PlusIcon className="w-4 h-4" />
            </button>
            <button onClick={() => onFontSizeChange(fontSize - FONT_SIZE_STEP)} disabled={fontSize <= MIN_FONT_SIZE} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50" title="Decrease font size" aria-label="Decrease font size">
                <MinusIcon className="w-4 h-4" />
            </button>
            <button onClick={onToggleContrast} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded" title="Toggle high contrast" aria-label="Toggle high contrast">
                <ContrastIcon className="w-4 h-4" />
            </button>
             <button onClick={onReset} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded" title="Reset view settings" aria-label="Reset view settings">
                <RefreshIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


interface ChatBotProps {
    isDemoActive: boolean;
    isOffline: boolean;
}

type Chat = ReturnType<typeof createChatSession>;

const ChatBot: React.FC<ChatBotProps> = ({ isDemoActive, isOffline }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const { glossary, addTerm, removeTerm, isTermInGlossary } = useGlossary();
    const [showGlossaryModal, setShowGlossaryModal] = useState(false);

    // Accessibility State
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
    const [highContrast, setHighContrast] = useState(false);

    const resetAccessibility = () => {
        setFontSize(DEFAULT_FONT_SIZE);
        setHighContrast(false);
    };


    useEffect(() => {
        if (isDemoActive) {
            setMessages(mockChatMessages);
        } else {
            const newChat = createChatSession();
            setChat(newChat);
            setMessages([{ role: 'model', text: 'Hello! How can I help you understand your medical instructions today? You can ask me to define a term like "What is an anticoagulant?" or rephrase a sentence.' }]);
        }
    }, [isDemoActive]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!currentMessage.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: currentMessage };
        setMessages(prev => [...prev, userMessage]);
        setCurrentMessage('');
        setIsLoading(true);

        try {
            const responseStream = await chat.sendMessageStream({ message: currentMessage });
            
            let modelResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of responseStream) {
                modelResponse += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].text = modelResponse;
                    return newMessages;
                });
            }
             // After stream, try to parse for definition
            try {
                const parsed = JSON.parse(modelResponse);
                if(parsed.isDefinition && parsed.term && parsed.definition) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                            role: 'model',
                            text: '', // Clear streaming text
                            definition: { term: parsed.term, definition: parsed.definition }
                        };
                        return newMessages;
                    });
                }
            } catch (e) {
                // Not a definition JSON, do nothing. The text is already there.
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div data-tour-id="chat-helper-content" className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-[65vh] sm:h-[70vh] max-h-[700px] ${highContrast ? 'high-contrast-chat' : ''}`}>
                <style>{`
                    .high-contrast-chat { background-color: #000 !important; }
                    .high-contrast-chat .chat-bubble p, .high-contrast-chat .chat-bubble h4 { color: #fff !important; }
                    .high-contrast-chat .user-bubble { background-color: #1e293b !important; } /* A dark blue for contrast */
                    .high-contrast-chat .model-bubble { background-color: #334155 !important; } /* A dark gray for contrast */
                `}</style>
                <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3 gap-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex-shrink-0">Chat Helper</h2>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                         <AccessibilityToolbar onFontSizeChange={setFontSize} onToggleContrast={() => setHighContrast(!highContrast)} onReset={resetAccessibility} fontSize={fontSize} />
                         <button 
                            onClick={() => setShowGlossaryModal(true)}
                            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0"
                            aria-label="Open my glossary"
                        >
                            <BookOpenIcon className="w-5 h-5 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">My Glossary</span> ({glossary.length})
                        </button>
                    </div>
                </div>
                <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`chat-bubble max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'user-bubble bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'model-bubble bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                            {msg.definition ? (
                                <div className="space-y-2">
                                    <h4 className="font-bold text-base text-gray-900 dark:text-gray-100" style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}>{msg.definition.term}</h4>
                                    <p className="whitespace-pre-wrap" style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}>{msg.definition.definition}</p>
                                    <button 
                                        onClick={() => addTerm(msg.definition)}
                                        disabled={isTermInGlossary(msg.definition.term)}
                                        className="mt-2 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 dark:disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isTermInGlossary(msg.definition.term) ? (
                                            <>
                                                <CheckIcon className="w-4 h-4 mr-1 text-green-500" /> Added to Glossary
                                            </>
                                        ) : (
                                            <>
                                                <PlusCircleIcon className="w-4 h-4 mr-1" /> Add to Glossary
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap" style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.5}px` }}>{msg.text}</p>
                            )}
                            </div>
                        </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                            <div className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={currentMessage}
                            onChange={(e) => setCurrentMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={isOffline ? "Chat is unavailable offline" : "Ask a question..."}
                            className="flex-grow p-2 bg-white dark:bg-gray-600 dark:text-gray-100 border border-gray-300 dark:border-gray-500 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700"
                            disabled={isLoading || isDemoActive || isOffline}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !currentMessage.trim() || isDemoActive || isOffline}
                            className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
                            aria-label="Send message"
                        >
                            <SendIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
            <GlossaryModal 
                isOpen={showGlossaryModal}
                onClose={() => setShowGlossaryModal(false)}
                glossary={glossary}
                onRemove={removeTerm}
            />
        </>
    );
};

export default ChatBot;
