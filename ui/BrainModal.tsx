import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, Bot, Loader2 } from 'lucide-react';
import { Task } from '../types';
import { chatWithBrain, generateTaskSummary } from '../services/geminiService';

interface BrainModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
}

const BrainModal: React.FC<BrainModalProps> = ({ isOpen, onClose, tasks }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hi! I'm ClickUp Brain. I can help you summarize tasks, suggest priorities, or answer questions about your workspace." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const aiResponse = await chatWithBrain(userMsg, tasks);
    
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsLoading(false);
  };

  const handleQuickAction = async (action: 'summary') => {
     setIsLoading(true);
     setMessages(prev => [...prev, { role: 'user', text: "Generate a summary of my tasks." }]);
     
     if (action === 'summary') {
        const summary = await generateTaskSummary(tasks);
        setMessages(prev => [...prev, { role: 'ai', text: summary }]);
     }
     setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-white to-purple-50/30">
            <div className="flex items-center space-x-2">
                <div className="bg-clickup-purple/10 p-1.5 rounded-lg">
                    <Bot className="text-clickup-purple" size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">ClickUp Brain</h3>
                    <p className="text-xs text-gray-500">Powered by Gemini 2.5 Flash</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fdfdfd]">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-clickup-purple text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'
                        }`}
                    >
                        {msg.text}
                    </div>
                </div>
            ))}
             {isLoading && (
                <div className="flex justify-start">
                     <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2 shadow-sm">
                        <Loader2 size={16} className="animate-spin text-clickup-purple" />
                        <span className="text-xs text-gray-500">Brain is thinking...</span>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
             <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
                <button 
                    onClick={() => handleQuickAction('summary')}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors border border-purple-200/50"
                >
                    <Sparkles size={14} />
                    <span>Summarize Tasks</span>
                </button>
                 <button 
                     onClick={() => {
                         setInput("What tasks are high priority?");
                         handleSend();
                     }}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg text-xs font-medium transition-colors border border-gray-200/50"
                >
                    <span>High Priority Items?</span>
                </button>
            </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
            <div className="relative flex items-center">
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask AI anything about your tasks..."
                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-clickup-purple transition-all text-sm"
                />
                <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 p-1.5 bg-clickup-purple text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                    <Send size={16} />
                </button>
            </div>
            <div className="mt-2 text-center">
                <p className="text-[10px] text-gray-400">AI can make mistakes. Please review generated responses.</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default BrainModal;