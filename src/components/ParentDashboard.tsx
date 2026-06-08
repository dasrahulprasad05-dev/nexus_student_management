import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';


export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // 1. Fetch kids linked to this parent profile
  const { data: kids, isLoading: kidsLoading } = useQuery({
    queryKey: ['parent-kids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('students')
        .select('*, profiles(*)')
        .eq('parent_id', user.id);

      if (data && data.length > 0) {
        setSelectedChildId(data[0].id);
      }
      return data || [];
    },
    enabled: !!user
  });

  // 2. Fetch selected child's stats (GPA, attendance, marks)
  const { data: childData, isLoading: childLoading } = useQuery({
    queryKey: ['child-data', selectedChildId],
    queryFn: async () => {
      if (!selectedChildId) return null;

      // Student and Class details
      const { data: student } = await supabase
        .from('students')
        .select('*, profiles(*), classes(*)')
        .eq('id', selectedChildId)
        .single();

      // Attendance history
      const { data: att } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedChildId)
        .order('date', { ascending: false });

      const totalAtt = att?.length || 0;
      const presentCount = att?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const attendanceRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 100;

      // Recent marks obtained
      const { data: marks } = await supabase
        .from('marks')
        .select('*, exams(*)')
        .eq('student_id', selectedChildId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        student,
        attendanceRate,
        attendanceLogs: att || [],
        marks: marks || []
      };
    },
    enabled: !!selectedChildId
  });

  return (
    <div className="space-y-6">
      {/* Selection card */}
      <div className="pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Parent Portal</h1>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">Monitor your child's learning progression and attendance rates</p>
        </div>

        {kids && kids.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold">Select Child:</span>
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="glass-input text-xs py-1.5 px-3 focus:ring-0 focus:border-cyber-primary"
            >
              {kids.map((kid: any) => (
                <option key={kid.id} value={kid.id} className="bg-[#12131f] text-white">
                  {kid.profiles?.full_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {kidsLoading ? (
        <p className="text-xs text-gray-500 text-center py-12 animate-pulse">Syncing child profile registers...</p>
      ) : kids && kids.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center border-cyber-warning/30 max-w-md mx-auto">
          <AlertCircle size={32} className="mx-auto text-cyber-warning mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Child Accounts Linked</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Your parent profile is currently not connected to any student rolls. 
            Please ask the administrative office to associate your email with your child's student profile record.
          </p>
        </div>
      ) : childLoading ? (
        <p className="text-xs text-gray-500 text-center py-12 animate-pulse">Loading child performance audits...</p>
      ) : childData ? (
        <div className="space-y-6">
          {/* Child Metadata Overview */}
          <div className="glass-card rounded-xl p-5 border border-cyber-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-cyber-primary/5 via-transparent to-transparent">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cyber-primary/15 flex items-center justify-center text-cyber-primary font-bold text-lg border border-cyber-primary/25 shadow-md">
                {childData.student?.profiles?.full_name?.[0]}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{childData.student?.profiles?.full_name}</h2>
                <div className="flex items-center gap-2.5 text-xs text-gray-400 mt-1">
                  <span>Class: <strong className="text-white">{childData.student?.classes?.grade_name}-{childData.student?.classes?.section}</strong></span>
                  <span>•</span>
                  <span>ID: <strong className="text-cyber-secondary font-mono">{childData.student?.student_id}</strong></span>
                  <span>•</span>
                  <span>Roll: <strong className="text-white">{childData.student?.roll_number}</strong></span>
                </div>
              </div>
            </div>
            
            {/* Quick stats widgets */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Attendance Rate</span>
                <span className={`text-xl font-bold block mt-0.5 ${childData.attendanceRate >= 90 ? 'text-cyber-success' : 'text-cyber-warning'}`}>
                  {childData.attendanceRate}%
                </span>
              </div>
              <div className="text-right border-l border-white/5 pl-6">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">Academic GPA</span>
                <span className="text-xl font-bold text-cyber-primary block mt-0.5">
                  {childData.student?.gpa?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Marks */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <BookOpen size={18} className="text-cyber-primary" />
                <h3 className="font-semibold text-sm text-white">Recent Exam Scores</h3>
              </div>
              
              <div className="space-y-3">
                {childData.marks && childData.marks.length > 0 ? (
                  childData.marks.map((mark: any) => (
                    <div key={mark.id} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5 hover:border-cyber-primary/10 transition-colors">
                      <div>
                        <span className="font-semibold text-xs text-white block">{mark.exams?.title}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Subject: {mark.exams?.subject_name} ({mark.exams?.exam_type})</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-cyber-secondary block">{mark.marks_obtained} / {mark.exams?.max_marks}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">
                          Score: {Math.round((Number(mark.marks_obtained) / Number(mark.exams?.max_marks)) * 100)}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8">No exam marks entered for this child yet.</p>
                )}
              </div>
            </motion.div>

            {/* Recent Attendance logs */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-xl p-5 border border-white/5"
            >
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                <Calendar size={18} className="text-cyber-secondary" />
                <h3 className="font-semibold text-sm text-white">Attendance Logs</h3>
              </div>

              <div className="space-y-2.5">
                {childData.attendanceLogs && childData.attendanceLogs.length > 0 ? (
                  childData.attendanceLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
                      <div>
                        <span className="font-semibold text-xs text-white block">
                          {new Date(log.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5">Method: {log.method === 'qr' ? 'QR Code Scan' : 'Teacher Manual'}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'present' 
                          ? 'bg-cyber-success/15 border border-cyber-success/25 text-cyber-success' 
                          : log.status === 'late' 
                            ? 'bg-cyber-warning/15 border border-cyber-warning/25 text-cyber-warning' 
                            : 'bg-cyber-danger/15 border border-cyber-danger/25 text-cyber-danger'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-8">No daily attendance logs registered.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
