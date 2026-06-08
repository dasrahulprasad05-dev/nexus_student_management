import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, CalendarCheck, BookOpen, 
  FileText, CreditCard, ClipboardList, Bot, ChevronLeft, ChevronRight, GraduationCap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  theme: 'dark' | 'light';
  role: 'admin' | 'teacher' | 'student' | 'parent';
  location: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, theme, role, location }) => {


  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/students', label: 'Student Directory', icon: Users },
          { path: '/attendance', label: 'Attendance System', icon: CalendarCheck },
          { path: '/gradebook', label: 'Gradebook Console', icon: BookOpen },
          { path: '/finance', label: 'Fees & Finance', icon: CreditCard },
          { path: '/notices', label: 'Notice Board', icon: ClipboardList },
          { path: '/ai-assistant', label: 'AI Insights Assistant', icon: Bot },
        ];
      case 'teacher':
        return [
          { path: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/students', label: 'My Students', icon: Users },
          { path: '/attendance', label: 'Mark Attendance', icon: CalendarCheck },
          { path: '/gradebook', label: 'Grade Book', icon: BookOpen },
          { path: '/notices', label: 'Notice Board', icon: ClipboardList },
        ];
      case 'student':
        return [
          { path: '/student', label: 'Personal Dashboard', icon: LayoutDashboard },
          { path: '/assignments', label: 'Assignments Hub', icon: FileText },
          { path: '/notices', label: 'School Notices', icon: ClipboardList },
          { path: '/ai-assistant', label: 'AI Academic Assistant', icon: Bot },
        ];
      case 'parent':
        return [
          { path: '/parent', label: 'Child Dashboard', icon: LayoutDashboard },
          { path: '/attendance', label: 'Attendance Tracking', icon: CalendarCheck },
          { path: '/gradebook', label: 'Report Card', icon: BookOpen },
          { path: '/notices', label: 'School Bulletins', icon: ClipboardList },
        ];
      default:
        return [];
    }
  };

  const navLinks = getLinks();

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`hidden sm:flex flex-col h-full border-r relative shrink-0 z-30 select-none ${
        theme === 'dark' 
          ? 'bg-[#0a0b12]/80 border-white/5 backdrop-blur-xl' 
          : 'bg-white border-gray-200/80 shadow-sm'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-white/5 shrink-0">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-lg text-white">
            <GraduationCap size={20} />
          </div>
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="font-bold text-base tracking-tight text-white uppercase glow-text-purple shrink-0"
            >
              NEXUS
            </motion.span>
          )}
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`p-1.5 rounded-lg border text-gray-400 hover:text-white transition-all duration-150 ${
            theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3.5 px-3 py-3 rounded-lg font-medium text-sm transition-all duration-150 relative ${
                isActive 
                  ? 'text-white bg-cyber-primary/10 border border-cyber-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.08)]' 
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-white border border-transparent hover:bg-white/5' 
                    : 'text-gray-600 hover:text-gray-900 border border-transparent hover:bg-gray-100'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-cyber-secondary' : ''} />
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="truncate"
                >
                  {link.label}
                </motion.span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Role Footer */}
      <div className="p-4 border-t border-white/5 bg-white/2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyber-secondary/10 flex items-center justify-center text-cyber-secondary border border-cyber-secondary/20">
            <span className="font-bold text-xs uppercase">{role[0]}</span>
          </div>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col text-xs"
            >
              <span className="font-semibold text-white truncate">Nexus User</span>
              <span className="text-gray-500 capitalize">{role} Account</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
