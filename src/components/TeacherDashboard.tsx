import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, ClipboardCheck, Users, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();

  // Query teacher schedule and stats
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['teacher-dashboard', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Fetch teacher details
      const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      // Fetch student count
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      // Fetch ungraded submissions count
      const { data: assignments } = await supabase
        .from('assignments')
        .select('id')
        .eq('created_by', user.id);

      const assignmentIds = assignments?.map((a: any) => a.id) || [];

      
      let pendingGrades = 0;
      if (assignmentIds.length > 0) {
        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('assignment_id', assignmentIds)
          .eq('status', 'submitted');
        pendingGrades = count || 0;
      }

      // Timetable
      const schedule = teacher?.schedule || [];

      return {
        studentCount: studentCount || 0,
        pendingGrades,
        schedule
      };
    },
    enabled: !!user
  });

  const statCards = [
    { label: 'Total Students', value: dashboardData?.studentCount, icon: Users, color: 'text-cyber-secondary', bg: 'bg-cyber-secondary/10' },
    { label: "Today's periods", value: dashboardData?.schedule?.length || 0, icon: Clock, color: 'text-cyber-primary', bg: 'bg-cyber-primary/10' },
    { label: 'Pending Gradings', value: dashboardData?.pendingGrades || 0, icon: ClipboardCheck, color: 'text-cyber-warning', bg: 'bg-cyber-warning/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="pb-2 border-b border-white/5">
        <h1 className="text-2xl font-bold text-white tracking-tight">Teacher Console</h1>
        <p className="text-gray-400 text-xs mt-0.5">Manage classes, grade homeworks, and review timetables</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      {/* Timetable Grid & Notice Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Timetable */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card rounded-xl p-5 border border-white/5 col-span-1 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <Calendar size={18} className="text-cyber-primary" />
            <h3 className="font-semibold text-sm text-white">Weekly Timetable Schedule</h3>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <p className="text-xs text-gray-500 text-center py-8">Loading timetable...</p>
            ) : dashboardData?.schedule && dashboardData.schedule.length > 0 ? (
              <table className="w-full text-left text-xs text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                    <th className="py-2.5">Day</th>
                    <th className="py-2.5">Time</th>
                    <th className="py-2.5">Subject</th>
                    <th className="py-2.5">Class / Room</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.schedule.map((entry: any, index: number) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/2">
                      <td className="py-2.5 text-white font-medium">{entry.day}</td>
                      <td className="py-2.5 text-cyber-secondary flex items-center gap-1">
                        <Clock size={12} />
                        <span>{entry.time}</span>
                      </td>
                      <td className="py-2.5 font-semibold">{entry.subject}</td>
                      <td className="py-2.5 text-gray-300">{entry.class}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                <BookOpen size={24} className="mb-2 text-gray-600" />
                <p className="text-xs">No teaching periods allocated in schedule database.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Rapid Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-5 border border-white/5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <AlertCircle size={18} className="text-cyber-warning" />
              <h3 className="font-semibold text-sm text-white">Quick Tasks</h3>
            </div>
            
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-xs text-gray-400 p-2.5 rounded-lg bg-white/2 border border-white/5 hover:border-cyber-primary/20 transition-all">
                <div className="w-1.5 h-1.5 bg-cyber-primary rounded-full mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-white">Mark Attendance Today</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Class 10-A attendance sheet is pending.</p>
                </div>
              </li>
              <li className="flex items-start gap-2 text-xs text-gray-400 p-2.5 rounded-lg bg-white/2 border border-white/5 hover:border-cyber-warning/20 transition-all">
                <div className="w-1.5 h-1.5 bg-cyber-warning rounded-full mt-1.5 shrink-0" />
                <div>
                  <span className="font-semibold text-white">Grade Submissions</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Physics Unit Test 1 submissions require grading.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-6">
            <div className="text-[10px] uppercase font-bold text-gray-500 mb-2">Shortcuts</div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
              <Link to="/attendance" className="p-2.5 bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-secondary rounded-lg hover:bg-cyber-primary/20 transition-all">
                Mark Attendance
              </Link>
              <Link to="/gradebook" className="p-2.5 bg-cyber-primary/10 border border-cyber-primary/20 text-cyber-secondary rounded-lg hover:bg-cyber-primary/20 transition-all">
                Update Grades
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
