import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { Users, GraduationCap, DollarSign, Activity, Bell, FileSpreadsheet, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  // Query totals metrics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      const { count: teacherCount } = await supabase.from('teachers').select('*', { count: 'exact', head: true });
      
      const { data: feesData } = await supabase.from('fees').select('amount, status');
      const revenue = feesData?.filter((f: any) => f.status === 'paid').reduce((sum: number, f: any) => sum + Number(f.amount), 0) || 0;
      
      const { data: attData } = await supabase.from('attendance').select('status');
      const presentCount = attData?.filter((a: any) => a.status === 'present').length || 0;
      const totalAtt = attData?.length || 1;
      const attendanceRate = Math.round((presentCount / totalAtt) * 100);

      return { studentCount: studentCount || 0, teacherCount: teacherCount || 0, revenue, attendanceRate };
    }
  });

  // Query audit logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    }
  });

  // Mock chart data representing system trends
  const chartsData = {
    attendance: [
      { name: 'Mon', rate: 94 },
      { name: 'Tue', rate: 96 },
      { name: 'Wed', rate: 92 },
      { name: 'Thu', rate: 98 },
      { name: 'Fri', rate: 95 }
    ],
    growth: [
      { name: 'Jan', students: 120 },
      { name: 'Feb', students: 135 },
      { name: 'Mar', students: 150 },
      { name: 'Apr', students: 180 },
      { name: 'May', students: 210 },
      { name: 'Jun', students: 240 }
    ],
    finance: [
      { name: 'Jan', collected: 4000, pending: 1200 },
      { name: 'Feb', collected: 5000, pending: 800 },
      { name: 'Mar', collected: 4500, pending: 1500 },
      { name: 'Apr', collected: 6200, pending: 500 },
      { name: 'May', collected: 5800, pending: 900 }
    ]
  };

  const statCards = [
    { label: 'Total Students', value: stats?.studentCount, icon: GraduationCap, color: 'text-cyber-secondary', bg: 'bg-cyber-secondary/10' },
    { label: 'Total Teachers', value: stats?.teacherCount, icon: Users, iconColor: 'text-cyber-primary', color: 'text-cyber-primary', bg: 'bg-cyber-primary/10' },
    { label: 'Revenue Collected', value: `$${stats?.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-cyber-success', bg: 'bg-cyber-success/10' },
    { label: 'Attendance Rate', value: `${stats?.attendanceRate}%`, icon: Activity, color: 'text-cyber-accent', bg: 'bg-cyber-accent/10' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
          <p className="text-gray-400 text-xs mt-0.5">Real-time school operations and database telemetry</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => supabase.rpc('seed_demo_data').then(() => window.location.reload())}
            className="glass-button-secondary text-xs px-3.5 py-2 flex items-center gap-2 border border-cyber-primary/30 text-cyber-secondary"
            title="Pulls standard presets if database tables are empty"
          >
            <FileSpreadsheet size={14} />
            <span>Verify Presets</span>
          </button>
        </div>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                  {statsLoading ? '...' : card.value}
                </span>
              </div>
              <div className={`p-3 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform duration-150`}>
                <Icon size={20} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recharts Graphical grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          className="glass-card rounded-xl p-5 border border-white/5 col-span-1 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h3 className="font-semibold text-sm text-white">Fee Invoicing & Collections</h3>
            <span className="text-[10px] text-cyber-success font-medium bg-cyber-success/10 px-2 py-0.5 rounded flex items-center gap-0.5">
              Paid <ArrowUpRight size={10} />
            </span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.finance}>
                <defs>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f101a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Area type="monotone" dataKey="collected" stroke="#10b981" fillOpacity={1} fill="url(#colorCollected)" strokeWidth={2} name="Collected" />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fillOpacity={0} strokeWidth={1.5} name="Pending" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attendance Line Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-xl p-5 border border-white/5"
        >
          <h3 className="font-semibold text-sm text-white mb-4 border-b border-white/5 pb-2">Attendance Weekly Rate (%)</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartsData.attendance}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} domain={[80, 100]} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f101a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Line type="monotone" dataKey="rate" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: '#06b6d4' }} name="Attendance" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Row: Student Growth & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Growth Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-xl p-5 border border-white/5"
        >
          <h3 className="font-semibold text-sm text-white mb-4 border-b border-white/5 pb-2">Student Growth Trend</h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartsData.growth}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: '#0f101a', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Area type="monotone" dataKey="students" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorGrowth)" strokeWidth={2} name="Total Students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity logs */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-xl p-5 border border-white/5 col-span-1 lg:col-span-2 flex flex-col"
        >
          <h3 className="font-semibold text-sm text-white mb-4 border-b border-white/5 pb-2">Recent Activity Logs</h3>
          
          <div className="flex-1 overflow-x-auto">
            {logsLoading ? (
              <p className="text-xs text-gray-500 text-center py-10 animate-pulse">Retrieving system audits...</p>
            ) : logs && logs.length > 0 ? (
              <table className="w-full text-left text-xs text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-gray-500">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">Details</th>
                    <th className="py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/2">
                      <td className="py-2.5 text-white font-medium">{log.profiles?.full_name || 'System'}</td>
                      <td className="py-2.5"><span className="px-2 py-0.5 bg-cyber-primary/10 border border-cyber-primary/10 rounded-md text-cyber-secondary font-mono text-[10px]">{log.action}</span></td>
                      <td className="py-2.5 text-gray-300 max-w-[200px] truncate" title={log.details}>{log.details}</td>
                      <td className="py-2.5 text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Bell size={24} className="mb-2 text-gray-600" />
                <p className="text-xs">No activity logs recorded yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
