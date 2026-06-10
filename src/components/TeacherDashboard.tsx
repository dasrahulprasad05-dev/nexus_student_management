import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, ClipboardCheck, Users, Clock, AlertCircle, Edit, Trash, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleList, setScheduleList] = useState<any[]>([]);

  // New period form inputs
  const [newDay, setNewDay] = useState('Monday');
  const [newTime, setNewTime] = useState('09:00 AM - 10:00 AM');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newClassRoom, setNewClassRoom] = useState('Class 10-A / Room 301');

  const updateScheduleMutation = useMutation({
    mutationFn: async (newSchedule: any[]) => {
      const { data, error } = await supabase
        .from('teachers')
        .update({ schedule: newSchedule })
        .eq('id', user?.id)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-dashboard', user?.id] });
      setShowScheduleModal(false);
    }
  });
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
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-cyber-primary" />
              <h3 className="font-semibold text-sm text-white">Weekly Timetable Schedule</h3>
            </div>
            {!isLoading && (
              <button
                onClick={() => {
                  setScheduleList(dashboardData?.schedule || []);
                  setShowScheduleModal(true);
                }}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5 text-xs font-semibold"
                title="Edit Timetable periods"
              >
                <Edit size={14} />
                <span>Edit Timetable</span>
              </button>
            )}
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

      {/* Timetable Edit Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col animate-fade-in"
            >
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2 shrink-0">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Manage Timetable Schedule</h3>
                <button onClick={() => setShowScheduleModal(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Add entry form block */}
              <div className="p-5 border-b border-white/5 bg-white/2 shrink-0 space-y-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Add New Period</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-0.5">Day</label>
                    <select
                      value={newDay}
                      onChange={(e) => setNewDay(e.target.value)}
                      className="w-full glass-input text-xs py-1.5 px-2 bg-[#0d0e16]"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-0.5">Time Interval</label>
                    <input
                      type="text"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      placeholder="e.g. 09:00 AM - 10:00 AM"
                      className="w-full glass-input text-xs py-1.5 px-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-0.5">Subject</label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="e.g. Physics"
                      className="w-full glass-input text-xs py-1.5 px-2"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-400 block mb-0.5">Class / Room</label>
                    <input
                      type="text"
                      value={newClassRoom}
                      onChange={(e) => setNewClassRoom(e.target.value)}
                      placeholder="e.g. Class 10-A / Room 301"
                      className="w-full glass-input text-xs py-1.5 px-2"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!newTime.trim() || !newSubject.trim() || !newClassRoom.trim()) {
                      alert('Please fill out all timetable fields.');
                      return;
                    }
                    setScheduleList(prev => [
                      ...prev,
                      { day: newDay, time: newTime, subject: newSubject, class: newClassRoom }
                    ]);
                  }}
                  className="w-full glass-button-primary py-1.5 flex items-center justify-center gap-1.5 text-xs text-cyber-primary border-cyber-primary/20 bg-transparent hover:bg-cyber-primary/10"
                >
                  <Plus size={12} />
                  <span>Add Period to List</span>
                </button>
              </div>

              {/* Periods list scroll block */}
              <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Periods Queue ({scheduleList.length})</span>
                {scheduleList.length > 0 ? (
                  scheduleList.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-white/2 border border-white/5 rounded-lg text-xs">
                      <div>
                        <span className="font-semibold text-white block">{entry.subject}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{entry.day} • {entry.time} • {entry.class}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScheduleList(prev => prev.filter((_, idx) => idx !== index));
                        }}
                        className="p-1 text-cyber-danger hover:bg-cyber-danger/10 border border-transparent rounded hover:border-cyber-danger/10"
                        title="Remove Period"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-gray-500 py-6">No timetable periods added to queue.</p>
                )}
              </div>

              {/* Save block */}
              <div className="p-5 border-t border-white/5 bg-white/2 shrink-0">
                <button
                  onClick={() => updateScheduleMutation.mutate(scheduleList)}
                  disabled={updateScheduleMutation.isPending}
                  className="w-full glass-button-primary py-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold"
                >
                  {updateScheduleMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Timetable Changes</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
