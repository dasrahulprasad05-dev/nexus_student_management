import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { FileText, FilePlus, Calendar, CheckSquare, MessageSquare, Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const AssignmentHub: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [submissionFeedbackText, setSubmissionFeedbackText] = useState('');
  const [submissionGrade, setSubmissionGrade] = useState('A');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);

  // New assignment form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['assignments-classes'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('*').order('grade_name', { ascending: true });
      if (data && data.length > 0) {
        setSelectedClassId(data[0].id);
      }
      return data || [];
    }
  });

  // Fetch student class details (needed for student view)
  const { data: studentRecord } = useQuery({
    queryKey: ['assignments-student-profile', profile?.id],
    queryFn: async () => {
      if (profile?.role !== 'student') return null;
      const { data } = await supabase.from('students').select('*').eq('id', profile.id).single();
      return data;
    },
    enabled: !!profile && profile.role === 'student'
  });

  // Fetch assignments
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['assignments-list', selectedClassId, studentRecord?.class_id],
    queryFn: async () => {
      const classId = profile?.role === 'student' ? studentRecord?.class_id : selectedClassId;
      if (!classId) return [];

      const { data } = await supabase
        .from('assignments')
        .select('*')
        .eq('class_id', classId)
        .order('deadline', { ascending: true });
      return data || [];
    },
    enabled: !!selectedClassId || !!studentRecord?.class_id
  });

  // Fetch submissions for teachers (lists all)
  const { data: submissions } = useQuery({
    queryKey: ['submissions-list'],
    queryFn: async () => {
      if (profile?.role !== 'teacher' && profile?.role !== 'admin') return [];
      const { data } = await supabase
        .from('submissions')
        .select('*, students(*, profiles(*)), assignments(*)');
      return data || [];
    },
    enabled: profile?.role === 'teacher' || profile?.role === 'admin'
  });

  // Fetch student's own submissions (to check status)
  const { data: mySubmissions } = useQuery({
    queryKey: ['my-submissions', profile?.id],
    queryFn: async () => {
      if (profile?.role !== 'student') return [];
      const { data } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', profile.id);
      return data || [];
    },
    enabled: !!profile && profile.role === 'student'
  });

  // Mutation to publish assignment
  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('assignments')
        .insert({
          class_id: selectedClassId,
          title: newTitle,
          description: newDesc,
          deadline: newDeadline,
          subject_name: newSubject,
          created_by: profile?.id
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments-list'] });
      setShowAddAssignment(false);
      setNewTitle('');
      setNewDesc('');
      setNewDeadline('');
    }
  });

  // Mutation to submit assignment (mock file attachment upload)
  const submitAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: profile?.id,
          file_url: 'https://storage.nexus.edu/homework_uploads/dummy.pdf',
          status: 'submitted'
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#8b5cf6', '#06b6d4', '#ec4899']
      });
    }
  });


  // Mutation to grade submittal
  const gradeSubmissionMutation = useMutation({
    mutationFn: async () => {
      if (!activeSubmissionId) return;
      const { data, error } = await supabase
        .from('submissions')
        .update({
          grade: submissionGrade,
          feedback: submissionFeedbackText,
          status: 'graded'
        })
        .eq('id', activeSubmissionId)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions-list'] });
      setActiveSubmissionId(null);
      setSubmissionFeedbackText('');
    }
  });

  const getSubmissionStatus = (assignmentId: string) => {
    const sub = mySubmissions?.find((s: any) => s.assignment_id === assignmentId);
    return sub ? sub : null;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAssignmentMutation.mutate();
  };

  const handleGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    gradeSubmissionMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Assignment Hub</h1>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">Upload coursework tasks, review student files, or submit submittals</p>
        </div>

        {(profile?.role === 'admin' || profile?.role === 'teacher') && (
          <button
            onClick={() => setShowAddAssignment(true)}
            className="glass-button-primary flex items-center justify-center gap-2 text-xs py-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <FilePlus size={16} />
            <span>Create Homework Assignment</span>
          </button>
        )}
      </div>

      {/* TEACHER/ADMIN SUBMISSIONS GRADING SCREEN */}
      {(profile?.role === 'admin' || profile?.role === 'teacher') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Class Select & Assignments column */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Assignments List */}
            <div className="glass-card rounded-xl border border-white/5 overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-white/5 bg-white/2">
                <span className="font-bold text-xs uppercase text-white tracking-wider flex items-center gap-1.5">
                  <FileText size={16} className="text-cyber-primary" />
                  <span>Assignments Published</span>
                </span>
              </div>

              {assignmentsLoading ? (
                <p className="text-xs text-gray-500 text-center py-10 animate-pulse">Syncing tasks...</p>
              ) : assignments && assignments.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-10">No homework tasks published in this class yet.</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {assignments.map((assg: any) => (
                    <div key={assg.id} className="p-4 flex justify-between items-start gap-4">
                      <div>
                        <h4 className="font-semibold text-xs text-white">{assg.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed max-w-[400px]">{assg.description}</p>
                        <div className="flex items-center gap-3.5 text-[9px] text-gray-500 mt-2">
                          <span className="text-cyber-secondary font-semibold uppercase">{assg.subject_name}</span>
                          <span>Deadline: {new Date(assg.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submissions Inbox Queue */}
          <div className="glass-card rounded-xl p-5 border border-white/5 space-y-4">
            <h3 className="font-semibold text-sm text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
              <CheckSquare size={18} className="text-cyber-secondary" />
              <span>Submissions Inbox Queue</span>
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {submissions && submissions.length > 0 ? (
                submissions.map((sub: any) => {
                  const isSelected = activeSubmissionId === sub.id;
                  return (
                    <div 
                      key={sub.id} 
                      onClick={() => {
                        setActiveSubmissionId(sub.id);
                        setSubmissionFeedbackText(sub.feedback || '');
                        setSubmissionGrade(sub.grade || 'A');
                      }}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-cyber-primary/10 border-cyber-primary text-white shadow-md' 
                          : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="font-bold text-xs text-white block">{sub.students?.profiles?.full_name}</span>
                      <span className="text-[10px] text-cyber-secondary font-semibold mt-0.5 block">{sub.assignments?.title}</span>
                      
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[9px] text-gray-500 font-mono">Date: {new Date(sub.submitted_at).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          sub.status === 'graded' ? 'bg-cyber-success/15 text-cyber-success border border-cyber-success/20' : 'bg-cyber-warning/15 text-cyber-warning border border-cyber-warning/20'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-8">Submissions inbox is empty.</p>
              )}
            </div>

            {/* Grading Drawer inside Panel */}
            {activeSubmissionId && (
              <motion.form 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleGradeSubmit} 
                className="mt-6 pt-4 border-t border-white/5 space-y-3 text-xs"
              >
                <h4 className="font-semibold text-xs text-white uppercase tracking-wider mb-2.5">Grade Submission</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-1">GRADE LETTER</label>
                    <select
                      value={submissionGrade}
                      onChange={(e) => setSubmissionGrade(e.target.value)}
                      className="w-full glass-input text-xs py-1.5 bg-[#0d0e16]"
                    >
                      <option value="A+">A+</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-gray-500 font-bold block mb-1">FEEDBACK COMMENT</label>
                  <textarea
                    required
                    value={submissionFeedbackText}
                    onChange={(e) => setSubmissionFeedbackText(e.target.value)}
                    placeholder="Enter grader notes..."
                    rows={2}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={gradeSubmissionMutation.isPending}
                  className="w-full glass-button-primary py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={13} />
                  <span>Submit Score & Feedback</span>
                </button>
              </motion.form>
            )}
          </div>
        </div>
      )}

      {/* STUDENT PORTAL VIEWS */}
      {profile?.role === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Homework Tasks */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
              <Calendar size={18} className="text-cyber-primary" />
              <span>Pending Coursework Tasks</span>
            </h3>

            {assignmentsLoading ? (
              <p className="text-xs text-gray-500 text-center py-10 animate-pulse">Syncing class task files...</p>
            ) : assignments && assignments.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-10">No pending assignments allocated to your class.</p>
            ) : (
              <div className="space-y-4">
                {assignments.map((assg: any) => {
                  const subStatus = getSubmissionStatus(assg.id);
                  return (
                    <div key={assg.id} className="glass-card rounded-xl p-4 border border-white/5 hover:border-cyber-primary/10 transition-colors flex flex-col justify-between h-40">
                      <div>
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[10px] text-cyber-secondary font-bold uppercase">{assg.subject_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                            subStatus 
                              ? subStatus.status === 'graded' 
                                ? 'bg-cyber-success/15 border-cyber-success/20 text-cyber-success' 
                                : 'bg-cyber-primary/15 border-cyber-primary/20 text-cyber-primary'
                              : 'bg-cyber-warning/15 border-cyber-warning/20 text-cyber-warning'
                          }`}>
                            {subStatus ? subStatus.status : 'pending'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-white">{assg.title}</h4>
                        <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{assg.description}</p>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-2.5 mt-2.5">
                        <span className="text-[9px] text-gray-500">Due: {new Date(assg.deadline).toLocaleDateString()}</span>
                        {!subStatus ? (
                          <button
                            onClick={() => submitAssignmentMutation.mutate(assg.id)}
                            disabled={submitAssignmentMutation.isPending}
                            className="glass-button-primary text-[10px] py-1 px-3 flex items-center gap-1 shadow-none"
                          >
                            <Upload size={10} />
                            <span>Submit Homework</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-cyber-success">Submitted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submissions feedback tracker */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
              <MessageSquare size={18} className="text-cyber-secondary" />
              <span>Homework Feedbacks</span>
            </h3>

            <div className="space-y-3.5">
              {mySubmissions && mySubmissions.length > 0 ? (
                mySubmissions.filter((s: any) => s.status === 'graded').map((sub: any) => (
                  <div key={sub.id} className="glass-card rounded-xl p-4 border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xs text-white">Submission Graded</span>
                      <span className="font-mono text-base font-extrabold text-cyber-success">{sub.grade}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Grader Notes: "{sub.feedback || 'Excellent homework submission.'}"</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-8">No graded assignment feedbacks recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Column Modal */}
      <AnimatePresence>
        {showAddAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative"
            >
              <div className="flex justify-between items-center px-5 py-3.5 border-b border-white/5 bg-white/2">
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">Publish Homework Assignment</h3>
                <button onClick={() => setShowAddAssignment(false)} className="text-gray-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Assignment Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Electromagnetism Exercises"
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Description / Instructions</label>
                  <textarea
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Enter tasks parameters details..."
                    rows={3}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Subject Course</label>
                    <select
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full glass-input text-xs bg-[#0d0e16]"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="History">History</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Deadline Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createAssignmentMutation.isPending}
                  className="w-full glass-button-primary flex items-center justify-center gap-2 text-xs py-2.5 mt-6 font-semibold"
                >
                  {createAssignmentMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Publish Homework Assignment</span>
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
