import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Bot, Send, User, Lightbulb } from "lucide-react";

const STATIC_RESPONSE = `Based on current illumination data, here are the top 3 priority streets in Barangay Tenejero:

M. Dela Cruz Street – Critical (avg: 4.2 lux)
Rizal Avenue – Critical (avg: 6.8 lux)
Burgos Street – Low (avg: 8.1 lux)

I recommend immediate maintenance on M. Dela Cruz Street and Rizal Avenue to improve public safety.`;

const LOADING_DELAY_MS = 1000;
const TYPING_DELAY_MS = 600;

type MessageType = 'user' | 'bot';

interface ChatMessage {
  id: number;
  type: MessageType;
  content: string;
  timestamp: Date;
}

function Luxor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const loadingTimeoutRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const clearPendingTimers = () => {
    if (loadingTimeoutRef.current !== null) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    if (typingTimeoutRef.current !== null) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      clearPendingTimers();
    };
  }, []);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    clearPendingTimers();

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // If this is the first message, add greeting first
    if (messages.length === 0) {
      const greetingMessage: ChatMessage = {
        id: Date.now() - 1,
        type: 'bot',
        content: "Hello! I'm ready to help you with any questions about LIWANAG's street illumination system. What would you like to know?",
        timestamp: new Date()
      };
      setMessages([greetingMessage, userMessage]);
    } else {
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInputMessage('');
    setIsTyping(false);
    setIsLoading(true);

    loadingTimeoutRef.current = window.setTimeout(() => {
      loadingTimeoutRef.current = null;
      setIsLoading(false);
      setIsTyping(true);

      typingTimeoutRef.current = window.setTimeout(() => {
        typingTimeoutRef.current = null;
        const botMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: STATIC_RESPONSE,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, TYPING_DELAY_MS);
    }, LOADING_DELAY_MS);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0D1117] to-[#151B23]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar">
        {/* Welcome Screen - shown when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-2xl">
                <Bot size={40} className="text-gray-900" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-[#0D1117] animate-pulse"></div>
            </div>
            
            {/* Welcome Message */}
            <div className="space-y-4 max-w-md">
              <h1 className="text-4xl font-bold text-white tracking-tight">Hi! I'm Luxor</h1>
              <p className="text-xl text-gray-300 leading-relaxed">
                Welcome to LIWANAG's AI assistant. I'm here to help you with street illumination data, 
                sensor analytics, and lighting coverage insights across Balanga City.
              </p>
              <div className="bg-slate-700/30 rounded-2xl p-4 border border-slate-600/20">
                <p className="text-sm text-gray-400">
                  Try asking me about: sensor readings, street light coverage, illumination levels, 
                  or specific areas in Balanga City
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Regular Chat Messages */}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-start space-x-4 max-w-[75%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                message.type === 'bot' 
                  ? 'bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg' 
                  : 'bg-slate-600 shadow-lg'
              }`}>
                {message.type === 'bot' ? (
                  <Bot size={22} className="text-gray-900" />
                ) : (
                  <User size={22} className="text-white" />
                )}
              </div>
              
              {/* Message */}
              <div className={`px-6 py-4 ${
                message.type === 'bot'
                  ? 'bg-slate-700/40 text-white rounded-3xl rounded-tl-lg border border-slate-600/20'
                  : 'bg-gradient-to-br from-amber-400 to-amber-500 text-gray-900 rounded-3xl rounded-tr-lg shadow-lg'
              }`}>
                <div className="space-y-1">
                  {message.content.split('\n').map((line, idx) => (
                    <p key={idx} className="text-base leading-relaxed whitespace-pre-wrap">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
                <span className={`text-sm mt-3 block ${
                  message.type === 'bot' ? 'text-gray-400' : 'text-gray-700/80'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Lightbulb size={22} className="text-gray-900 animate-pulse" />
              </div>
              <div className="bg-slate-700/40 rounded-3xl rounded-tl-lg px-6 py-4 border border-slate-600/20 flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-amber-400/60 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400">Luxor is analyzing illumination data...</span>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg">
                <Bot size={22} className="text-gray-900" />
              </div>
              <div className="bg-slate-700/40 rounded-3xl rounded-tl-lg px-6 py-4 border border-slate-600/20">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700/50 bg-[#151E2A] p-6">
        <div className="flex items-end space-x-4">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Luxor about street illumination data, sensor readings, lighting coverage..."
              className="w-full bg-slate-700/30 border border-slate-600/30 text-white rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-amber-400/50 placeholder-gray-400 resize-none min-h-[70px] max-h-40 text-lg"
              rows={1}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              Press Enter to send
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 disabled:text-gray-400 p-4 rounded-2xl transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Luxor;
