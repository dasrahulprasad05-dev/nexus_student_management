import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FilePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Gradebook: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [editingCell, setEditingCell] = useState<{ studentId: string; examId: string } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAddExam, setShowAddExam] = useState(false);

  // New exam form states
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamType, setNewExamType] = useState<'unit' | 'midterm' | 'final'>('unit');
  const [newExamMaxMarks, setNewExamMaxMarks] = useState('100');
  const [newExamSubject, setNewExamSubject] = useState('Mathematics');
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [examFormError, setExamFormError] = useState<string | null>(null);

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['gradebook-classes'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('*').order('grade_name', { ascending: true });
      if (data && data.length > 0) {
        setSelectedClassId(data[0].id);
      }
      return data || [];
    }
  });

  // Fetch students in class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['gradebook-students', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data } = await supabase
        .from('students')
        .select('*, profiles(*)')
        .eq('class_id', selectedClassId);
      return data || [];
    },
    enabled: !!selectedClassId
  });

  // Fetch exams for class
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['gradebook-exams', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId) return [];
      const { data } = await supabase
        .from('exams')
        .select('*')
        .eq('class_id', selectedClassId)
        .order('date', { ascending: true });
      return data || [];
    },
    enabled: !!selectedClassId
  });

  // Fetch all marks for this class's exams
  const { data: marks } = useQuery({
    queryKey: ['gradebook-marks', selectedClassId],
    queryFn: async () => {
      if (!selectedClassId || !exams || exams.length === 0) return [];
      const examIds = exams.map((e: any) => e.id);
      
      const { data } = await supabase
        .from('marks')
        .select('*')
        .in('exam_id', examIds);
      return data || [];
    },
    enabled: !!selectedClassId && !!exams && exams.length > 0
  });

  // Mutation to upsert marks cell score
  const updateMarkMutation = useMutation({
    mutationFn: async ({ studentId, examId, score }: { studentId: string; examId: string; score: number }) => {
      const existing = marks?.find((m: any) => m.student_id === studentId && m.exam_id === examId);
      
      if (existing) {
        const { data, error } = await supabase
          .from('marks')
          .update({ marks_obtained: score })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('marks')
          .insert({ student_id: studentId, exam_id: examId, marks_obtained: score })
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook-marks', selectedClassId] });
      setEditingCell(null);
    }
  });

  // Mutation to create new exam column
  const createExamMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          class_id: selectedClassId,
          title: newExamTitle,
          exam_type: newExamType,
          max_marks: Number(newExamMaxMarks),
          subject_name: newExamSubject,
          date: newExamDate
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook-exams', selectedClassId] });
      setShowAddExam(false);
      // Reset form
      setNewExamTitle('');
      setNewExamMaxMarks('100');
      setExamFormError(null);
    },
    onError: (err: any) => {
      setExamFormError(err.message || 'Error creating exam record.');
    }
  });

  const handleCellDoubleClick = (studentId: string, examId: string, currentVal: string) => {
    if (profile?.role !== 'admin' && profile?.role !== 'teacher') return; // Read-only for students/parents
    setEditingCell({ studentId, examId });
    setEditingValue(currentVal);
  };

  const handleCellSave = () => {
    if (!editingCell) return;
    const score = Number(editingValue);
    if (isNaN(score) || score < 0) {
      alert('Please enter a valid numeric mark score.');
      return;
    }
    updateMarkMutation.mutate({
      studentId: editingCell.studentId,
      examId: editingCell.examId,
      score
    });
  };

  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExamFormError(null);
    if (!newExamTitle) {
      setExamFormError('Please enter a valid exam title.');
      return;
    }
    createExamMutation.mutate();
  };

  const getScore = (studentId: string, examId: string) => {
    const markRecord = marks?.find((m: any) => m.student_id === studentId && m.exam_id === examId);
    return markRecord ? markRecord.marks_obtained : null;
  };

  const getPercentageColor = (score: number, maxMarks: number) => {
    const pct = (score / maxMarks) * 100;
    if (pct >= 85) return 'text-cyber-success font-bold';
    if (pct >= 60) return 'text-cyber-secondary';
    return 'text-cyber-danger font-bold';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Controls */}
      <div className="pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Gradebook Console</h1>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">Double-click score cells to edit marks, track GPAs, or add exams</p>
        </div>

        {(profile?.role === 'admin' || profile?.role === 'teacher') && (
          <button
            onClick={() => setShowAddExam(true)}
            className="glass-button-primary flex items-center justify-center gap-2 text-xs py-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <FilePlus size={16} />
            <span>Create New Exam Column</span>
          </button>
        )}
      </div>

      {/* Class Selection selector */}
      <div className="bg-white/2 p-3.5 rounded-xl border border-white/5 max-w-sm">
        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Select Grade Section</label>
        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full glass-input text-xs py-2 bg-[#0d0e16]"
        >
          {classes?.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.grade_name} - {c.section}
            </option>
          ))}
        </select>
      </div>

      {/* Interactive Score Grid Matrix */}
      {studentsLoading || examsLoading ? (
        <p className="text-xs text-gray-500 text-center py-12 animate-pulse">Syncing class grade registries...</p>
      ) : students && students.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-12">No student records found in class roster.</p>
      ) : (
        <div className="glass-card rounded-xl border border-white/5 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-gray-500 bg-white/2">
                  <th className="p-4 min-w-[150px]">Student Name</th>
                  <th className="p-4 text-center">GPA</th>
                  {exams && exams.length > 0 ? (
                    exams.map((exam: any) => (
                      <th key={exam.id} className="p-4 text-center min-w-[120px]">
                        <span className="text-white block font-semibold">{exam.title}</span>
                        <span className="text-[9px] text-gray-500 mt-0.5 block normal-case font-normal">
                          Max: {exam.max_marks} • {exam.subject_name}
                        </span>
                      </th>
                    ))
                  ) : (
                    <th className="p-4 text-center text-gray-500">No exams registered</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-400">
                {students.map((stu: any) => (
                  <tr key={stu.id} className="hover:bg-white/2 transition-colors duration-100">
                    <td className="p-4 font-semibold text-white">
                      {stu.profiles?.full_name}
                      <span className="text-[10px] text-gray-500 mt-0.5 block font-mono font-normal">Roll: {stu.roll_number}</span>
                    </td>
                    <td className="p-4 text-center font-bold text-cyber-primary text-sm">
                      {stu.gpa?.toFixed(2) || '0.00'}
                    </td>
                    {exams && exams.map((exam: any) => {
                      const score = getScore(stu.id, exam.id);
                      const isEditing = editingCell?.studentId === stu.id && editingCell?.examId === exam.id;
                      
                      return (
                        <td 
                          key={exam.id} 
                          className="p-4 text-center relative select-none font-mono"
                          onDoubleClick={() => handleCellDoubleClick(stu.id, exam.id, score !== null ? String(score) : '')}
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5 min-w-[80px]">
                              <input
                                type="text"
                                autoFocus
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleCellSave}
                                onKeyDown={(e) => e.key === 'Enter' && handleCellSave()}
                                className="w-16 glass-input text-center text-xs py-1 px-1 focus:ring-0 focus:border-cyber-primary"
                              />
                            </div>
                          ) : (
                            <span className={score !== null ? getPercentageColor(Number(score), exam.max_marks) : 'text-gray-600'}>
                              {score !== null ? score : '-'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      <AnimatePresence>
        {showAddExam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Create Assessment Column</h3>
                <button onClick={() => setShowAddExam(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {examFormError && (
                <div className="m-4 p-3 bg-cyber-danger/10 border border-cyber-danger/20 text-cyber-danger rounded-lg text-xs">
                  {examFormError}
                </div>
              )}

              <form onSubmit={handleCreateExamSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Exam Title / Name</label>
                  <input
                    type="text"
                    required
                    value={newExamTitle}
                    onChange={(e) => setNewExamTitle(e.target.value)}
                    placeholder="e.g. Mathematics Midterm 2026"
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Max Score Marks</label>
                    <input
                      type="number"
                      required
                      value={newExamMaxMarks}
                      onChange={(e) => setNewExamMaxMarks(e.target.value)}
                      placeholder="100"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Exam Type</label>
                    <select
                      value={newExamType}
                      onChange={(e) => setNewExamType(e.target.value as any)}
                      className="w-full glass-input text-xs bg-[#0d0e16]"
                    >
                      <option value="unit">Unit Test</option>
                      <option value="midterm">Midterm</option>
                      <option value="final">Final Exam</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Subject Course</label>
                    <select
                      value={newExamSubject}
                      onChange={(e) => setNewExamSubject(e.target.value)}
                      className="w-full glass-input text-xs bg-[#0d0e16]"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Assessment Date</label>
                    <input
                      type="date"
                      required
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createExamMutation.isPending}
                  className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 mt-6 font-semibold"
                >
                  {createExamMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Establish Exam Column</span>
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

// Simple visual X icon for header close button helper
const X: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
