import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Sun, Moon, Bell, LogOut, Edit, X } from 'lucide-react';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';


interface HeaderProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  profile: Profile | null;
  setShowPalette: (open: boolean) => void;
  notifications: Array<{ id: string; text: string; read: boolean }>;
  setNotifications: React.Dispatch<React.SetStateAction<Array<{ id: string; text: string; read: boolean }>>>;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  logout: () => Promise<void>;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  toggleTheme,
  sidebarOpen,
  setSidebarOpen,
  profile,
  setShowPalette,
  notifications,
  setNotifications,
  showNotifications,
  setShowNotifications,
  logout
}) => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  // Profile settings states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editExperience, setEditExperience] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setUpdatingProfile(true);

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          avatar_url: editAvatarUrl || null
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      if (profile.role === 'teacher') {
        const { error: teacherError } = await supabase
          .from('teachers')
          .update({
            qualification: editQualification,
            experience: editExperience
          })
          .eq('id', profile.id);
        if (teacherError) throw teacherError;
      }

      await refreshProfile();
      setShowProfileModal(false);
    } catch (err: any) {
      alert(`Failed to update profile: ${err.message}`);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleLogoutClick = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className={`h-16 flex items-center justify-between px-6 border-b shrink-0 z-20 ${
      theme === 'dark' ? 'bg-[#0a0b12]/80 border-white/5 backdrop-blur-xl' : 'bg-white border-gray-200 shadow-sm'
    }`}>
      {/* Menu / Search Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`sm:hidden p-2 rounded-lg border text-gray-400 hover:text-white ${
            theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <Menu size={18} />
        </button>

        {/* Global Search box triggering Ctrl+K Palette */}
        <button
          onClick={() => setShowPalette(true)}
          className={`hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg border text-sm font-medium text-gray-400 transition-all duration-150 text-left w-64 ${
            theme === 'dark' 
              ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:text-gray-300' 
              : 'bg-gray-100 border-gray-200 hover:bg-gray-200/80 hover:text-gray-600'
          }`}
        >
          <Search size={15} />
          <span className="flex-1">Search portal...</span>
          <span className="text-[10px] bg-white/10 text-gray-400 border border-white/10 px-1.5 py-0.5 rounded">Ctrl+K</span>
        </button>
      </div>

      {/* Action Settings Panel */}
      <div className="flex items-center gap-3">
        {/* Theme Toggler */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg border text-gray-400 hover:text-white transition-colors duration-150 ${
            theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
          }`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} className="text-gray-600 hover:text-gray-900" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg border text-gray-400 hover:text-white transition-colors duration-150 relative ${
              theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Bell size={17} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyber-danger text-[9px] font-bold text-white shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={`absolute right-0 mt-2.5 w-80 rounded-xl border p-4 shadow-2xl z-50 ${
              theme === 'dark' ? 'bg-[#11121c] border-white/5 text-gray-300' : 'bg-white border-gray-200 text-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-white/5">
                <span className="font-semibold text-xs text-white uppercase tracking-wider">Alert Center</span>
                {notifications.length > 0 && (
                  <button onClick={handleClearNotifications} className="text-[10px] text-cyber-secondary font-medium hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              {notifications.length > 0 ? (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={`w-full text-left text-xs p-2 rounded-lg border text-gray-400 hover:text-white transition-colors duration-150 ${
                        notif.read 
                          ? 'bg-transparent border-transparent' 
                          : 'bg-cyber-primary/5 border-cyber-primary/10 text-white'
                      }`}
                    >
                      {notif.text}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-gray-500 py-6">No recent alerts found.</p>
              )}
            </div>
          )}
        </div>

        {/* User Card */}
        {profile && (
          <div className="flex items-center gap-3.5 pl-2 border-l border-white/5">
            <button
              onClick={() => {
                setEditFullName(profile.full_name);
                setEditAvatarUrl(profile.avatar_url || '');
                setShowProfileModal(true);
                if (profile.role === 'teacher') {
                  supabase.from('teachers').select('*').eq('id', profile.id).single().then(({ data }: any) => {
                    if (data) {
                      setEditQualification(data.qualification || '');
                      setEditExperience(data.experience || '');
                    }
                  });
                }
              }}
              className="hidden lg:flex flex-col text-right text-xs hover:opacity-80 transition cursor-pointer select-none text-left border-0 bg-transparent p-0"
              title="Edit Profile Settings"
            >
              <span className="font-semibold text-white truncate max-w-[120px] flex items-center gap-1">
                <span>{profile.full_name}</span>
                <Edit size={10} className="text-gray-500 hover:text-white" />
              </span>
              <span className="text-[10px] text-cyber-secondary font-medium tracking-wide uppercase">{profile.role}</span>
            </button>
            
            {/* Logout Trigger */}
            <button
              onClick={handleLogoutClick}
              className={`p-2 rounded-lg border text-cyber-danger border-cyber-danger/10 bg-cyber-danger/5 hover:bg-cyber-danger/15 hover:text-cyber-danger active:scale-95 transition-all duration-150`}
              title="Logout session"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative text-left">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2">
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">Profile Settings</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="text"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full glass-input text-xs"
                />
              </div>

              {profile.role === 'teacher' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Qualifications</label>
                    <input
                      type="text"
                      value={editQualification}
                      onChange={(e) => setEditQualification(e.target.value)}
                      placeholder="e.g. Master of Education"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Experience</label>
                    <input
                      type="text"
                      value={editExperience}
                      onChange={(e) => setEditExperience(e.target.value)}
                      placeholder="e.g. 5+ Years teaching"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 mt-6 font-semibold"
              >
                {updatingProfile ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Save Profile Updates</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
