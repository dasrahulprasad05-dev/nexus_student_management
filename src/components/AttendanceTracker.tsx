import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { QrCode, CheckCircle, Users, Scan } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Html5QrcodeScanner } from 'html5-qrcode';


export const AttendanceTracker: React.FC = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRClassId, setActiveQRClassId] = useState<string | null>(null);

  // Student scanning states
  const [showScanner, setShowScanner] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState('');

  // Fetch classes
  const { data: classes } = useQuery({
    queryKey: ['attendance-classes'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('*').order('grade_name', { ascending: true });
      if (data && data.length > 0) {
        setSelectedClassId(data[0].id);
      }
      return data || [];
    }
  });

  // Fetch students in selected class
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['attendance-students', selectedClassId],
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

  // Fetch logged attendance for class on selected date
  const { data: attendanceLogs } = useQuery({
    queryKey: ['attendance-logs', selectedClassId, selectedDate],
    queryFn: async () => {
      if (!selectedClassId || !selectedDate) return [];
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('date', selectedDate);
      return data || [];
    },
    enabled: !!selectedClassId && !!selectedDate
  });

  // Mutation to save/toggle attendance status
  const logAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status }: { studentId: string; status: 'present' | 'absent' | 'late' }) => {
      // Upsert attendance record
      const existing = attendanceLogs?.find((a: any) => a.student_id === studentId);
      
      if (existing) {
        const { data, error } = await supabase
          .from('attendance')
          .update({ status, marked_by: profile?.id })
          .eq('id', existing.id)
          .select();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('attendance')
          .insert({
            student_id: studentId,
            class_id: selectedClassId,
            date: selectedDate,
            status,
            method: 'manual',
            marked_by: profile?.id
          })
          .select();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs', selectedClassId, selectedDate] });
    }
  });

  const logBulkAttendanceMutation = useMutation({
    mutationFn: async (status: 'present' | 'absent' | 'late') => {
      if (!students || students.length === 0) return;
      const records = students.map((stu: any) => ({
        student_id: stu.id,
        class_id: selectedClassId,
        date: selectedDate,
        status,
        method: 'manual',
        marked_by: profile?.id
      }));
      const { data, error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,date' })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-logs', selectedClassId, selectedDate] });
      confetti({
        particleCount: 60,
        spread: 50
      });
    }
  });

  // Real QR Code scanner lifecycle
  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (showScanner && !scanSuccess) {
      const timer = setTimeout(() => {
        const container = document.getElementById('qr-reader-container');
        if (container) {
          scanner = new Html5QrcodeScanner(
            'qr-reader-container',
            { fps: 10, qrbox: { width: 200, height: 200 } },
            false
          );
          scanner.render(
            (decodedText) => {
              handleQRCheckIn(decodedText);
              if (scanner) {
                scanner.clear().catch(err => console.error("Failed to clear scanner on scan", err));
              }
            },
            () => {
              // Ignore scanning errors
            }
          );
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scanner) {
          scanner.clear().catch(err => console.error("Failed to clear scanner on cleanup", err));
        }
      };
    }
  }, [showScanner, scanSuccess]);

  const handleQRCheckIn = async (token: string) => {
    if (!profile) return;
    try {
      const targetClassId = token.trim() || 'c0000000-0000-0000-0000-00000000010a'; // Fallback to Class 10-A
      
      const { error } = await supabase
        .from('attendance')
        .insert({
          student_id: profile.id,
          class_id: targetClassId,
          date: new Date().toISOString().split('T')[0],
          status: 'present',
          method: 'qr',
          marked_by: profile.id
        });

      if (error && error.code !== '23505') { // Ignore duplicate entries
        alert(`Scan Error: ${error.message}`);
      } else {
        setScanSuccess(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          setScanSuccess(false);
          setShowScanner(false);
          setQrTokenInput('');
        }, 2200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQRScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQRCheckIn(qrTokenInput);
  };

  const getStudentStatus = (studentId: string) => {
    const log = attendanceLogs?.find((a: any) => a.student_id === studentId);
    return log ? log.status : null;
  };

  const handleQRGeneration = () => {
    setActiveQRClassId(selectedClassId);
    setShowQRModal(true);
  };

  const activeClassName = classes?.find((c: any) => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Attendance Register</h1>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">Manage daily attendance rolls or scan session QR codes</p>
        </div>

        {/* Action controls for Teacher/Admin */}
        {(profile?.role === 'admin' || profile?.role === 'teacher') && (
          <button
            onClick={handleQRGeneration}
            className="glass-button-primary flex items-center justify-center gap-2 text-xs py-2 bg-gradient-to-r from-cyber-primary to-cyber-secondary shadow-[0_0_15px_rgba(139,92,246,0.2)]"
          >
            <QrCode size={16} />
            <span>Generate Class QR Code</span>
          </button>
        )}
      </div>

      {/* STUDENT SCAN INTERFACE */}
      {profile?.role === 'student' && (
        <div className="max-w-md mx-auto text-center py-6">
          {!showScanner ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-8 border border-cyber-primary/20 text-center"
            >
              <QrCode size={64} className="mx-auto text-cyber-secondary mb-4 animate-pulse" />
              <h2 className="text-xl font-bold text-white mb-2">QR Code Attendance Check-In</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Your school supports smart QR check-ins. Click below to open the portal scanner simulator and scan your teacher's session code.
              </p>
              <button
                onClick={() => setShowScanner(true)}
                className="glass-button-primary w-full flex items-center justify-center gap-2"
              >
                <Scan size={16} />
                <span>Open Scanner Simulator</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 border border-cyber-secondary/20 relative"
            >
              <button 
                onClick={() => setShowScanner(false)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                Close
              </button>
              
              {!scanSuccess ? (
                <div className="space-y-5">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">PORTAL QR SCANNER</h3>
                  <div id="qr-reader-container" className="w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-white/5 bg-black/40 text-left" />

                  <form onSubmit={handleQRScanSubmit} className="space-y-3">
                    <label className="text-left text-[10px] uppercase font-bold text-gray-500 block mb-1">Enter Code Token</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={qrTokenInput}
                        onChange={(e) => setQrTokenInput(e.target.value)}
                        placeholder="Paste or type class token e.g. CLASS10A"
                        className="flex-1 glass-input text-xs"
                      />
                      <button type="submit" className="glass-button-primary text-xs font-semibold py-2">
                        Mark Present
                      </button>
                    </div>
                  </form>
                  <p className="text-[10px] text-gray-500">For testing: Enter your class UUID, or leave blank to check-in to Class 10-A preset.</p>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12"
                >
                  <CheckCircle size={54} className="mx-auto text-cyber-success mb-3" />
                  <h3 className="text-lg font-bold text-white mb-1">Check-In Successful!</h3>
                  <p className="text-xs text-cyber-secondary font-semibold">Attendance logged under QR Code Method</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      )}

      {/* TEACHER & ADMIN MANUAL INPUTS */}
      {(profile?.role === 'admin' || profile?.role === 'teacher') && (
        <div className="space-y-6">
          {/* Class and Date selection bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white/2 p-3 rounded-xl border border-white/5">
            <div>
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
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Register Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full glass-input text-xs py-2"
              />
            </div>
          </div>

          {/* Student attendance register sheet */}
          <div className="glass-card rounded-xl border border-white/5 overflow-hidden shadow-lg">
            <div className="px-5 py-4 border-b border-white/5 bg-white/2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="font-bold text-xs uppercase text-white tracking-wider flex items-center gap-1.5">
                <Users size={16} className="text-cyber-primary" />
                <span>Class Roster ({students?.length || 0} Students)</span>
              </span>
              
              <div className="flex flex-wrap items-center gap-2">
                {students && students.length > 0 && (
                  <div className="flex items-center gap-1.5 border-r border-white/10 pr-2">
                    <span className="text-[9px] uppercase font-bold text-gray-500">Mark All:</span>
                    <button
                      onClick={() => logBulkAttendanceMutation.mutate('present')}
                      disabled={logBulkAttendanceMutation.isPending}
                      className="px-2 py-1 bg-cyber-success/10 border border-cyber-success/20 hover:bg-cyber-success/20 text-cyber-success rounded text-[9px] font-bold uppercase transition"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => logBulkAttendanceMutation.mutate('late')}
                      disabled={logBulkAttendanceMutation.isPending}
                      className="px-2 py-1 bg-cyber-warning/10 border border-cyber-warning/20 hover:bg-cyber-warning/20 text-cyber-warning rounded text-[9px] font-bold uppercase transition"
                    >
                      Late
                    </button>
                    <button
                      onClick={() => logBulkAttendanceMutation.mutate('absent')}
                      disabled={logBulkAttendanceMutation.isPending}
                      className="px-2 py-1 bg-cyber-danger/10 border border-cyber-danger/20 hover:bg-cyber-danger/20 text-cyber-danger rounded text-[9px] font-bold uppercase transition"
                    >
                      Absent
                    </button>
                  </div>
                )}
                <span className="text-[10px] text-gray-500 font-semibold bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                  Date: {selectedDate}
                </span>
              </div>
            </div>

            {!selectedClassId || studentsLoading ? (
              <p className="text-xs text-gray-500 text-center py-10 animate-pulse">Syncing student list...</p>
            ) : !students || students.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-10">No students allocated in this class grade.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {students?.map((stu: any) => {
                  const currentStatus = getStudentStatus(stu.id);
                  return (
                    <div key={stu.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20 flex items-center justify-center font-bold text-xs uppercase">
                          {stu.profiles?.full_name?.[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-xs text-white block">{stu.profiles?.full_name}</span>
                          <span className="text-[10px] text-gray-500 mt-0.5 block">Roll: {stu.roll_number} • ID: {stu.student_id}</span>
                        </div>
                      </div>

                      {/* Manual Toggles */}
                      <div className="flex items-center gap-2">
                        {(['present', 'late', 'absent'] as const).map((statusOption) => {
                          const isActive = currentStatus === statusOption;
                          const colorClasses = {
                            present: isActive ? 'bg-cyber-success/20 border-cyber-success text-cyber-success' : 'bg-transparent text-gray-500 hover:text-white',
                            late: isActive ? 'bg-cyber-warning/20 border-cyber-warning text-cyber-warning' : 'bg-transparent text-gray-500 hover:text-white',
                            absent: isActive ? 'bg-cyber-danger/20 border-cyber-danger text-cyber-danger' : 'bg-transparent text-gray-500 hover:text-white'
                          };
                          return (
                            <button
                              key={statusOption}
                              onClick={() => logAttendanceMutation.mutate({ studentId: stu.id, status: statusOption })}
                              className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider border-white/5 transition-all duration-150 ${colorClasses[statusOption]}`}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QR CODE GENERATOR MODAL */}
      <AnimatePresence>
        {showQRModal && activeQRClassId && activeClassName && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-[#0c0d16] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative text-center p-6"
            >
              <button 
                onClick={() => setShowQRModal(false)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                Close
              </button>

              <div className="mb-4">
                <QrCode size={48} className="mx-auto text-cyber-primary mb-2" />
                <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                  Active Attendance Session
                </h3>
                <p className="text-xs text-cyber-secondary font-semibold mt-1">
                  Class: {activeClassName.grade_name} - {activeClassName.section}
                </p>
              </div>

              {/* Generated Session QR Code */}
              <div className="my-6 bg-white p-4 rounded-xl inline-block shadow-xl border border-white/10 relative">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(activeQRClassId)}`}
                  alt="Class QR Code Session"
                  className="w-[150px] h-[150px]"
                />
              </div>

              {/* Dynamic QR Session code token box */}
              <div className="bg-[#05060b] border border-white/5 rounded-lg p-3 text-left">
                <span className="text-[9px] uppercase font-bold text-gray-500 block mb-1">SCAN TOKEN KEY</span>
                <span className="font-mono text-xs text-cyber-secondary select-all font-bold block">{activeQRClassId}</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-2.5">
                Students must paste this token inside their Attendance portal checks to log in automatically.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
