import React from 'react';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
    <div className="p-4 rounded-2xl skeuo-inset text-text-muted mb-4">{icon}</div>
    <h3 className="text-sm font-bold text-text-main">{title}</h3>
    {description && <p className="text-xs text-text-muted mt-1 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
