import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

const variants = {
  default: 'bg-blue-100 text-blue-800 border border-blue-200',
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200',
  danger: 'bg-red-100 text-red-800 border border-red-200',
  info: 'bg-sky-100 text-sky-800 border border-sky-200',
  neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
