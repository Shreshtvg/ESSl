import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { ToastProvider } from './contexts/ToastContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// LAyout
import DashboardLayout from './layouts/DashboardLayout';

// Pages imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Departments from './pages/Departments';
import Employees from './pages/Employees';
import Designations from './pages/Designations';
import Shifts from './pages/Shifts';
import Roster from './pages/Roster';
import LeaveRequests from './pages/LeaveRequests';
import AttendanceChanges from './pages/AttendanceChanges';
import Holidays from './pages/Holidays';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Profile from './pages/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

// Guard checks secure session
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div id="route-loading" className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
        <NotificationsProvider>
        <HashRouter>
          <Routes>
            {/* LOGIN ACCESS */}
            <Route path="/login" element={<Login />} />

            {/* SECURE ERP PATHS */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute><Departments /></ProtectedRoute>} />
            <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
            <Route path="/designations" element={<ProtectedRoute><Designations /></ProtectedRoute>} />
            <Route path="/shifts" element={<ProtectedRoute><Shifts /></ProtectedRoute>} />
            <Route path="/roster" element={<ProtectedRoute><Roster /></ProtectedRoute>} />
            <Route path="/leaves" element={<ProtectedRoute><LeaveRequests /></ProtectedRoute>} />
            <Route path="/changes" element={<ProtectedRoute><AttendanceChanges /></ProtectedRoute>} />
            <Route path="/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* FALLBACK REDIRECT */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
        </NotificationsProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
