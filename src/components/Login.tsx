import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Key, Mail, ShieldAlert, GraduationCap, Users, User, Shield, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'student' | 'parent'>('admin');

  const rolePresets = {
    admin: { email: 'admin@nexus.edu', pass: 'admin123', label: 'Admin', icon: Shield },
    teacher: { email: 'teacher.sarah@nexus.edu', pass: 'teacher123', label: 'Teacher', icon: Users },
    student: { email: 'student.john@nexus.edu', pass: 'student123', label: 'Student', icon: GraduationCap },
    parent: { email: 'parent@nexus.edu', pass: 'parent123', label: 'Parent', icon: User }
  };

  const handleRoleSelect = (role: 'admin' | 'teacher' | 'student' | 'parent') => {
    setSelectedRole(role);
    setEmail(rolePresets[role].email);
    setPassword(rolePresets[role].pass);
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError(authError.message);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyber-primary/10 via-cyber-bg to-cyber-bg pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg glass-card rounded-2xl p-8 shadow-2xl relative border-cyber-primary/15"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-primary" />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight glow-text-purple">NEXUS PORTAL</h1>
          <p className="text-gray-400 text-sm mt-1">Smart Student Management System</p>
        </div>

        {/* Role Presets Selector */}
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider text-cyber-secondary block mb-3 text-center">
            Quick Select Test Credentials
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {(Object.keys(rolePresets) as Array<keyof typeof rolePresets>).map((role) => {
              const RoleIcon = rolePresets[role].icon;
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 ${
                    isSelected 
                      ? 'bg-cyber-primary/20 border-cyber-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.25)]' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <RoleIcon size={18} className="mb-1" />
                  <span className="text-[10px] font-bold tracking-wide uppercase">{rolePresets[role].label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-start gap-2.5 p-3.5 bg-cyber-danger/10 border border-cyber-danger/20 text-cyber-danger rounded-lg text-xs leading-relaxed"
          >
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nexus.edu"
                className="w-full glass-input pl-10"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')} 
                className="text-[10px] text-cyber-secondary font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button-primary flex items-center justify-center gap-2 mt-6 text-sm py-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Secure Log In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
