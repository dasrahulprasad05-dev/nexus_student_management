import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, User, BrainCircuit, RefreshCw, Settings, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AIAcademicAssistant: React.FC = () => {
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    { sender: 'ai', text: 'Hello! I am your Nexus AI Academic Assistant. I analyze your database telemetry (attendance, grades, and quest EXP levels) to help you improve. Ask me "How can I improve my grades?" or "What is my academic risk status?"', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Settings state for Gemini API key
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('nexus_gemini_api_key') || (import.meta.env.VITE_GEMINI_API_KEY as string) || '');
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Query student's records to form contextual responses
  const { data: records } = useQuery({
    queryKey: ['ai-context-records', profile?.id],
    queryFn: async () => {
      if (!profile || profile.role !== 'student') return null;

      const { data: student } = await supabase
        .from('students')
        .select('*, classes(*)')
        .eq('id', profile.id)
        .single();

      const { data: marks } = await supabase
        .from('marks')
        .select('*, exams(*)')
        .eq('student_id', profile.id);

      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', profile.id);

      const totalAtt = attendance?.length || 0;
      const presentAtt = attendance?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 95;

      return { student, marks: marks || [], attRate };
    },
    enabled: !!profile && profile.role === 'student'
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: timeString }]);
    setInput('');
    setIsTyping(true);

    if (profile?.role !== 'student') {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: "I have analyzed your request, but I can only provide insights based on student profiles. Please verify you are logged in as a Student to inspect exam metrics.",
          time: timeString
        }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: 'Gemini API key is not configured. Please click the Settings gear icon in the top right of this chat to configure your API key, or define `VITE_GEMINI_API_KEY` in your `.env` file.',
          time: timeString
        }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // Dynamic stats calculations
    const gpa = records?.student?.gpa || 0.0;
    const att = records?.attRate || 100;
    
    const prompt = `You are the Nexus AI Academic Assistant, a friendly and supportive virtual tutor for a student.
Here is the student's database telemetry:
- Full Name: ${profile?.full_name}
- Email: ${profile?.email}
- Class: ${records?.student?.classes?.grade_name || 'N/A'} - ${records?.student?.classes?.section || 'N/A'}
- GPA: ${gpa.toFixed(2)} / 4.0
- Attendance Rate: ${att}%
- Exam Marks: ${JSON.stringify(records?.marks?.map((m: any) => ({
    subject: m.exams?.subject_name,
    exam_title: m.exams?.title,
    exam_type: m.exams?.exam_type,
    marks_obtained: m.marks_obtained,
    max_marks: m.exams?.max_marks,
    percentage: Math.round((Number(m.marks_obtained) / Number(m.exams?.max_marks)) * 100)
  })) || [])}

The student asks: "${userText}"

Provide a professional, clear, and encouraging response based on their data. Keep it highly relevant and brief (under 150 words). Provide actionable study recommendations.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error?.message || `HTTP ${response.status}`);
      }
      
      const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I could not process your query at this moment.";
      setMessages(prev => [...prev, { sender: 'ai', text: aiText, time: timeString }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { sender: 'ai', text: `API Connection Error: ${err.message}. Please verify your API Key and network connection.`, time: timeString }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nexus_gemini_api_key', tempApiKey.trim());
    setApiKey(tempApiKey.trim());
    setShowSettings(false);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col justify-between glass-card rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
      
      {/* Bot Header bar */}
      <div className="px-5 py-4 border-b border-white/5 bg-white/2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 rounded-xl shadow-[0_0_10px_rgba(139,92,246,0.15)] animate-pulse">
            <BrainCircuit size={20} />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-wide block">Nexus AI Academic Tutor</span>
            <span className="text-[10px] text-cyber-secondary font-medium tracking-wider uppercase block">Database telemetry analysis</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Settings button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Configure Gemini API Key"
          >
            <Settings size={16} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-success"></span>
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase">Interactive Online</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Console */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 relative animate-fade-in">
        
        {/* Settings Drawer overlay */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-x-0 top-0 bg-[#0c0d16]/95 border-b border-white/10 p-5 z-10 text-xs text-gray-300"
            >
              <form onSubmit={handleSaveApiKey} className="space-y-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-white uppercase tracking-wider">Configure Gemini API Key</span>
                  <button
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Provide your Gemini API key to query the assistant. Keys are saved locally in your browser's secure storage.
                </p>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full glass-input text-xs pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-2.5 text-gray-500 hover:text-white"
                    >
                      {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button type="submit" className="glass-button-primary py-2 px-4 text-xs font-semibold shrink-0">
                    Save Key
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {messages.map((msg, index) => {
          const isAI = msg.sender === 'ai';
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 rounded-xl border ${
                isAI 
                  ? 'bg-cyber-primary/10 border-cyber-primary/20 text-cyber-secondary shadow-[0_0_10px_rgba(139,92,246,0.05)]' 
                  : 'bg-cyber-secondary/10 border-cyber-secondary/20 text-cyber-secondary'
              }`}>
                {isAI ? <Bot size={15} /> : <User size={15} />}
              </div>

              <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                isAI 
                  ? 'bg-[#12131e]/90 border-white/5 text-gray-300 rounded-tl-none' 
                  : 'bg-gradient-to-r from-cyber-primary/80 to-cyber-secondary/80 border-transparent text-white rounded-tr-none shadow-md'
              }`}>
                <div className="whitespace-pre-line">{msg.text}</div>
                <span className="text-[9px] text-gray-500 block text-right mt-1.5 font-mono">{msg.time}</span>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-cyber-primary animate-pulse py-2 pl-3">
            <RefreshCw size={14} className="animate-spin" />
            <span className="font-semibold text-[10px] uppercase tracking-widest">AI formulating insights...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel block */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/5 bg-white/2 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={apiKey ? "Ask AI: 'How can I improve my grades?' or 'Predict my GPA'..." : "Configure your API key in settings above to begin..."}
          disabled={!apiKey && profile?.role === 'student'}
          className="flex-1 glass-input text-xs"
        />
        <button
          type="submit"
          disabled={!apiKey && profile?.role === 'student'}
          className="glass-button-primary py-2 px-4 flex items-center justify-center gap-1.5 self-center shadow-[0_0_10px_rgba(139,92,246,0.2)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Consult</span>
          <Send size={12} />
        </button>
      </form>
    </div>
  );
};
