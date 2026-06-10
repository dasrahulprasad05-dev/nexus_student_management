import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useLocation } from 'react-router-dom';
import { Search, UserPlus, Grid, List, X, Download, ShieldAlert, BadgeInfo, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

export const StudentDirectory: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Add form fields state
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newDOB, setNewDOB] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Check if we came from Ctrl+K palette search selection
  useEffect(() => {
    if (location.state?.selectedStudentId) {
      setSelectedStudentId(location.state.selectedStudentId);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['classes-list'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('*').order('grade_name', { ascending: true });
      return data || [];
    }
  });

  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const { data: studentRows } = await supabase
        .from('students')
        .select('*, classes(*)')
        .order('created_at', { ascending: false });

      if (!studentRows || studentRows.length === 0) return [];

      const ids = studentRows.map((s: any) => s.id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', ids);

      return studentRows.map((s: any) => ({
        ...s,
        profiles: profiles?.find((p: any) => p.id === s.id) || null
      }));
    }
  });

  // Fetch selected student detail info
  const { data: detailData } = useQuery({
    queryKey: ['student-detail', selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return null;
      
      const { data: studentRow } = await supabase
        .from('students')
        .select('*, classes(*)')
        .eq('id', selectedStudentId)
        .single();

      let student = null;
      if (studentRow) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', selectedStudentId)
          .single();
        
        student = {
          ...studentRow,
          profiles: profile || null
        };
      }

      // Fetch child attendance
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', selectedStudentId);

      const totalAtt = attendance?.length || 0;
      const presentCount = attendance?.filter((a: any) => a.status === 'present' || a.status === 'late').length || 0;
      const attRate = totalAtt > 0 ? Math.round((presentCount / totalAtt) * 100) : 95;

      return { student, attRate };
    },
    enabled: !!selectedStudentId
  });

  // Mutation to insert student
  const addStudentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('create_student_profile', {
        p_email: newEmail,
        p_name: newFullName,
        p_roll: newRoll,
        p_class_id: newClassId,
        p_dob: newDOB
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-list'] });
      setShowAddModal(false);
      // Reset form
      setNewFullName('');
      setNewEmail('');
      setNewRoll('');
      setNewDOB('');
      setNewClassId('');
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Error creating student account.');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!newClassId) {
      setFormError('Please select a class allocation.');
      return;
    }
    addStudentMutation.mutate();
  };

  // Generate and download Digital ID Card as PDF
  const downloadIDCard = (stu: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [85, 120] // Credit Card sized tall ID Badge
    });

    // Background Cyber Theme Colors
    doc.setFillColor(7, 8, 15);
    doc.rect(0, 0, 85, 120, 'F');

    // Header gradient line
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 85, 4, 'F');

    // School Banner
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('NEXUS ACADEMY', 42.5, 14, { align: 'center' });
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(6, 182, 212);
    doc.text('DIGITAL STUDENT IDENTITY', 42.5, 19, { align: 'center' });

    // Mock Profile Picture outline
    doc.setDrawColor(255, 255, 255, 30);
    doc.setFillColor(20, 21, 35);
    doc.roundedRect(27.5, 26, 30, 30, 2, 2, 'FD');

    // Initial letter in photo container
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(22);
    doc.text(stu.profiles?.full_name?.[0] || 'S', 42.5, 46, { align: 'center' });

    // Name & Details
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.text(stu.profiles?.full_name || 'Student Name', 42.5, 64, { align: 'center' });

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID: ${stu.student_id}`, 42.5, 70, { align: 'center' });

    // Details Grid block
    doc.setFillColor(15, 16, 28);
    doc.roundedRect(10, 75, 65, 22, 1.5, 1.5, 'F');

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('CLASS', 15, 81);
    doc.text('ROLL NO', 40, 81);
    doc.text('GPA', 60, 81);

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${stu.classes?.grade_name || 'N/A'}-${stu.classes?.section || ''}`, 15, 87);
    doc.text(stu.roll_number || 'N/A', 40, 87);
    doc.text(stu.gpa?.toFixed(2) || '0.00', 60, 87);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('EMAIL', 15, 93);
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.text(stu.profiles?.email || '', 15, 95.5);

    // Footer QR mock code details
    doc.setFillColor(255, 255, 255);
    doc.rect(36, 102, 13, 13, 'F');
    // Draw some mock QR dots
    doc.setFillColor(0, 0, 0);
    doc.rect(37, 103, 3, 3, 'F');
    doc.rect(45, 103, 3, 3, 'F');
    doc.rect(37, 111, 3, 3, 'F');
    doc.rect(41, 107, 2, 2, 'F');
    doc.rect(46, 110, 2, 2, 'F');

    doc.save(`IDCard_${stu.student_id}.pdf`);
  };

  // Get Risk status indicator details
  const getRiskStatus = (gpa: number, attRate: number) => {
    if (attRate < 80 || gpa < 2.5) {
      return { label: 'At Risk', color: 'text-cyber-danger bg-cyber-danger/10 border-cyber-danger/20', icon: ShieldAlert, level: 'High' };
    }
    if (attRate < 90 || gpa < 3.2) {
      return { label: 'Warning', color: 'text-cyber-warning bg-cyber-warning/10 border-cyber-warning/20', icon: AlertTriangle, level: 'Mid' };
    }
    return { label: 'Safe', color: 'text-cyber-success bg-cyber-success/10 border-cyber-success/20', icon: CheckCircle, level: 'Low' };
  };

  const filteredStudents = students?.filter((stu: any) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      stu.profiles?.full_name.toLowerCase().includes(searchLower) ||
      stu.student_id.toLowerCase().includes(searchLower);
    
    const matchesClass = classFilter ? stu.class_id === classFilter : true;
    const matchesStatus = statusFilter ? stu.status === statusFilter : true;

    return matchesSearch && matchesClass && matchesStatus;
  }) || [];

  return (
    <div className="space-y-6 relative">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Student Directory</h1>
          <p className="text-gray-400 text-xs mt-0.5">Filter, search, register, or download ID cards for students</p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Grid/List switch */}
          <div className="flex items-center gap-1 border border-white/5 bg-white/2 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-gray-400 hover:text-white transition ${viewMode === 'list' ? 'bg-cyber-primary/20 text-white' : ''}`}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-gray-400 hover:text-white transition ${viewMode === 'grid' ? 'bg-cyber-primary/20 text-white' : ''}`}
            >
              <Grid size={16} />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="glass-button-primary flex items-center justify-center gap-2 text-xs py-2"
          >
            <UserPlus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-white/2 p-3 rounded-xl border border-white/5">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or unique ID..."
            className="w-full glass-input text-xs pl-9 py-2"
          />
        </div>

        <div>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full glass-input text-xs py-2 bg-[#0d0e16]"
          >
            <option value="">All Classes</option>
            {classes?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.grade_name} - {c.section}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full glass-input text-xs py-2 bg-[#0d0e16]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>
      </div>

      {/* Directory Content List */}
      {isLoading ? (
        <p className="text-xs text-gray-500 text-center py-12 animate-pulse">Syncing student records...</p>
      ) : filteredStudents.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-12">No student records match search filters.</p>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="glass-card rounded-xl border border-white/5 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-400 border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 bg-white/2">
                  <th className="p-4">Student ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Class</th>
                  <th className="p-4">Roll</th>
                  <th className="p-4">GPA</th>
                  <th className="p-4">Risk Status</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stu: any) => {
                  const risk = getRiskStatus(stu.gpa, 95); // Default attendance 95 for preview row
                  return (
                    <tr 
                      key={stu.id} 
                      onClick={() => setSelectedStudentId(stu.id)}
                      className="border-b border-white/5 hover:bg-cyber-primary/5 cursor-pointer transition-colors duration-150"
                    >
                      <td className="p-4 font-mono font-semibold text-cyber-secondary">{stu.student_id}</td>
                      <td className="p-4 text-white font-medium">{stu.profiles?.full_name}</td>
                      <td className="p-4">{stu.classes ? `${stu.classes.grade_name}-${stu.classes.section}` : 'N/A'}</td>
                      <td className="p-4">{stu.roll_number || 'N/A'}</td>
                      <td className="p-4 font-semibold text-cyber-primary">{stu.gpa?.toFixed(2) || '0.00'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${risk.color}`}>
                          {risk.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          stu.status === 'active' 
                            ? 'bg-cyber-success/10 text-cyber-success' 
                            : 'bg-gray-700/20 text-gray-400'
                        }`}>
                          {stu.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredStudents.map((stu: any) => {
            const risk = getRiskStatus(stu.gpa, 95);
            return (
              <motion.div
                key={stu.id}
                layout
                onClick={() => setSelectedStudentId(stu.id)}
                className="glass-card rounded-xl p-5 border border-white/5 hover:border-cyber-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-semibold text-cyber-secondary">{stu.student_id}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${risk.color}`}>
                      {risk.label}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm group-hover:text-cyber-primary transition-colors">{stu.profiles?.full_name}</h3>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {stu.classes ? `${stu.classes.grade_name}-${stu.classes.section}` : 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-3">
                  <div className="text-xs">
                    <span className="text-gray-500 font-medium block text-[9px] uppercase">GPA</span>
                    <span className="font-bold text-white mt-0.5 block">{stu.gpa?.toFixed(2) || '0.00'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wide ${
                    stu.status === 'active' ? 'bg-cyber-success/10 text-cyber-success' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {stu.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interactive Right-Sliding Profile Drawer */}
      <AnimatePresence>
        {selectedStudentId && detailData && (
          <>
            {/* Backdrop blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudentId(null)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ translateX: '100%' }}
              animate={{ translateX: 0 }}
              exit={{ translateX: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-[#0a0b12] border-l border-white/10 shadow-2xl z-50 p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div>
                {/* Header controls */}
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-white/5">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BadgeInfo size={16} className="text-cyber-primary" />
                    <span>Student Profile details</span>
                  </h3>
                  <button 
                    onClick={() => setSelectedStudentId(null)} 
                    className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Details layout */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 bg-white/2 p-4 rounded-xl border border-white/5">
                    <div className="w-14 h-14 rounded-full bg-cyber-secondary/10 text-cyber-secondary border border-cyber-secondary/20 flex items-center justify-center font-extrabold text-xl shadow-inner uppercase">
                      {detailData.student?.profiles?.full_name?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{detailData.student?.profiles?.full_name}</h4>
                      <p className="text-xs text-cyber-secondary font-mono mt-1">{detailData.student?.student_id}</p>
                    </div>
                  </div>

                  {/* Profile properties */}
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400 font-semibold">Email</span>
                      <span className="text-white font-medium">{detailData.student?.profiles?.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400 font-semibold">Roll Number</span>
                      <span className="text-white font-medium">{detailData.student?.roll_number || 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400 font-semibold">Date of Birth</span>
                      <span className="text-white font-medium">{detailData.student?.date_of_birth || 'Not Assigned'}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                      <span className="text-gray-400 font-semibold">Level / Exp</span>
                      <span className="text-cyber-primary font-bold">Lvl {detailData.student?.level || 1} ({detailData.student?.exp || 0} XP)</span>
                    </div>
                    
                    {/* Risk Telemetry */}
                    {(() => {
                      const risk = getRiskStatus(detailData.student?.gpa || 0, detailData.attRate);
                      const RiskIcon = risk.icon;
                      return (
                        <div className="py-3 px-3 rounded-lg border flex items-center justify-between mt-4 bg-white/2 border-white/5">
                          <div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase block">Risk Assessment</span>
                            <span className="text-xs text-white font-semibold mt-0.5 block">Level: {risk.level} Risk</span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md border font-bold text-[10px] uppercase tracking-wide ${risk.color}`}>
                            <RiskIcon size={12} />
                            <span>{risk.label}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-white/5 space-y-2">
                <button
                  onClick={() => downloadIDCard(detailData.student)}
                  className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                >
                  <Download size={14} />
                  <span>Download Digital ID Card (PDF)</span>
                </button>
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className="w-full glass-button-secondary text-xs py-2.5"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Register New Student</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div className="m-4 p-3 bg-cyber-danger/10 border border-cyber-danger/20 text-cyber-danger rounded-lg text-xs leading-relaxed">
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Harry Potter"
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="student@nexus.edu"
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Roll Number</label>
                    <input
                      type="text"
                      required
                      value={newRoll}
                      onChange={(e) => setNewRoll(e.target.value)}
                      placeholder="e.g. 07"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={newDOB}
                      onChange={(e) => setNewDOB(e.target.value)}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Class Allocation</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full glass-input text-xs bg-[#0d0e16]"
                  >
                    <option value="">Select Grade Section</option>
                    {classes?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.grade_name} - {c.section}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={addStudentMutation.isPending}
                  className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 mt-6 font-semibold"
                >
                  {addStudentMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Register Account</span>
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
