import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { GraduationCap, Calendar, CheckSquare, Award, Flame, Zap, AwardIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  // Query student profile and records
  const { data: studentData, isLoading } = useQuery({
    queryKey: ['student-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Student metadata
      const { data: student } = await supabase
        .from('students')
        .select('*, classes(*)')
        .eq('id', user.id)
        .single();

      // 2. Attendance %
      const { data: att } = await supabase
        .from('attendance')
        .select('status')
        .eq('student_id', user.id);

      const totalAtt = att?.length || 0;
      const presentAtt = att?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      // 3. Pending assignments count
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('student_id', user.id);

      const submittedIds = submissions?.map((s: any) => s.assignment_id) || [];

      // Get all assignments for this class
      let pendingAssignments = 0;
      if (student?.class_id) {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id')
          .eq('class_id', student.class_id);

        const classAssIds = assignments?.map((a: any) => a.id) || [];
        pendingAssignments = classAssIds.filter((id: string) => !submittedIds.includes(id)).length;
      }

      // 4. Badges earned
      const { data: badges } = await supabase
        .from('badges')
        .select('*')
        .eq('student_id', user.id);


      return {
        student,
        attendancePct,
        pendingAssignments,
        badges: badges || []
      };
    },
    enabled: !!user
  });

  const getRankBadge = (lvl: number) => {
    if (lvl >= 5) return { label: 'Grandmaster Scholar', icon: Award, color: 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/20' };
    if (lvl >= 3) return { label: 'Scholar Elite', icon: Zap, color: 'text-cyber-secondary bg-cyber-secondary/10 border-cyber-secondary/20' };
    return { label: 'Beginner Learner', icon: Flame, color: 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/20' };
  };

  const levelInfo = studentData?.student ? getRankBadge(studentData.student.level) : null;
  const expProgressPct = studentData?.student ? Math.min(100, Math.round((studentData.student.exp % 100))) : 0;

  const statCards = [
    { label: 'Attendance Percentage', value: `${studentData?.attendancePct || 100}%`, icon: Calendar, color: 'text-cyber-secondary', bg: 'bg-cyber-secondary/10' },
    { label: 'Cumulative GPA', value: studentData?.student?.gpa?.toFixed(2) || '0.00', icon: GraduationCap, color: 'text-cyber-primary', bg: 'bg-cyber-primary/10' },
    { label: 'Pending Assignments', value: studentData?.pendingAssignments || 0, icon: CheckSquare, color: 'text-cyber-warning', bg: 'bg-cyber-warning/10' }
  ];

  // Grade progress charts representation
  const performanceData = [
    { name: 'Unit 1', score: 85 },
    { name: 'Unit 2', score: 90 },
    { name: 'Unit 3', score: 82 },
    { name: 'Midterm', score: 92 },
    { name: 'Assg avg', score: 95 }
  ];

  return (
    <div className="space-y-6">
      {/* Profile summary header */}
      <div className="pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Dashboard</h1>
          <p className="text-gray-400 text-xs mt-0.5">Welcome back, check your scores, badges, and homework targets</p>
        </div>
        
        {/* Gamification Level Box */}
        {studentData?.student && levelInfo && (
          <div className={`flex items-center gap-3 px-4 py-2 border rounded-xl shadow-lg shrink-0 ${levelInfo.color}`}>
            <levelInfo.icon size={20} className="animate-bounce" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider block text-[10px] text-gray-400">Level {studentData.student.level}</span>
              <span className="font-bold text-white block mt-0.5">{levelInfo.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Row: Stats widgets & EXP Level tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats column */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className="glass-card rounded-xl p-5 border border-white/5 shadow-md flex items-center justify-between group"
              >
                <div>
                  <span className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider block">{card.label}</span>
                  <span className="text-2xl font-bold text-white block mt-1 tracking-tight">
                    {isLoading ? '...' : card.value}
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-150`}>
                  <Icon size={20} />
                </div>
              </motion.div>
            );
          })}

          {/* GPA/Score Performance chart */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-xl p-5 border border-white/5 col-span-1 sm:col-span-3"
          >
            <h3 className="font-semibold text-sm text-white mb-4 border-b border-white/5 pb-2">Academic Progression Summary</h3>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} domain={[50, 100]} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#0f101a', border: '1px solid rgba(255,255,255,0.08)' }} />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2.5} name="Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Level XP & Gamified Badges Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card rounded-xl p-5 border border-white/5 flex flex-col justify-between"
        >
          <div>
            <h3 className="font-semibold text-sm text-white mb-3 flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Award size={18} className="text-cyber-accent" />
              <span>Quest Progression</span>
            </h3>

            {/* EXP Bar */}
            <div className="mb-6 bg-white/2 p-3.5 border border-white/5 rounded-xl">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400 font-semibold">EXP Progress</span>
                <span className="text-cyber-secondary font-bold">{studentData?.student?.exp || 0} XP / {(studentData?.student?.level || 1) * 100} XP</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
                  style={{ width: `${expProgressPct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-2 block italic text-center">Earn EXP by logging daily and scoring high grades!</span>
            </div>

            {/* Badge Grid Showcase */}
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2.5">Earned Badges ({studentData?.badges?.length || 0})</span>
              {studentData?.badges && studentData.badges.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {studentData.badges.map((badge: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center justify-center p-2 bg-cyber-primary/10 border border-cyber-primary/20 rounded-lg group relative cursor-pointer"
                      title={`${badge.title}: ${badge.description}`}
                    >
                      <AwardIcon className="text-cyber-accent w-6 h-6 animate-pulse" />
                      <span className="text-[8px] font-bold text-white text-center mt-1 truncate w-full">{badge.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">Complete your first assignment to unlock your first badge!</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <Link to="/ai-assistant" className="glass-button-primary flex items-center justify-center gap-2 text-xs font-semibold py-2.5 w-full">
              <Zap size={14} className="animate-spin" />
              <span>Consult AI Academic Tutor</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
