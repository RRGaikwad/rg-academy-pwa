import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, onClick, hoverable, padding = 'md' }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-sm',
        hoverable &&
          'cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-150',
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'purple' | 'sky';
  subtitle?: string;
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-[#1A3C5E] text-white', text: 'text-[#1A3C5E]' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700' },
  amber: { bg: 'bg-amber-50', icon: 'bg-amber-500 text-white', text: 'text-amber-700' },
  red: { bg: 'bg-red-50', icon: 'bg-red-600 text-white', text: 'text-red-700' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600 text-white', text: 'text-purple-700' },
  sky: { bg: 'bg-sky-50', icon: 'bg-sky-500 text-white', text: 'text-sky-700' },
};

export function StatCard({ title, value, icon, color = 'blue', subtitle }: StatCardProps) {
  const colors = colorMap[color];
  return (
    <Card className={cn(colors.bg, 'border-0')}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', colors.text)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl flex-shrink-0', colors.icon)}>{icon}</div>
      </div>
    </Card>
  );
}
