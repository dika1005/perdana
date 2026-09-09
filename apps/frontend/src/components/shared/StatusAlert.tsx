import React from 'react';
import { AlertCircle } from 'lucide-react';

export interface StatusAlertProps {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  className?: string;
}

/** Kotak peringatan berjudul untuk pesan status (error/warning/info). */
export const StatusAlert: React.FC<StatusAlertProps> = ({
  icon = <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />,
  title,
  children,
  className = '',
}) => (
  <div className={`p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-3 anim-fade-in ${className}`}>
    {icon}
    <div>
      <p className="font-bold text-sm">{title}</p>
      {children && <div className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{children}</div>}
    </div>
  </div>
);