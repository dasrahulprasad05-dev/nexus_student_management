import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isSupabaseConfigured } from './lib/supabase';
import { SetupInstructions } from './components/SetupInstructions';
import { AuthProvider, useAuth } from './context/AuthContext';

// Authentication Views
import { Login } from './components/Login';
import { ForgotPassword } from './components/ForgotPassword';
import { ResetPassword } from './components/ResetPassword';

// Layout & Dashboard Panels
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { ParentDashboard } from './components/ParentDashboard';

// Module Panels
import { StudentDirectory } from './components/StudentDirectory';
import { AttendanceTracker } from './components/AttendanceTracker';
import { Gradebook } from './components/Gradebook';
import { AssignmentHub } from './components/AssignmentHub';
import { FeeConsole } from './components/FeeConsole';
import { NoticeBoard } from './components/NoticeBoard';
import { AIAcademicAssistant } from './components/AIAcademicAssistant';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to enforce authentication and profile role loading
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center text-gray-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-cyber-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse text-cyber-secondary">Syncing secure connection...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center text-gray-200 p-6">
        <div className="glass-card max-w-md p-8 rounded-xl border-cyber-danger/30 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Profile Synced</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Authenticated successfully, but could not find a profile linked to your user ID.
            Please verify you executed `seed.sql` inside your Supabase SQL console.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="glass-button-primary w-full"
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Router paths helper based on user role
const RootRedirect: React.FC = () => {
  const { profile } = useAuth();

  if (!profile) return <Navigate to="/login" replace />;

  switch (profile.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'teacher':
      return <Navigate to="/teacher" replace />;
    case 'student':
      return <Navigate to="/student" replace />;
    case 'parent':
      return <Navigate to="/parent" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const MainRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated Application routes */}
      <Route
        path="/"
        element={
          <AuthGuard>
            <Layout />
          </AuthGuard>
        }
      >
        <Route index element={<RootRedirect />} />
        
        {/* Dashboards */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="teacher" element={<TeacherDashboard />} />
        <Route path="student" element={<StudentDashboard />} />
        <Route path="parent" element={<ParentDashboard />} />

        {/* Modules */}
        <Route path="students" element={<StudentDirectory />} />
        <Route path="attendance" element={<AttendanceTracker />} />
        <Route path="gradebook" element={<Gradebook />} />
        <Route path="assignments" element={<AssignmentHub />} />
        <Route path="finance" element={<FeeConsole />} />
        <Route path="notices" element={<NoticeBoard />} />
        <Route path="ai-assistant" element={<AIAcademicAssistant />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  // Direct Check - Block render if database is unconfigured
  if (!isSupabaseConfigured) {
    return <SetupInstructions />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <MainRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
