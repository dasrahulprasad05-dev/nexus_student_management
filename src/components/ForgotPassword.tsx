import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Error executing request.');
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
        className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl relative border-cyber-primary/15"
      >
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-primary" />

        <div className="mb-6">
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-cyber-secondary hover:text-white transition-colors duration-150"
          >
            <ArrowLeft size={14} />
            <span>Back to Login</span>
          </button>
        </div>

        {!sent ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">Forgot Password</h1>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Enter your account email address below, and we will dispatch a secure link to reset your password.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-cyber-danger/10 border border-cyber-danger/20 text-cyber-danger rounded-lg text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full glass-button-primary flex items-center justify-center gap-2 mt-4 text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="flex justify-center mb-4 text-cyber-success">
              <div className="p-3 bg-cyber-success/10 rounded-full border border-cyber-success/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <CheckCircle size={36} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Instructions Sent</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              A recovery link has been sent to <strong className="text-white">{email}</strong>. 
              Please click the link in your email inbox to update your password credentials.
            </p>
            <button 
              onClick={() => navigate('/login')} 
              className="glass-button-secondary w-full"
            >
              Return to Sign In
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
