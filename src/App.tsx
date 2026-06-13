import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { setupAuthListener } from './firebase/auth';
import { RoleGuard, AuthGuard } from './components/shared/RoleGuard';

// Pages
import { LoginPage } from './pages/Login';

// Admin
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminStudents } from './pages/admin/Students';
import { AdminTeachers } from './pages/admin/Teachers';
import { AdminBatches } from './pages/admin/Batches';
import { AdminFees } from './pages/admin/Fees';
import { AdminAnnouncements } from './pages/admin/Announcements';

// Teacher
import { TeacherDashboard } from './pages/teacher/Dashboard';
import { TeacherAttendance } from './pages/teacher/Attendance';
import { TeacherExams } from './pages/teacher/Exams';
import { TeacherMaterials } from './pages/teacher/Materials';
import { TeacherAnnouncements } from './pages/teacher/Announcements';

// Student
import { StudentDashboard } from './pages/student/Dashboard';
import { StudentMaterials } from './pages/student/Materials';
import { StudentExamPortal } from './pages/student/ExamPortal';
import { StudentLeaderboard } from './pages/student/Leaderboard';
import { StudentNotifications } from './pages/student/Notifications';

export default function App() {
  useEffect(() => {
    const unsubscribe = setupAuthListener();

    const handleOnline = () => toast.success('Back online! Syncing data...');
    const handleOffline = () =>
      toast.error('You are offline. Showing cached data.', { duration: 5000 });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login */}
        <Route
          path="/login"
          element={
            <AuthGuard>
              <LoginPage />
            </AuthGuard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <RoleGuard allowedRole="admin">
              <Navigate to="/admin/dashboard" replace />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RoleGuard allowedRole="admin">
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/students"
          element={
            <RoleGuard allowedRole="admin">
              <AdminStudents />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <RoleGuard allowedRole="admin">
              <AdminTeachers />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/batches"
          element={
            <RoleGuard allowedRole="admin">
              <AdminBatches />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/fees"
          element={
            <RoleGuard allowedRole="admin">
              <AdminFees />
            </RoleGuard>
          }
        />
        <Route
          path="/admin/announcements"
          element={
            <RoleGuard allowedRole="admin">
              <AdminAnnouncements />
            </RoleGuard>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <RoleGuard allowedRole="teacher">
              <Navigate to="/teacher/dashboard" replace />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <RoleGuard allowedRole="teacher">
              <TeacherDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <RoleGuard allowedRole="teacher">
              <TeacherAttendance />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/exams"
          element={
            <RoleGuard allowedRole="teacher">
              <TeacherExams />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/materials"
          element={
            <RoleGuard allowedRole="teacher">
              <TeacherMaterials />
            </RoleGuard>
          }
        />
        <Route
          path="/teacher/announcements"
          element={
            <RoleGuard allowedRole="teacher">
              <TeacherAnnouncements />
            </RoleGuard>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student"
          element={
            <RoleGuard allowedRole="student">
              <Navigate to="/student/dashboard" replace />
            </RoleGuard>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <RoleGuard allowedRole="student">
              <StudentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="/student/materials"
          element={
            <RoleGuard allowedRole="student">
              <StudentMaterials />
            </RoleGuard>
          }
        />
        <Route
          path="/student/exams"
          element={
            <RoleGuard allowedRole="student">
              <StudentExamPortal />
            </RoleGuard>
          }
        />
        <Route
          path="/student/exam/:examId"
          element={
            <RoleGuard allowedRole="student">
              <StudentExamPortal />
            </RoleGuard>
          }
        />
        <Route
          path="/student/leaderboard"
          element={
            <RoleGuard allowedRole="student">
              <StudentLeaderboard />
            </RoleGuard>
          }
        />
        <Route
          path="/student/notifications"
          element={
            <RoleGuard allowedRole="student">
              <StudentNotifications />
            </RoleGuard>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
