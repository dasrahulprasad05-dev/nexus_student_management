import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, CalendarCheck, BookOpen, 
  FileText, CreditCard, ClipboardList, Bot 
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';

export const Layout: React.FC = () => {
  const { profile, logout } = useAuth();
  const location = useLocation();

  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showPalette, setShowPalette] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, text: string, read: boolean}>>([
    { id: '1', text: '🔔 Math Midterm results published', read: false },
    { id: '2', text: '🔔 Chemistry homework deadline tomorrow', read: false },
    { id: '3', text: '🔔 Term tuition invoice is pending', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync theme to document element
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Listen for Ctrl+K command shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#07080f] text-gray-200' : 'bg-[#f4f5f8] text-gray-800'}`}>
      {/* Background gradients */}
      {theme === 'dark' ? (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyber-primary/5 via-transparent to-transparent pointer-events-none z-0" />
      ) : (
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.03))] from-cyber-primary/5 via-transparent to-transparent pointer-events-none z-0" />
      )}

      <div className="flex h-screen overflow-hidden relative z-10">
        {/* Sidebar for Desktop & Tablets */}
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          theme={theme} 
          role={profile?.role || 'student'} 
          location={location.pathname}
        />

        {/* Core Layout container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header 
            theme={theme}
            toggleTheme={toggleTheme}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            profile={profile}
            setShowPalette={setShowPalette}
            notifications={notifications}
            setNotifications={setNotifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            logout={logout}
          />

          {/* Core Page Content */}
          <main className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth">
            <Outlet />
          </main>

          {/* Bottom Bar Navigation for Mobile screens */}
          <MobileBottomNav role={profile?.role || 'student'} location={location.pathname} />
        </div>
      </div>

      {/* Ctrl+K Search Palette */}
      <AnimatePresence>
        {showPalette && (
          <CommandPalette 
            isOpen={showPalette} 
            onClose={() => setShowPalette(false)} 
            role={profile?.role || 'student'} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-component: Mobile Bottom Nav
const MobileBottomNav: React.FC<{ role: string; location: string }> = ({ role, location }) => {
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { path: '/admin', label: 'Dash', icon: LayoutDashboard },
          { path: '/students', label: 'Students', icon: Users },
          { path: '/attendance', label: 'Attd', icon: CalendarCheck },
          { path: '/gradebook', label: 'Grades', icon: BookOpen },
          { path: '/finance', label: 'Fees', icon: CreditCard }
        ];
      case 'teacher':
        return [
          { path: '/teacher', label: 'Dash', icon: LayoutDashboard },
          { path: '/students', label: 'Students', icon: Users },
          { path: '/attendance', label: 'Attd', icon: CalendarCheck },
          { path: '/gradebook', label: 'Grades', icon: BookOpen },
          { path: '/notices', label: 'Notices', icon: ClipboardList }
        ];
      case 'student':
        return [
          { path: '/student', label: 'Dash', icon: LayoutDashboard },
          { path: '/assignments', label: 'Works', icon: FileText },
          { path: '/notices', label: 'Notices', icon: ClipboardList },
          { path: '/ai-assistant', label: 'AI Help', icon: Bot }
        ];
      case 'parent':
        return [
          { path: '/parent', label: 'Dash', icon: LayoutDashboard },
          { path: '/attendance', label: 'Attd', icon: CalendarCheck },
          { path: '/gradebook', label: 'Grades', icon: BookOpen },
          { path: '/notices', label: 'Notices', icon: ClipboardList }
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <div className="sm:hidden glass-card border-t border-white/5 fixed bottom-0 left-0 w-full h-16 flex items-center justify-around px-2 py-1 z-40 bg-[#0c0d15]/90 backdrop-blur-xl">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-lg transition-all duration-150 ${
              isActive ? 'text-cyber-primary' : 'text-gray-400'
            }`}
          >
            <Icon size={18} />
            <span className="text-[9px] font-medium tracking-wide mt-1">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
