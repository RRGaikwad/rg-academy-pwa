import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';

interface RoleGuardProps {
  allowedRole: Role;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    // Redirect to their own dashboard
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuthStore();
  if (isAuthenticated) {
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'teacher':
        return <Navigate to="/teacher/dashboard" replace />;
      case 'student':
        return <Navigate to="/student/dashboard" replace />;
    }
  }
  return <>{children}</>;
}
