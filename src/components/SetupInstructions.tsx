import React from 'react';
import { Database, AlertTriangle, Terminal, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const SetupInstructions: React.FC = () => {
  return (
    <div className="min-h-screen bg-cyber-bg flex items-center justify-center p-6 text-gray-200">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyber-primary/10 via-cyber-bg to-cyber-bg pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl glass-card rounded-2xl p-8 relative overflow-hidden shadow-2xl border-cyber-primary/20"
      >
        {/* Glow Header */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyber-primary via-cyber-secondary to-cyber-primary" />
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-cyber-primary/10 text-cyber-primary rounded-xl border border-cyber-primary/25 shadow-[0_0_15px_rgba(139,92,246,0.15)] animate-pulse">
            <Database size={32} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyber-secondary">Database Setup Required</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-none mt-1">
              Configure Supabase Connection
            </h1>
          </div>
        </div>

        <p className="text-gray-400 mb-8 leading-relaxed">
          Welcome to the <strong className="text-white">Nexus Smart Student Management System</strong>! 
          As selected, this build runs strictly in <strong className="text-cyber-secondary">Supabase Direct Mode</strong>. 
          Follow these simple steps to hook up your database and load the dashboard.
        </p>

        <div className="space-y-6">
          {/* Step 1 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Create Database Schema in Supabase
              </h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Open your project in the <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyber-secondary hover:underline">Supabase Console</a>, navigate to the <strong>SQL Editor</strong>, click <strong>New Query</strong>, paste the content of the schema migration file, and click <strong>Run</strong>:
              </p>
              <div className="mt-3 flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-cyber-secondary">
                <Terminal size={14} className="text-gray-400" />
                <span>supabase/migration.sql</span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-white">
                Seed Test Accounts (Recommended)
              </h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                To explore all role-based portals (Admin, Teacher, Student, Parent) with rich portfolios and charts, open a new SQL editor query window, paste the contents of the seeding script, and click <strong>Run</strong>:
              </p>
              <div className="mt-3 flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-lg text-xs font-mono text-cyber-secondary">
                <Terminal size={14} className="text-gray-400" />
                <span>supabase/seed.sql</span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30 font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-white flex items-center gap-2">
                Update Environment Variables
              </h3>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                Open the <code className="text-cyber-secondary bg-white/5 px-1.5 py-0.5 rounded text-xs">.env</code> file in your workspace, and replace the placeholder values with your actual Supabase API keys:
              </p>
              <div className="mt-3 bg-[#0a0b13] border border-white/10 rounded-lg p-4 font-mono text-xs text-gray-300 space-y-1 relative">
                <div className="absolute right-3 top-3 text-[10px] uppercase font-semibold text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                  .env
                </div>
                <div className="text-cyber-primary">VITE_SUPABASE_URL=<span className="text-gray-300">https://your-project-id.supabase.co</span></div>
                <div className="text-cyber-primary">VITE_SUPABASE_ANON_KEY=<span className="text-gray-300">eyJh...your-anon-key</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-cyber-warning bg-cyber-warning/10 border border-cyber-warning/20 px-3.5 py-2 rounded-lg">
            <AlertTriangle size={16} />
            <span>Currently showing this setup screen because credentials in `.env` are blank.</span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="glass-button-primary flex items-center justify-center gap-2 self-end sm:self-auto text-sm shrink-0"
          >
            <span>I've Configured It</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
