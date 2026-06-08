import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Calendar, Megaphone, TreeDeciduous } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NoticeBoard: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [showAddNotice, setShowAddNotice] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'announcement' | 'event' | 'holiday'>('announcement');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch notices
  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notices')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  // Mutation to insert notice
  const createNoticeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .insert({
          title: newTitle,
          content: newContent,
          notice_type: newType,
          created_by: profile?.id
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notices-list'] });
      setShowAddNotice(false);
      setNewTitle('');
      setNewContent('');
      setNewType('announcement');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error publishing notice.');
    }
  });

  const handleNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newTitle || !newContent) {
      setFormError('Please fill in all notice fields.');
      return;
    }
    createNoticeMutation.mutate();
  };

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'event':
        return { icon: Calendar, color: 'text-cyber-secondary bg-cyber-secondary/10 border-cyber-secondary/20' };
      case 'holiday':
        return { icon: TreeDeciduous, color: 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/20' };
      default:
        return { icon: Megaphone, color: 'text-cyber-primary bg-cyber-primary/10 border-cyber-primary/20' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notice Board</h1>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">Review announcements, dynamic events, and calendar holidays</p>
        </div>

        {(profile?.role === 'admin' || profile?.role === 'teacher') && (
          <button
            onClick={() => setShowAddNotice(true)}
            className="glass-button-primary flex items-center justify-center gap-2 text-xs py-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <Plus size={16} />
            <span>Post New Announcement</span>
          </button>
        )}
      </div>

      {/* Notices Feed Grid */}
      {isLoading ? (
        <p className="text-xs text-gray-500 text-center py-12 animate-pulse">Loading bulletins...</p>
      ) : notices && notices.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-12">No notices published on the board yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notices.map((notice: any, index: number) => {
            const visual = getNoticeIcon(notice.notice_type);
            const NoticeIcon = visual.icon;
            return (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="glass-card rounded-xl p-5 border border-white/5 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${visual.color}`}>
                      <NoticeIcon size={12} />
                      <span>{notice.notice_type}</span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug">{notice.title}</h3>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{notice.content}</p>
                </div>
                
                <div className="flex justify-between items-center mt-6 pt-3 border-t border-white/5 text-[9px] text-gray-500">
                  <span>Author: {notice.profiles?.full_name || 'School Board'}</span>
                  <span>Nexus Bulletin</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Announcement Modal */}
      <AnimatePresence>
        {showAddNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Post Bulletin Announcement</h3>
                <button onClick={() => setShowAddNotice(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="m-4 p-3 bg-cyber-danger/10 border border-cyber-danger/20 text-cyber-danger rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <form onSubmit={handleNoticeSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Science Hackathon Registrations Open"
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Content Details</label>
                  <textarea
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Enter announcement text parameters..."
                    rows={4}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Notice Category</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full glass-input text-xs bg-[#0d0e16]"
                  >
                    <option value="announcement">Announcement / General</option>
                    <option value="event">Event / Activity</option>
                    <option value="holiday">Holiday / Closure</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={createNoticeMutation.isPending}
                  className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 mt-6 font-semibold"
                >
                  {createNoticeMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Post Announcement</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
