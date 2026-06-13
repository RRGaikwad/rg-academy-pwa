import { Menu, Bell } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const { toggleSidebar } = useUIStore();
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-[#1A3C5E] flex items-center justify-center text-white font-semibold text-sm">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
