import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { Role } from '../types';

interface AppLayoutProps {
  role: Role;
  title: string;
  children: React.ReactNode;
}

export function AppLayout({ role, title, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title={title} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
