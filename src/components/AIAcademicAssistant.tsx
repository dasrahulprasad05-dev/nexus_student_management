import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, User, BrainCircuit, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';


export const AIAcademicAssistant: React.FC = () => {
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    { sender: 'ai', text: 'Hello! I am your Nexus AI Academic Assistant. I analyze your database telemetry (attendance, grades, and quest EXP levels) to help you improve. Ask me "How can I improve my grades?" or "What is my academic risk status?"', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [isTyping, setIsTyping] = useState(false);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: timeString }]);
    setInput('');
    setIsTyping(true);

    // Formulate answer based on queried database
    setTimeout(() => {
      let aiText = "I have analyzed your request, but I can only provide insights based on student profiles. Please verify you are logged in as a Student to inspect exam metrics.";

      if (profile?.role === 'student' && records) {
        const queryLower = userText.toLowerCase();
        
        // Dynamic stats calculations
        const gpa = records.student?.gpa || 0.0;
        const att = records.attRate;
        const subjectScores = records.marks.reduce((acc: any, mark: any) => {
          const subName = mark.exams?.subject_name;
          const pct = Math.round((Number(mark.marks_obtained) / Number(mark.exams?.max_marks)) * 100);
          if (!acc[subName]) acc[subName] = [];
          acc[subName].push(pct);
          return acc;
        }, {});

        const averages = Object.keys(subjectScores).map(sub => {
          const scores = subjectScores[sub];
          const avg = Math.round(scores.reduce((sum: number, s: number) => sum + s, 0) / scores.length);
          return { subject: sub, average: avg };
        });

        // Find weak and strong subjects
        const sortedAverages = [...averages].sort((a, b) => a.average - b.average);
        const weakSubject = sortedAverages[0];
        const strongSubject = sortedAverages[sortedAverages.length - 1];

        if (queryLower.includes('improve') || queryLower.includes('grade') || queryLower.includes('marks')) {
          if (weakSubject) {
            aiText = `Based on your grade logs, your weakest area is **${weakSubject.subject}** with an average score of **${weakSubject.average}%**. To improve:
1. Schedule a doubt session with your teacher.
2. Review past homework feedbacks in the Assignment Hub.
3. Your attendance is at **${att}%**. Maintain daily check-ins to make sure you do not miss core lessons!`;
          } else {
            aiText = `You do not have any exam marks logged in the system yet. Once your teacher posts midterm or unit exam grades in the Gradebook console, I will isolate your weaknesses and compile customized revision guidelines!`;
          }
        } else if (queryLower.includes('risk') || queryLower.includes('performance') || queryLower.includes('status')) {
          const riskLevel = (att < 80 || gpa < 2.5) ? '🔴 At Risk (High)' : (att < 90 || gpa < 3.2) ? '🟡 Warning (Mid)' : '🟢 Safe (Low)';
          aiText = `My performance prediction algorithms estimate your current risk index as: **${riskLevel}**. 
* **Cumulative GPA**: ${gpa.toFixed(2)}
* **Attendance Rate**: ${att}%
* **Strongest subject**: ${strongSubject ? `${strongSubject.subject} (${strongSubject.average}%)` : 'N/A'}
* **Next quest targets**: Complete your pending assignments to earn +50 EXP points and increase your Level!`;
        } else if (queryLower.includes('gpa') || queryLower.includes('predict') || queryLower.includes('expected')) {
          const predictedGPA = Math.min(4.0, gpa + (att > 95 ? 0.05 : -0.1)).toFixed(2);
          aiText = `Based on your current attendance trend of **${att}%** and marks averages, your expected end-of-term GPA is predicted to be **${predictedGPA}** (current GPA: ${gpa.toFixed(2)}). Keep checking in daily to maximize your academic progress!`;
        } else {
          aiText = `I heard you! For student portfolio insights, you can try asking me:
* "How can I improve my grades?"
* "What is my academic risk status?"
* "Predict my expected GPA"`;
        }
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiText, time: timeString }]);
      setIsTyping(false);
    }, 1500);
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
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-success"></span>
          </span>
          <span className="text-[10px] font-bold text-gray-500 uppercase">Interactive Online</span>
        </div>
      </div>

      {/* Messages Scroll Console */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
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
                {msg.text}
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
          placeholder="Ask AI: 'How can I improve my grades?' or 'Predict my GPA'..."
          className="flex-1 glass-input text-xs"
        />
        <button
          type="submit"
          className="glass-button-primary py-2 px-4 flex items-center justify-center gap-1.5 self-center shadow-[0_0_10px_rgba(139,92,246,0.2)] shrink-0"
        >
          <span>Consult</span>
          <Send size={12} />
        </button>
      </form>
    </div>
  );
};
