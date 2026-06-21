import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Sparkles, CheckCircle, ShieldAlert } from 'lucide-react';
import { ChatMessage, ActionItem } from '../types';

interface AICoachViewProps {
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => Promise<void>;
  onAdoptAction: (action: ActionItem) => Promise<void>;
  isLoading: boolean;
}

export default function AICoachView({ chatHistory, onSendMessage, onAdoptAction, isLoading }: AICoachViewProps) {
  const [input, setInput] = useState('');
  const [adoptingActionTitle, setAdoptingActionTitle] = useState<string | null>(null);
  const [adoptNotification, setAdoptNotification] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await onSendMessage(msg);
  };

  const handleAdopt = async (action: ActionItem) => {
    setAdoptingActionTitle(action.title);
    await onAdoptAction(action);
    setAdoptingActionTitle(null);
    setAdoptNotification(`" ${action.title} " added to your challenges!`);
    setTimeout(() => setAdoptNotification(null), 3500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-13.5rem)] animate-fade-in">
      
      {/* 1. Left Description Card */}
      <div className="lg:col-span-12 xl:col-span-4 bg-white border border-emerald-50 rounded-[32px] p-6 shadow-sm shadow-emerald-100/50 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-250">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-slate-855 text-lg">AI Carbon Coach</h3>
          </div>
          <p className="text-xs text-slate-550 leading-relaxed mb-4 font-medium">
            EcoCoach is synced live with your actual habits. You can type organic queries like 
            <span className="font-extrabold block my-1.5 text-emerald-600 font-mono">"How can I cut my commute cost?"</span> or 
            <span className="font-extrabold block text-emerald-600 font-mono">"Analyze my diet footprint limits."</span>
          </p>

          <div className="bg-emerald-50/55 border border-emerald-105 rounded-[24px] p-5 space-y-3 mt-6">
            <h4 className="text-[10px] font-extrabold tracking-wider text-emerald-800 uppercase">COACH SPECIALTIES</h4>
            <ul className="text-xs text-slate-600 space-y-2.5 list-disc pl-4 font-medium">
              <li>Detailed footprint audits.</li>
              <li>Dual financial & carbon calculations.</li>
              <li>Generates modular tailored action cards.</li>
            </ul>
          </div>
        </div>

        {adoptNotification && (
          <div className="bg-emerald-555 border border-emerald-610 text-white text-xs py-3.5 px-4 rounded-2xl flex items-center space-x-2 animate-bounce font-bold shadow-md shadow-emerald-110">
            <CheckCircle className="w-4 h-4 text-emerald-100" />
            <span>{adoptNotification}</span>
          </div>
        )}
      </div>

      {/* 2. Main Chat dialogue pane */}
      <div className="lg:col-span-12 xl:col-span-8 bg-white border border-emerald-50 rounded-[32px] shadow-sm shadow-emerald-100/50 flex flex-col justify-between h-full overflow-hidden">
        
        {/* Messages feed */}
        <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-emerald-50/10">
          {chatHistory.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              {/* Message bubble */}
              <div 
                className={`py-3.5 px-4.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white rounded-tr-none'
                    : 'bg-white border border-emerald-50 text-slate-800 rounded-tl-none shadow-sm shadow-emerald-50/40'
                }`}
              >
                <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
              </div>

              {/* In-line Custom Recommendation Cards for assistant response */}
              {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                <div className="w-full mt-4 space-y-3">
                  <span className="text-[10px] font-extrabold text-slate-400 block tracking-wider uppercase">
                    AI Suggested Actions
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {msg.suggestedActions.map((action, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border border-emerald-50 rounded-2xl p-4.5 hover:border-emerald-300 hover:shadow-md transition duration-155 flex flex-col justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-extrabold text-slate-900 text-xs tracking-tight line-clamp-1">{action.title}</h5>
                            <span className="bg-emerald-50 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded text-[9px] border border-emerald-100">
                              -{action.co2Saving} kg/mo
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-450 mt-1.5 line-clamp-2 leading-normal font-medium">
                            {action.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-emerald-50 flex items-center justify-between gap-1">
                          <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">{action.costImpact}</span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">{action.difficulty}</span>
                          </div>

                          <button
                            onClick={() => handleAdopt(action)}
                            disabled={adoptingActionTitle === action.title}
                            className="bg-slate-900 hover:bg-black text-white text-[10px] font-extrabold uppercase tracking-wider py-1.5 px-3 rounded-xl transition duration-100 cursor-pointer disabled:opacity-50"
                          >
                            {adoptingActionTitle === action.title ? 'Adopting...' : 'Adopt'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-[9px] text-slate-400 mt-1 font-bold px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex max-w-[85%] mr-auto items-start">
              <div className="bg-white border border-emerald-50 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2.5 text-slate-500 text-xs font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Coach is analyzing your footprint variables...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form footer input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-emerald-55 flex items-center space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Describe an eco target or type a custom question..."
            className="flex-grow py-3 px-5 border border-emerald-100 rounded-2xl text-sm text-slate-800 bg-white placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-slate-900 hover:bg-black text-white rounded-2xl transition duration-150 shadow-md cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
