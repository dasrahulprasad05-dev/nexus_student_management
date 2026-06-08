import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Compass, Users, Sparkles, LogOut, CornerDownLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';


interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, role }) => {
  const navigate = useNavigate();
  if (!isOpen) return null;
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Array<{ id: string; full_name: string; roll_number: string; student_id: string }>>([]);
  const [filteredCommands, setFilteredCommands] = useState<any[]>([]);

  // List of core command actions
  const systemCommands = [
    { label: 'Go to Dashboard', shortcut: 'G D', action: () => navigate(`/${role}`), icon: Compass, roles: ['admin', 'teacher', 'student', 'parent'] },
    { label: 'View Student Directory', shortcut: 'G S', action: () => navigate('/students'), icon: Users, roles: ['admin', 'teacher'] },
    { label: 'Open Attendance Register', shortcut: 'G A', action: () => navigate('/attendance'), icon: Compass, roles: ['admin', 'teacher', 'parent'] },
    { label: 'Open Gradebook Console', shortcut: 'G G', action: () => navigate('/gradebook'), icon: Compass, roles: ['admin', 'teacher', 'parent'] },
    { label: 'Launch AI Academic Assistant', shortcut: 'G AI', action: () => navigate('/ai-assistant'), icon: Sparkles, roles: ['admin', 'student'] },
    { label: 'Log Out Session', shortcut: 'Q L', action: () => supabase.auth.signOut().then(() => navigate('/login')), icon: LogOut, roles: ['admin', 'teacher', 'student', 'parent'] }
  ];

  // Fetch student listings to support typing search
  useEffect(() => {
    if (role === 'admin' || role === 'teacher') {
      supabase
        .from('profiles')
        .select('id, full_name, role, students(student_id, roll_number)')
        .eq('role', 'student')
        .then(({ data }: any) => {
          if (data) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              full_name: item.full_name,
              student_id: item.students?.student_id || '',
              roll_number: item.students?.roll_number || ''
            }));
            setStudents(mapped);
          }
        });
    }
  }, [role]);

  // Filter commands and students based on user query
  useEffect(() => {
    const searchLower = query.toLowerCase();
    
    // Filter system shortcuts
    const matchingCommands = systemCommands
      .filter(cmd => cmd.roles.includes(role))
      .filter(cmd => cmd.label.toLowerCase().includes(searchLower))
      .map(cmd => ({ ...cmd, type: 'command' }));

    // Filter students
    const matchingStudents = (role === 'admin' || role === 'teacher')
      ? students
          .filter(stu => stu.full_name.toLowerCase().includes(searchLower) || stu.student_id.toLowerCase().includes(searchLower))
          .map(stu => ({
            label: `Student: ${stu.full_name} (${stu.student_id})`,
            shortcut: `Roll: ${stu.roll_number}`,
            action: () => {
              navigate('/students', { state: { selectedStudentId: stu.id } });
            },
            icon: Users,
            type: 'student'
          }))
      : [];

    setFilteredCommands([...matchingCommands, ...matchingStudents]);
  }, [query, students, role]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-[#05060b]/75 backdrop-blur-md">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl bg-[#0c0d16]/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-white/2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a page command or search student name..."
            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder-gray-500"
          />
          <button onClick={onClose} className="text-[10px] text-gray-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded uppercase hover:text-white">
            Esc
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2.5 space-y-1">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-xs text-gray-400 hover:text-white hover:bg-cyber-primary/10 hover:border-cyber-primary/10 border border-transparent transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={15} className="text-gray-400 group-hover:text-cyber-secondary" />
                    <span className="font-medium">{cmd.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 border border-white/5 text-gray-400 group-hover:text-cyber-primary px-2 py-0.5 rounded-md font-semibold tracking-wider font-mono">
                      {cmd.shortcut}
                    </span>
                    <CornerDownLeft size={12} className="opacity-0 group-hover:opacity-100 text-cyber-secondary transition-opacity duration-150" />
                  </div>
                </button>
              );
            })
          ) : (
            <p className="text-center text-xs text-gray-500 py-8">No matching commands or students found.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
