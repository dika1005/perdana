import React from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

const BADGE_CLASS: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400',
  danger: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400',
  info: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400',
  brand: 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400',
};

export interface BadgeProps {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', icon, children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${BADGE_CLASS[variant]} ${className}`}
  >
    {icon}
    {children}
  </span>
);
