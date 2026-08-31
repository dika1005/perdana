import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-text-main mb-1">{title}</h1>
      {subtitle && <p className="text-text-muted text-xs sm:text-sm">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2.5">{actions}</div>}
  </div>
);
