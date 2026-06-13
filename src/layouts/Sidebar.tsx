import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  Megaphone,
  ClipboardList,
  FileText,
  Trophy,
  Bell,
  LogOut,
  X,
  BookMarked,
  ChevronRight,
} from 'lucide-react';
import type { Role } from '../types';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: Record<Role, NavItem[]> = {
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/admin/students', label: 'Students', icon: <GraduationCap size={18} /> },
    { path: '/admin/teachers', label: 'Teachers', icon: <Users size={18} /> },
    { path: '/admin/batches', label: 'Batches', icon: <BookOpen size={18} /> },
    { path: '/admin/fees', label: 'Fees', icon: <CreditCard size={18} /> },
    { path: '/admin/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  ],
  teacher: [
    { path: '/teacher/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/teacher/attendance', label: 'Attendance', icon: <ClipboardList size={18} /> },
    { path: '/teacher/exams', label: 'MCQ Exams', icon: <FileText size={18} /> },
    { path: '/teacher/materials', label: 'Study Materials', icon: <BookMarked size={18} /> },
    { path: '/teacher/announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
  ],
  student: [
    { path: '/student/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { path: '/student/materials', label: 'Study Materials', icon: <BookMarked size={18} /> },
    { path: '/student/exams', label: 'Exam Portal', icon: <FileText size={18} /> },
    { path: '/student/leaderboard', label: 'Leaderboard', icon: <Trophy size={18} /> },
    { path: '/student/notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ],
};

const roleLabels: Record<Role, string> = {
  admin: 'Admin Portal',
  teacher: 'Teacher Portal',
  student: 'Student Portal',
};

const roleColors: Record<Role, string> = {
  admin: 'bg-[#1A3C5E]',
  teacher: 'bg-[#1a4d3c]',
  student: 'bg-[#4a1a5e]',
};

interface SidebarProps {
  role: Role;
}

export function Sidebar({ role }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const navigate = useNavigate();
  const items = navItems[role];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className={cn('flex flex-col h-full', roleColors[role])}>
      {/* Logo & Header */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">RG Academy</p>
              <p className="text-white/60 text-xs">{roleLabels[role]}</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white p-1"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            <ChevronRight size={14} className="opacity-40" />
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all w-full"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
